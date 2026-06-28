import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { revalidatePublicCatalog } from "@/lib/formations/revalidate-public";
import { isAllowedBuyerEmail, ALLOWED_BUYER_EMAIL_MESSAGE } from "@/lib/email/allowed-buyer-email";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import {
  sendEnrollmentConfirmedEmail,
  sendDigitalProductDeliveryEmail,
  sendNewStudentNotificationEmail,
} from "@/lib/email/formations";
import { PLATFORM_COMMISSION_RATE, VENDOR_NET_RATE } from "@/lib/formations/constants";
import crypto from "crypto";
import { cookies } from "next/headers";
import { initPayment as initMoneroo, isMonerooConfigured } from "@/lib/moneroo";
import { initPayment as initPayGenius, isPayGeniusConfigured } from "@/lib/paygenius";

type PaymentProvider = "moneroo" | "paygenius";
function resolveProvider(_raw: unknown): PaymentProvider {
  // Provider actif piloté par env PAYMENT_PROVIDER. Basculé sur Moneroo le
  // 2026-06-27 (settlement GeniusPay bloqué). Revenir à GeniusPay = PAYMENT_PROVIDER=paygenius.
  const _pref = (process.env.PAYMENT_PROVIDER || "moneroo").toLowerCase();
  if (_pref === "paygenius" && isPayGeniusConfigured()) return "paygenius";
  if (isMonerooConfigured()) return "moneroo";
  return isPayGeniusConfigured() ? "paygenius" : "moneroo";
}
import { fulfillCheckout } from "@/lib/formations/fulfillment";

