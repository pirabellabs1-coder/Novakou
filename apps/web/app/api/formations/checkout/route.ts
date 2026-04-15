import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Email invalide" }, { status: 400 });
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
            role: "FREELANCE",
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
              productType: true,
              fileUrl: true,
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

    let subTotal = formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0);

    // Apply discount code
    let discountAmount = 0;
    let appliedCode: { id: string; code: string } | null = null;
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
      appliedCode = { id: code.id, code: code.code };
    }

    const totalAmount = Math.max(0, subTotal - discountAmount);
    const sessionRef = `${paymentMethod}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

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

    // ─── Payment processing (placeholder for real integration) ───
    // TODO: integrate CinetPay / Stripe properly
    // For now, if paymentMethod is "card" + Stripe configured → would create payment intent
    // If "orange_money/wave/mtn" + CinetPay configured → would init payment
    // For the moment we treat paymentMethod="free" or any → as paid (suitable for dev/MVP)
    const paymentStatus: "paid" | "pending" | "failed" = "paid";

    if (paymentStatus !== "paid") {
      return NextResponse.json({ error: "Paiement échoué" }, { status: 402 });
    }
    // ─────────────────────────────────────────────────────────────

    const createdEnrollments: { id: string; title: string; price: number }[] = [];
    const createdPurchases: { id: string; title: string; price: number }[] = [];
    const skipped: string[] = [];

    // Distribute discount proportionally across items
    const applyDiscount = (price: number) => subTotal > 0 ? Math.round(price * (totalAmount / subTotal)) : price;

    for (const f of formations) {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_formationId: { userId, formationId: f.id } },
      });
      if (existing) { skipped.push(f.title); continue; }
      const finalPrice = applyDiscount(f.price);
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          formationId: f.id,
          paidAmount: finalPrice,
          stripeSessionId: sessionRef,
        },
      });

      // Affiliate commission (if any) comes out of the platform's 5% share, NOT the vendor's
      const affAmount = affiliateProfile ? Math.round(finalPrice * affiliateCommissionRate) : 0;
      const commissionAmount = Math.round(finalPrice * PLATFORM_COMMISSION_RATE);
      const vendorNet = Math.round(finalPrice * VENDOR_NET_RATE);

      await prisma.instructeurProfile.update({
        where: { id: f.instructeurId },
        data: { totalEarned: { increment: vendorNet } },
      });
      await prisma.formation.update({
        where: { id: f.id },
        data: { studentsCount: { increment: 1 } },
      });

      // Track platform revenue
      await prisma.platformRevenue.create({
        data: {
          orderId: enrollment.id,
          orderType: "formation",
          grossAmount: finalPrice,
          commissionRate: PLATFORM_COMMISSION_RATE,
          commissionAmount,
          vendorAmount: vendorNet,
          affiliateId: affiliateProfile?.id ?? null,
          affiliateAmount: affAmount,
          paymentRef: sessionRef,
          currency: "XOF",
        },
      }).catch((e) => console.warn("[platformRevenue]", e));

      // Create affiliate commission record
      if (affiliateProfile && affAmount > 0) {
        await prisma.affiliateCommission.create({
          data: {
            affiliateId: affiliateProfile.id,
            orderId: enrollment.id,
            orderType: "formation",
            orderAmount: finalPrice,
            commissionPct: affiliateCommissionRate * 100,
            commissionAmount: affAmount,
            status: "PENDING", // will be approved after refund window
          },
        }).catch((e) => console.warn("[affiliateCommission]", e));
        await prisma.affiliateProfile.update({
          where: { id: affiliateProfile.id },
          data: {
            totalConversions: { increment: 1 },
            pendingEarnings: { increment: affAmount },
          },
        }).catch((e) => console.warn("[affiliateProfile update]", e));
      }

      createdEnrollments.push({ id: enrollment.id, title: f.title, price: finalPrice });
    }

    for (const p of products) {
      const existing = await prisma.digitalProductPurchase.findFirst({ where: { userId, productId: p.id } });
      if (existing) { skipped.push(p.title); continue; }
      const finalPrice = applyDiscount(p.price);
      const purchase = await prisma.digitalProductPurchase.create({
        data: {
          userId,
          productId: p.id,
          paidAmount: finalPrice,
          stripeSessionId: sessionRef,
        },
      });

      const affAmount = affiliateProfile ? Math.round(finalPrice * affiliateCommissionRate) : 0;
      const commissionAmount = Math.round(finalPrice * PLATFORM_COMMISSION_RATE);
      const vendorNet = Math.round(finalPrice * VENDOR_NET_RATE);

      await prisma.instructeurProfile.update({
        where: { id: p.instructeurId },
        data: { totalEarned: { increment: vendorNet } },
      });
      await prisma.digitalProduct.update({
        where: { id: p.id },
        data: { salesCount: { increment: 1 } },
      });

      await prisma.platformRevenue.create({
        data: {
          orderId: purchase.id,
          orderType: "product",
          grossAmount: finalPrice,
          commissionRate: PLATFORM_COMMISSION_RATE,
          commissionAmount,
          vendorAmount: vendorNet,
          affiliateId: affiliateProfile?.id ?? null,
          affiliateAmount: affAmount,
          paymentRef: sessionRef,
          currency: "XOF",
        },
      }).catch((e) => console.warn("[platformRevenue]", e));

      if (affiliateProfile && affAmount > 0) {
        await prisma.affiliateCommission.create({
          data: {
            affiliateId: affiliateProfile.id,
            orderId: purchase.id,
            orderType: "product",
            orderAmount: finalPrice,
            commissionPct: affiliateCommissionRate * 100,
            commissionAmount: affAmount,
            status: "PENDING",
          },
        }).catch((e) => console.warn("[affiliateCommission]", e));
        await prisma.affiliateProfile.update({
          where: { id: affiliateProfile.id },
          data: {
            totalConversions: { increment: 1 },
            pendingEarnings: { increment: affAmount },
          },
        }).catch((e) => console.warn("[affiliateProfile update]", e));
      }

      createdPurchases.push({ id: purchase.id, title: p.title, price: finalPrice });
    }

    // Record discount usage
    if (appliedCode && (createdEnrollments.length + createdPurchases.length) > 0) {
      const orderId = sessionRef;
      await prisma.discountCode.update({
        where: { id: appliedCode.id },
        data: {
          usedCount: { increment: 1 },
          totalDiscounted: { increment: discountAmount },
          revenue: { increment: totalAmount },
        },
      });
      await prisma.discountUsage.create({
        data: {
          discountId: appliedCode.id,
          userId,
          orderType: createdEnrollments.length > 0 ? "formation" : "product",
          orderId,
          originalAmount: subTotal,
          discountAmount,
          finalAmount: totalAmount,
        },
      }).catch(() => null);
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
          link: createdEnrollments.length > 0 ? "/formations/apprenant/mes-formations" : "/formations/apprenant/produits",
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
              link: "/formations/vendeur/dashboard",
            },
          }).catch(() => null);
        }
      }

      for (const p of products) {
        const created = createdPurchases.find((q) => q.title === p.title);
        if (!created) continue;

        const downloadUrl = p.fileUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/formations/apprenant/produits`;
        await sendDigitalProductDeliveryEmail({
          email: user.email,
          name: fName,
          productTitle: p.title,
          downloadUrl,
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
              link: "/formations/vendeur/dashboard",
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
