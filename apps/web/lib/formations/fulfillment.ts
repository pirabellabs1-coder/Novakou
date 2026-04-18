/**
 * Checkout fulfillment — logique partagée entre :
 *   - /api/formations/checkout (chemin "free" / mock)
 *   - /api/webhooks/moneroo (après confirmation réelle de paiement)
 *
 * Prend une commande validée (user + items + discount + affilié) et :
 *   1. Crée Enrollment / DigitalProductPurchase
 *   2. Crédite le wallet vendeur (instructeurProfile.totalEarned)
 *   3. Enregistre PlatformRevenue + AffiliateCommission
 *   4. Incrémente studentsCount / salesCount
 *   5. Enregistre DiscountUsage
 *   6. Envoie les emails de confirmation (acheteur + vendeur)
 *   7. Crée les notifications in-app
 *
 * Idempotent : si l'enrollment existe déjà pour (userId, formationId), on skip
 * (le webhook peut être appelé deux fois par Moneroo en cas de retry).
 */

import { prisma } from "@/lib/prisma";
import {
  sendEnrollmentConfirmedEmail,
  sendDigitalProductDeliveryEmail,
  sendNewStudentNotificationEmail,
} from "@/lib/email/formations";
import { PLATFORM_COMMISSION_RATE, VENDOR_NET_RATE } from "@/lib/formations/constants";

export interface FulfillParams {
  userId: string;
  formationIds: string[];
  productIds: string[];
  discountCodeStr: string | null;
  sessionRef: string;
  /** Optional affiliate attribution (from cookie at checkout init) */
  affiliate?: {
    profileId: string;
    commissionRate: number; // 0..1
  } | null;
}

export interface FulfillResult {
  success: true;
  sessionRef: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  netToInstructor: number;
  commission: number;
  appliedCode: string | null;
  enrollments: { id: string; title: string; price: number }[];
  purchases: { id: string; title: string; price: number }[];
  skipped: string[];
  recipient: { email: string; name: string };
}