/**
 * POST /api/formations/checkout
 * Body: {
 *   formationIds?: string[];
 *   productIds?: string[];
 *   paymentMethod?: "orange_money" | "wave" | "mtn" | "card" | "free";
 *   discountCode?: string;          // e.g. "PROMO20"
 *   clearCart?: boolean;            // default true
 *   // Guest checkout (when not authenticated)
 *   guestEmail?: string;
 *   guestName?: string;
 * }
 *
 * Real checkout : creates Enrollment / DigitalProductPurchase, applies discount,
 * increments stats, sends confirmation emails. Allows guest checkout.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    let userId: string | null = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);

    // Guest checkout — create or find user by email
    if (!userId && body.guestEmail) {
      const email = String(body.guestEmail).trim().toLowerCase();
      if (!isAllowedBuyerEmail(email)) {
        return NextResponse.json({ error: ALLOWED_BUYER_EMAIL_MESSAGE }, { status: 400 });
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        userId = existing.id;
      } else {
        const random = crypto.randomBytes(32).toString("hex");
        const newUser = await prisma.user.create({
          data: {
            email,
            name: body.guestName?.trim() || email.split("@")[0],
            passwordHash: random, // user must reset to login
            // Schema UserRole n'a pas APPRENANT — un acheteur de formation est mappé à CLIENT.
            role: "CLIENT",
            status: "ACTIF",
          },
        });
        userId = newUser.id;
      }
    }

    if (!userId) return NextResponse.json({ error: "Non authentifié — fournissez guestEmail" }, { status: 401 });

    const formationIds: string[] = Array.isArray(body.formationIds) ? body.formationIds : [];
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : [];
    const paymentMethod: string = body.paymentMethod ?? "orange_money";
    const clearCart: boolean = body.clearCart !== false;
    const discountCodeStr: string | null = body.discountCode?.trim().toUpperCase() || null;

    if (formationIds.length === 0 && productIds.length === 0) {
      return NextResponse.json({ error: "Aucun produit dans la commande" }, { status: 400 });
    }

    // Fetch items + user
    const [formations, products, user] = await Promise.all([
      formationIds.length > 0
        ? prisma.formation.findMany({
            where: { id: { in: formationIds }, status: "ACTIF" },
            select: {
              id: true,
              slug: true,
              title: true,
              price: true,
              instructeurId: true,
              shopId: true,
              instructeur: {
                select: {
                  user: { select: { id: true, email: true, name: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
      productIds.length > 0
        ? prisma.digitalProduct.findMany({
            where: { id: { in: productIds }, status: "ACTIF" },
            select: {
              id: true,
              slug: true,
              title: true,
              price: true,
              instructeurId: true,
              shopId: true,
              productType: true,
              fileUrl: true,
              files: {
                orderBy: { order: "asc" },
                select: { name: true, url: true },
              },
              instructeur: {
                select: {
                  user: { select: { id: true, email: true, name: true } },
                },
              },
            },
          })
        : Promise.resolve([]),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    ]);

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    if (formations.length !== formationIds.length || products.length !== productIds.length) {
      return NextResponse.json({ error: "Certains produits sont indisponibles" }, { status: 400 });
    }

    const subTotal = formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0);

    // Apply discount code
    let discountAmount = 0;
    let appliedCode: { id: string; code: string; hasMaxUses: boolean } | null = null;
    if (discountCodeStr) {
      const code = await prisma.discountCode.findUnique({
        where: { code: discountCodeStr },
      });
      if (!code || !code.isActive) {
        return NextResponse.json({ error: "Code promo invalide ou expiré" }, { status: 400 });
      }
      if (code.expiresAt && code.expiresAt < new Date()) {
        return NextResponse.json({ error: "Code promo expiré" }, { status: 400 });
      }
      if (code.maxUses && code.usedCount >= code.maxUses) {
        return NextResponse.json({ error: "Code promo épuisé" }, { status: 400 });
      }
      // ── Atomic per-user limit ────────────────────────────────────────
      // Avant toute reservation globale : vérifier que CET utilisateur
      // n'a pas déjà épuisé son quota personnel sur ce code.
      // (la vraie atomicité se fait via le @@unique([discountId,userId,orderId])
      // au moment de la création du DiscountUsage en post-fulfillment)
      if (code.maxUsesPerUser != null) {
        const userPriorUses = await prisma.discountUsage.count({
          where: { discountId: code.id, userId },
        });
        if (userPriorUses >= code.maxUsesPerUser) {
          return NextResponse.json(
            { error: "Vous avez déjà utilisé ce code le nombre maximum de fois" },
            { status: 400 },
          );
        }
      }
      // Atomic claim: increment usedCount only if still under maxUses (prevents race condition)
      if (code.maxUses) {
        const claimed = await prisma.discountCode.updateMany({
          where: { id: code.id, usedCount: { lt: code.maxUses } },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) {
          return NextResponse.json({ error: "Code promo épuisé (concurrent)" }, { status: 400 });
        }
      }
      if (code.minOrderAmount && subTotal < code.minOrderAmount) {
        return NextResponse.json({
          error: `Montant minimum requis : ${code.minOrderAmount} FCFA`,
        }, { status: 400 });
      }
      // Compute discount
      if (code.discountType === "PERCENTAGE") {
        discountAmount = Math.round(subTotal * (code.discountValue / 100));
      } else {
        discountAmount = Math.min(code.discountValue, subTotal);
      }
      appliedCode = { id: code.id, code: code.code, hasMaxUses: !!code.maxUses };
    }

    const totalAmount = Math.max(0, subTotal - discountAmount);
    const sessionRef = `${paymentMethod}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;

    // ── Affiliate attribution ─────────────────────────────────────────────
    // Reads the `fh_aff_code` cookie set when visitor landed via an affiliate link.
    let affiliateProfile: {
      id: string;
      programId: string;
      userId: string;
    } | null = null;
    let affiliateCommissionRate = 0;
    try {
      const cookieStore = await cookies();
      // Primary cookie name used by the AffiliateTracker component
      const affCookie =
        cookieStore.get("fh_ref")?.value ?? cookieStore.get("fh_aff_code")?.value;
      if (affCookie) {
        const prof = await prisma.affiliateProfile.findUnique({
          where: { affiliateCode: affCookie },
          select: { id: true, programId: true, userId: true, status: true, program: { select: { commissionPct: true, isActive: true } } },
        });
        if (prof && prof.status === "ACTIVE" && prof.program.isActive) {
          affiliateProfile = { id: prof.id, programId: prof.programId, userId: prof.userId };
          affiliateCommissionRate = (prof.program.commissionPct ?? 0) / 100;
        }
      }
    } catch (err) {
      console.warn("[checkout affiliate cookie]", err);
    }

    // ── Campaign attribution ──────────────────────────────────────────────
    // Lit le cookie `fh_campaign` posé par /api/marketing/campaigns/[slug]
    // quand le visiteur arrive via un lien de campagne tracké. On garde juste
    // le slug ; le webhook créditera conversions + revenu après paiement.
    let campaignSlug = "";
    try {
      const cookieStore = await cookies();
      const raw = cookieStore.get("fh_campaign")?.value;
      if (raw) {
        const parsed = JSON.parse(raw) as { slug?: string };
        if (parsed?.slug) campaignSlug = String(parsed.slug);
      }
    } catch {
      /* cookie absent ou illisible : pas d'attribution campagne */
    }

    // ─── Payment processing ──────────────────────────────────────
    // Si Moneroo est configuré ET commande payante, on redirige vers Moneroo.
    // Le fulfillment (création enrollments + crédit wallet + emails) se fera
    // dans /api/webhooks/moneroo après confirmation réelle du paiement.
    //
    // Commandes gratuites (totalAmount = 0) : fulfillment immédiat.
    // Moneroo non configuré (ex. dev) : fulfillment immédiat (mode mock).
    const isFree = totalAmount <= 0 || paymentMethod === "free";
    const requestedProvider: PaymentProvider = resolveProvider((body as { provider?: string }).provider);
    const providerConfigured =
      requestedProvider === "paygenius" ? isPayGeniusConfigured() : isMonerooConfigured();
    const useProvider = !isFree && providerConfigured;

    if (useProvider) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
      const fName = user.name ?? user.email.split("@")[0];
      const [first, ...rest] = fName.split(" ");
      const last = rest.join(" ") || first;

      const sharedMeta = {
        type: "formations_checkout",
        sessionRef,
        userId,
        formationIds: JSON.stringify(formationIds),
        productIds: JSON.stringify(productIds),
        discountCode: discountCodeStr ?? "",
        affiliateProfileId: affiliateProfile?.id ?? "",
        affiliateCommissionRate: String(affiliateCommissionRate),
        campaignSlug,
        paymentMethod,
        paymentProvider: requestedProvider,
      };
      const description = `Commande Novakou #${sessionRef}`;
      const returnUrl = `${appUrl}/payment/return?ref=${encodeURIComponent(sessionRef)}&provider=${requestedProvider}`;

      try {
        let checkoutUrl: string;
        let providerRefId: string;

        if (requestedProvider === "paygenius") {
          const pg = await initPayGenius({
            amount: totalAmount,
            currency: "XOF",
            description,
            customer: { email: user.email, name: `${first || "Client"} ${last || ""}`.trim() },
            return_url: returnUrl,
            metadata: sharedMeta,
          });
          checkoutUrl = pg.checkout_url;
          providerRefId = pg.reference;
        } else {
          const mnr = await initMoneroo({
            amount: totalAmount,
            currency: "XOF",
            description,
            customer: {
              email: user.email,
              first_name: first || "Client",
              last_name: last || "—",
            },
            return_url: returnUrl,
            metadata: sharedMeta,
          });
          checkoutUrl = mnr.checkout_url;
          providerRefId = mnr.id;
        }

        return NextResponse.json({
          data: {
            needsPayment: true,
            checkoutUrl,
            provider: requestedProvider,
            // Champs historiques conservés pour rétro-compat
            monerooPaymentId: requestedProvider === "moneroo" ? providerRefId : undefined,
            providerRef: providerRefId,
            sessionRef,
            subTotal,
            discountAmount,
            totalAmount,
          },
        });
      } catch (err) {
        console.error(`[checkout] ${requestedProvider} init failed:`, err);
        // CRITICAL FIX: Do NOT fall through to free fulfillment — return error
        return NextResponse.json(
          {
            error: "Erreur lors de l'initialisation du paiement. Veuillez réessayer.",
            details: IS_DEV ? String(err) : undefined,
          },
          { status: 502 },
        );
      }
    }
    // ─────────────────────────────────────────────────────────────
    // Fulfillment immédiat (commande gratuite OU Moneroo indisponible/mock)
    const paymentStatus: "paid" | "pending" | "failed" = "paid";

    if (paymentStatus !== "paid") {
      return NextResponse.json({ error: "Paiement échoué" }, { status: 402 });
    }

    const skipped: string[] = [];

    // Distribute discount proportionally across items
    const applyDiscount = (price: number) => subTotal > 0 ? Math.round(price * (totalAmount / subTotal)) : price;

    // FIX: Wrap entire fulfillment in a single Prisma transaction to prevent partial writes
    const { createdEnrollments, createdPurchases } = await prisma.$transaction(async (tx) => {
      const txEnrollments: { id: string; title: string; price: number }[] = [];
      const txPurchases: { id: string; title: string; price: number }[] = [];

      for (const f of formations) {
        const existing = await tx.enrollment.findUnique({
          where: { userId_formationId: { userId, formationId: f.id } },
        });
        if (existing) { skipped.push(f.title); continue; }
        const finalPrice = applyDiscount(f.price);
        const enrollment = await tx.enrollment.create({
          data: {
            userId,
            formationId: f.id,
            paidAmount: finalPrice,
            stripeSessionId: sessionRef,
          },
        });

        const isSelfReferral =
          !!affiliateProfile && (
            affiliateProfile.userId === f.instructeur.user.id ||
            affiliateProfile.userId === userId
          );
        const effectiveAffiliate = isSelfReferral ? null : affiliateProfile;

        const platformAmount = Math.round(finalPrice * PLATFORM_COMMISSION_RATE);
        const affAmount = effectiveAffiliate ? Math.round(finalPrice * affiliateCommissionRate) : 0;
        const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);
        const commissionAmount = platformAmount;

        await tx.instructeurProfile.update({
          where: { id: f.instructeurId },
          data: { totalEarned: { increment: vendorNet } },
        });
        await tx.formation.update({
          where: { id: f.id },
          data: { studentsCount: { increment: 1 } },
        });

        await tx.platformRevenue.create({
          data: {
            orderId: enrollment.id,
            orderType: "formation",
            grossAmount: finalPrice,
            commissionRate: PLATFORM_COMMISSION_RATE,
            commissionAmount,
            vendorAmount: vendorNet,
            affiliateId: effectiveAffiliate?.id ?? null,
            affiliateAmount: affAmount,
            paymentRef: sessionRef,
            currency: "XOF",
            instructeurId: f.instructeurId,
            shopId: f.shopId ?? null,
          },
        });

        if (effectiveAffiliate && affAmount > 0) {
          await tx.affiliateCommission.create({
            data: {
              affiliateId: effectiveAffiliate.id,
              orderId: enrollment.id,
              orderType: "formation",
              orderAmount: finalPrice,
              commissionPct: affiliateCommissionRate * 100,
              commissionAmount: affAmount,
              status: "PENDING",
            },
          });
          await tx.affiliateProfile.update({
            where: { id: effectiveAffiliate.id },
            data: {
              totalConversions: { increment: 1 },
              pendingEarnings: { increment: affAmount },
            },
          });
        }

        txEnrollments.push({ id: enrollment.id, title: f.title, price: finalPrice });
      }

      for (const p of products) {
        const existing = await tx.digitalProductPurchase.findFirst({ where: { userId, productId: p.id } });
        if (existing) { skipped.push(p.title); continue; }
        const finalPrice = applyDiscount(p.price);
        const purchase = await tx.digitalProductPurchase.create({
          data: {
            userId,
            productId: p.id,
            paidAmount: finalPrice,
            stripeSessionId: sessionRef,
          },
        });

        const isSelfReferralProd =
          !!affiliateProfile && (
            affiliateProfile.userId === p.instructeur.user.id ||
            affiliateProfile.userId === userId
          );
        const effectiveAffiliateProd = isSelfReferralProd ? null : affiliateProfile;

        const platformAmount = Math.round(finalPrice * PLATFORM_COMMISSION_RATE);
        const affAmount = effectiveAffiliateProd ? Math.round(finalPrice * affiliateCommissionRate) : 0;
        const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);
        const commissionAmount = platformAmount;

        await tx.instructeurProfile.update({
          where: { id: p.instructeurId },
          data: { totalEarned: { increment: vendorNet } },
        });
        await tx.digitalProduct.update({
          where: { id: p.id },
          // Audit 2026-05-26 : on incrémente AUSSI currentBuyers pour
          // que la jauge publique (qui prend max(currentBuyers, salesCount))
          // reste cohérente avec la réalité des ventes — alignement sur le
          // comportement du webhook Stripe qui faisait déjà les deux.
          data: { salesCount: { increment: 1 }, currentBuyers: { increment: 1 } },
        });

        await tx.platformRevenue.create({
          data: {
            orderId: purchase.id,
            orderType: "product",
            grossAmount: finalPrice,
            commissionRate: PLATFORM_COMMISSION_RATE,
            commissionAmount,
            vendorAmount: vendorNet,
            affiliateId: effectiveAffiliateProd?.id ?? null,
            affiliateAmount: affAmount,
            paymentRef: sessionRef,
            currency: "XOF",
            instructeurId: p.instructeurId,
            shopId: p.shopId ?? null,
          },
        });

        if (effectiveAffiliateProd && affAmount > 0) {
          await tx.affiliateCommission.create({
            data: {
              affiliateId: effectiveAffiliateProd.id,
              orderId: purchase.id,
              orderType: "product",
              orderAmount: finalPrice,
              commissionPct: affiliateCommissionRate * 100,
              commissionAmount: affAmount,
              status: "PENDING",
            },
          });
          await tx.affiliateProfile.update({
            where: { id: effectiveAffiliateProd.id },
            data: {
              totalConversions: { increment: 1 },
              pendingEarnings: { increment: affAmount },
            },
          });
        }

        txPurchases.push({ id: purchase.id, title: p.title, price: finalPrice });
      }

      return { createdEnrollments: txEnrollments, createdPurchases: txPurchases };
    });

    // Rafraîchir les pages publiques en cache (compteur de ventes) dès qu'une
    // vente fraîche est enregistrée — sinon la home/fiche reste figée (ISR 300s).
    if (createdEnrollments.length + createdPurchases.length > 0) {
      revalidatePublicCatalog();
    }

    // Record discount usage
    if (appliedCode && (createdEnrollments.length + createdPurchases.length) > 0) {
      const orderId = sessionRef;
      // usedCount already incremented atomically above for codes with maxUses
      await prisma.discountCode.update({
        where: { id: appliedCode.id },
        data: {
          ...(!appliedCode.hasMaxUses ? { usedCount: { increment: 1 } } : {}),
          totalDiscounted: { increment: discountAmount },
          revenue: { increment: totalAmount },
        },
      });
      await prisma.discountUsage
        .create({
          data: {
            discountId: appliedCode.id,
            userId,
            orderType: createdEnrollments.length > 0 ? "formation" : "product",
            orderId,
            originalAmount: subTotal,
            discountAmount,
            finalAmount: totalAmount,
          },
        })
        .catch((err) => {
          // P2002 = unique constraint (discountId, userId, orderId) — déjà créé, idempotent
          if ((err as { code?: string }).code === "P2002") return null;
          console.warn("[checkout discountUsage]", err);
          return null;
        });
    }

    if (clearCart && formationIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { userId, formationId: { in: formationIds } },
      }).catch(() => null);
    }

    if (createdEnrollments.length + createdPurchases.length > 0) {
      const itemTitles = [...createdEnrollments, ...createdPurchases].map((i) => i.title).slice(0, 3).join(", ");
      const moreCount = createdEnrollments.length + createdPurchases.length - 3;
      const summary = moreCount > 0 ? `${itemTitles} et ${moreCount} autre(s)` : itemTitles;
      await prisma.notification.create({
        data: {
          userId,
          type: "ORDER",
          title: "Achat confirmé",
          message: `Votre achat est confirmé : ${summary}.`,
          link: createdEnrollments.length > 0 ? "/apprenant/mes-formations" : "/apprenant/mes-produits",
        },
      }).catch(() => null);
    }

    // Send emails + notify vendors of each new sale
    try {
      const fName = user.name ?? user.email.split("@")[0];
      const eurRate = 655.957;

      for (const f of formations) {
        const created = createdEnrollments.find((e) => e.title === f.title);
        if (!created) continue;

        // Buyer confirmation
        await sendEnrollmentConfirmedEmail({
          email: user.email,
          name: fName,
          formationTitle: f.title,
          formationSlug: f.slug,
          paidAmount: Number((created.price / eurRate).toFixed(2)),
          locale: "fr",
        }).catch((err) => console.warn("[email enrollment]", err));

        // Vendor notification — email + in-app
        const vendorEmail = f.instructeur?.user?.email;
        const vendorName = f.instructeur?.user?.name ?? "Vendeur";
        const vendorUserId = f.instructeur?.user?.id;
        if (vendorEmail) {
          await sendNewStudentNotificationEmail({
            instructeurEmail: vendorEmail,
            instructeurName: vendorName,
            studentName: fName,
            formationTitle: f.title,
            paidAmount: created.price,
          }).catch((err) => console.warn("[email vendor sale]", err));
        }
        if (vendorUserId) {
          await prisma.notification.create({
            data: {
              userId: vendorUserId,
              type: "ORDER",
              title: "Nouvelle vente !",
              message: `${fName} vient d'acheter votre formation « ${f.title} » pour ${Math.round(created.price * VENDOR_NET_RATE)} FCFA nets.`,
              link: "/vendeur/dashboard",
            },
          }).catch(() => null);
        }
      }

      for (const p of products) {
        const created = createdPurchases.find((q) => q.title === p.title);
        if (!created) continue;

        const downloadUrl =
          p.files?.[0]?.url ?? p.fileUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/apprenant/mes-produits`;
        await sendDigitalProductDeliveryEmail({
          email: user.email,
          name: fName,
          productTitle: p.title,
          downloadUrl,
          files: Array.isArray(p.files) && p.files.length > 0 ? p.files : undefined,
          locale: "fr",
        }).catch((err) => console.warn("[email product]", err));

        // Vendor notification — email + in-app
        const vendorEmail = p.instructeur?.user?.email;
        const vendorName = p.instructeur?.user?.name ?? "Vendeur";
        const vendorUserId = p.instructeur?.user?.id;
        if (vendorEmail) {
          await sendNewStudentNotificationEmail({
            instructeurEmail: vendorEmail,
            instructeurName: vendorName,
            studentName: fName,
            formationTitle: p.title,
            paidAmount: created.price,
          }).catch((err) => console.warn("[email vendor sale]", err));
        }
        if (vendorUserId) {
          await prisma.notification.create({
            data: {
              userId: vendorUserId,
              type: "ORDER",
              title: "Nouvelle vente !",
              message: `${fName} vient d'acheter votre produit « ${p.title} » pour ${Math.round(created.price * VENDOR_NET_RATE)} FCFA nets.`,
              link: "/vendeur/dashboard",
            },
          }).catch(() => null);
        }
      }
    } catch (err) {
      console.warn("[checkout emails]", err);
    }

    return NextResponse.json({
      data: {
        success: true,
        sessionRef,
        subTotal,
        discountAmount,
        totalAmount,
        netToInstructor: totalAmount * VENDOR_NET_RATE,
        commission: totalAmount * PLATFORM_COMMISSION_RATE,
        appliedCode: appliedCode?.code ?? null,
        enrollments: createdEnrollments,
        purchases: createdPurchases,
        skipped,
        recipient: { email: user.email, name: user.name },
        guestCreated: !session?.user && !!body.guestEmail,
      },
    });
  } catch (err) {
    console.error("[checkout POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