export async function fulfillCheckout(p: FulfillParams): Promise<FulfillResult> {
  const { userId, formationIds, productIds, discountCodeStr, sessionRef } = p;
  const affiliate = p.affiliate ?? null;

  const [formations, products, user] = await Promise.all([
    formationIds.length > 0
      ? prisma.formation.findMany({
          where: { id: { in: formationIds }, status: "ACTIF" },
          select: {
            id: true, slug: true, title: true, price: true,
            instructeurId: true, shopId: true,
            instructeur: { select: { user: { select: { id: true, email: true, name: true } } } },
          },
        })
      : Promise.resolve([]),
    productIds.length > 0
      ? prisma.digitalProduct.findMany({
          where: { id: { in: productIds }, status: "ACTIF" },
          select: {
            id: true, slug: true, title: true, price: true, productType: true, fileUrl: true,
            instructeurId: true, shopId: true,
            instructeur: { select: { user: { select: { id: true, email: true, name: true } } } },
          },
        })
      : Promise.resolve([]),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
  ]);

  if (!user) throw new Error("Utilisateur introuvable");

  const subTotal = formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0);

  // Apply discount code (idempotent : on récupère le code mais on incrémente
  // usedCount seulement si on crée des enrollments)
  let discountAmount = 0;
  let appliedCode: { id: string; code: string } | null = null;
  if (discountCodeStr) {
    const code = await prisma.discountCode.findUnique({ where: { code: discountCodeStr } });
    if (code && code.isActive && (!code.expiresAt || code.expiresAt >= new Date())) {
      if (!code.minOrderAmount || subTotal >= code.minOrderAmount) {
        if (code.discountType === "PERCENTAGE") {
          discountAmount = Math.round(subTotal * (code.discountValue / 100));
        } else {
          discountAmount = Math.min(code.discountValue, subTotal);
        }
        appliedCode = { id: code.id, code: code.code };
      }
    }
  }

  const totalAmount = Math.max(0, subTotal - discountAmount);
  const applyDiscount = (price: number) => (subTotal > 0 ? Math.round(price * (totalAmount / subTotal)) : price);

  const createdEnrollments: { id: string; title: string; price: number }[] = [];
  const createdPurchases: { id: string; title: string; price: number }[] = [];
  const skipped: string[] = [];

  // ── Formations ──────────────────────────────────────────────────────
  for (const f of formations) {
    const existing = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId: f.id } },
    });
    if (existing) { skipped.push(f.title); continue; }

    const finalPrice = applyDiscount(f.price);
    const enrollment = await prisma.enrollment.create({
      data: { userId, formationId: f.id, paidAmount: finalPrice, stripeSessionId: sessionRef },
    });

    const platformAmount = Math.round(finalPrice * PLATFORM_COMMISSION_RATE);
    const affAmount = affiliate ? Math.round(finalPrice * affiliate.commissionRate) : 0;
    const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);

    await prisma.instructeurProfile.update({
      where: { id: f.instructeurId },
      data: { totalEarned: { increment: vendorNet } },
    });
    await prisma.formation.update({
      where: { id: f.id },
      data: { studentsCount: { increment: 1 } },
    });

    await prisma.platformRevenue.create({
      data: {
        orderId: enrollment.id,
        orderType: "formation",
        grossAmount: finalPrice,
        commissionRate: PLATFORM_COMMISSION_RATE,
        commissionAmount: platformAmount,
        vendorAmount: vendorNet,
        affiliateId: affiliate?.profileId ?? null,
        affiliateAmount: affAmount,
        paymentRef: sessionRef,
        currency: "XOF",
        instructeurId: f.instructeurId,
        shopId: f.shopId ?? null,
      },
    }).catch((e) => console.warn("[fulfillment platformRevenue]", e));

    if (affiliate && affAmount > 0) {
      await prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliate.profileId,
          orderId: enrollment.id,
          orderType: "formation",
          orderAmount: finalPrice,
          commissionPct: affiliate.commissionRate * 100,
          commissionAmount: affAmount,
          status: "PENDING",
        },
      }).catch((e) => console.warn("[fulfillment affiliateCommission]", e));
      await prisma.affiliateProfile.update({
        where: { id: affiliate.profileId },
        data: { totalConversions: { increment: 1 }, pendingEarnings: { increment: affAmount } },
      }).catch((e) => console.warn("[fulfillment affiliateProfile]", e));
    }

    createdEnrollments.push({ id: enrollment.id, title: f.title, price: finalPrice });
  }

  // ── Produits digitaux ───────────────────────────────────────────────
  for (const p of products) {
    const existing = await prisma.digitalProductPurchase.findFirst({
      where: { userId, productId: p.id },
    });
    if (existing) { skipped.push(p.title); continue; }

    const finalPrice = applyDiscount(p.price);
    const purchase = await prisma.digitalProductPurchase.create({
      data: { userId, productId: p.id, paidAmount: finalPrice, stripeSessionId: sessionRef },
    });

    const platformAmount = Math.round(finalPrice * PLATFORM_COMMISSION_RATE);
    const affAmount = affiliate ? Math.round(finalPrice * affiliate.commissionRate) : 0;
    const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);

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
        commissionAmount: platformAmount,
        vendorAmount: vendorNet,
        affiliateId: affiliate?.profileId ?? null,
        affiliateAmount: affAmount,
        paymentRef: sessionRef,
        currency: "XOF",
        instructeurId: p.instructeurId,
        shopId: p.shopId ?? null,
      },
    }).catch((e) => console.warn("[fulfillment platformRevenue product]", e));

    if (affiliate && affAmount > 0) {
      await prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliate.profileId,
          orderId: purchase.id,
          orderType: "product",
          orderAmount: finalPrice,
          commissionPct: affiliate.commissionRate * 100,
          commissionAmount: affAmount,
          status: "PENDING",
        },
      }).catch(() => null);
      await prisma.affiliateProfile.update({
        where: { id: affiliate.profileId },
        data: { totalConversions: { increment: 1 }, pendingEarnings: { increment: affAmount } },
      }).catch(() => null);
    }

    createdPurchases.push({ id: purchase.id, title: p.title, price: finalPrice });
  }

  // ── Usage du code promo ─────────────────────────────────────────────
  if (appliedCode && createdEnrollments.length + createdPurchases.length > 0) {
    await prisma.discountCode.update({
      where: { id: appliedCode.id },
      data: {
        usedCount: { increment: 1 },
        totalDiscounted: { increment: discountAmount },
        revenue: { increment: totalAmount },
      },
    }).catch(() => null);
    await prisma.discountUsage.create({
      data: {
        discountId: appliedCode.id,
        userId,
        orderType: createdEnrollments.length > 0 ? "formation" : "product",
        orderId: sessionRef,
        originalAmount: subTotal,
        discountAmount,
        finalAmount: totalAmount,
      },
    }).catch(() => null);
  }

  // ── Vider le panier (formations) ────────────────────────────────────
  if (formationIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { userId, formationId: { in: formationIds } },
    }).catch(() => null);
  }

  // ── Notification récap acheteur ─────────────────────────────────────
  if (createdEnrollments.length + createdPurchases.length > 0) {
    const all = [...createdEnrollments, ...createdPurchases];
    const itemTitles = all.map((i) => i.title).slice(0, 3).join(", ");
    const more = all.length - 3;
    const summary = more > 0 ? `${itemTitles} et ${more} autre(s)` : itemTitles;
    await prisma.notification.create({
      data: {
        userId,
        type: "ORDER",
        title: "Achat confirmé",
        message: `Votre achat est confirmé : ${summary}.`,
        link: createdEnrollments.length > 0 ? "/apprenant/mes-formations" : "/apprenant/produits",
      },
    }).catch(() => null);
  }

  // ── Emails (best-effort) ────────────────────────────────────────────
  const fName = user.name ?? user.email.split("@")[0];
  const eurRate = 655.957;

  for (const f of formations) {
    const created = createdEnrollments.find((e) => e.title === f.title);
    if (!created) continue;
    sendEnrollmentConfirmedEmail({
      email: user.email,
      name: fName,
      formationTitle: f.title,
      formationSlug: f.slug,
      paidAmount: Number((created.price / eurRate).toFixed(2)),
      locale: "fr",
    }).catch(() => null);

    const vendorEmail = f.instructeur?.user?.email;
    const vendorName = f.instructeur?.user?.name ?? "Vendeur";
    const vendorUserId = f.instructeur?.user?.id;
    if (vendorEmail) {
      sendNewStudentNotificationEmail({
        instructeurEmail: vendorEmail,
        instructeurName: vendorName,
        studentName: fName,
        formationTitle: f.title,
        paidAmount: created.price,
      }).catch(() => null);
    }
    if (vendorUserId) {
      prisma.notification.create({
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
    const downloadUrl = p.fileUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/apprenant/produits`;
    sendDigitalProductDeliveryEmail({
      email: user.email,
      name: fName,
      productTitle: p.title,
      downloadUrl,
      locale: "fr",
    }).catch(() => null);

    const vendorEmail = p.instructeur?.user?.email;
    const vendorName = p.instructeur?.user?.name ?? "Vendeur";
    const vendorUserId = p.instructeur?.user?.id;
    if (vendorEmail) {
      sendNewStudentNotificationEmail({
        instructeurEmail: vendorEmail,
        instructeurName: vendorName,
        studentName: fName,
        formationTitle: p.title,
        paidAmount: created.price,
      }).catch(() => null);
    }
    if (vendorUserId) {
      prisma.notification.create({
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

  return {
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
    recipient: { email: user.email, name: user.name ?? user.email.split("@")[0] },
  };
}
