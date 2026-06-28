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
import { getCommissionRate } from "@/lib/formations/platform-settings";
import { dispatchVendorEvent } from "@/lib/formations/vendor-webhooks";
import { onFormationPurchase, onProductPurchase } from "@/lib/marketing/hooks";
import { resolveStorageFileUrl } from "@/lib/supabase-storage";
import { broadcast } from "@/lib/realtime/broadcast";
import { sendPushToUser } from "@/lib/push/web-push";
import { revalidatePublicCatalog } from "@/lib/formations/revalidate-public";

// Signed URLs Supabase expirent par défaut en 1h. Pour un email transactionnel
// qui peut rester non-lu plusieurs jours, on prend 7 jours. Au-delà, l'utilisateur
// utilise le lien magique vers /apprenant/mes-produits qui régénère un URL frais.
const EMAIL_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;

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
  /**
   * Montant effectivement reçu du provider (session 2 bureau — vote 19).
   * Si fourni, fulfillment refuse si reçu < total recalculé - tolérance.
   * Empêche un attaquant d'injecter des items supplémentaires en metadata.
   */
  expectedAmountReceived?: number;
  /** Tolérance d'arrondi (défaut 1 unité — vote 20). */
  amountTolerance?: number;
}

/** Levée quand le montant reçu ne correspond pas au prix recalculé serveur. */
export class AmountMismatchError extends Error {
  constructor(public expected: number, public received: number) {
    super(`Amount mismatch: expected >= ${expected - 1}, received ${received}`);
    this.name = "AmountMismatchError";
  }
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
            // Stock gate (vote 23) : re-vérifiée au moment du fulfillment.
            maxStudents: true, currentStudents: true,
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
            // Stock gate (vote 23).
            maxBuyers: true, currentBuyers: true, salesCount: true,
            instructeur: { select: { user: { select: { id: true, email: true, name: true } } } },
            files: {
              orderBy: { order: "asc" },
              select: { name: true, url: true },
            },
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
        // Atomic per-user limit : empêche un user d'utiliser le code plus de
        // maxUsesPerUser fois. Si dépassé, on n'applique pas le rabais (mais
        // on continue le fulfillment pour ne pas annuler une commande payée).
        let allowed = true;
        if (code.maxUsesPerUser != null) {
          const userPriorUses = await prisma.discountUsage.count({
            where: { discountId: code.id, userId },
          });
          if (userPriorUses >= code.maxUsesPerUser) {
            console.warn(
              `[fulfillment] discount ${code.code} maxUsesPerUser dépassé pour ${userId} — rabais ignoré`,
            );
            allowed = false;
          }
        }
        if (allowed) {
          if (code.discountType === "PERCENTAGE") {
            discountAmount = Math.round(subTotal * (code.discountValue / 100));
          } else {
            discountAmount = Math.min(code.discountValue, subTotal);
          }
          appliedCode = { id: code.id, code: code.code };
        }
      }
    }
  }

  const totalAmount = Math.max(0, subTotal - discountAmount);
  const applyDiscount = (price: number) => (subTotal > 0 ? Math.round(price * (totalAmount / subTotal)) : price);

  // ── Validation montant payé (votes 19 & 20) ──────────────────────────
  // Si le webhook a transmis le montant reçu, on refuse si l'écart dépasse
  // la tolérance. Empêche un attaquant d'ajouter des items en metadata
  // sans payer la différence. La tolérance par défaut absorbe les arrondis.
  if (p.expectedAmountReceived != null) {
    const tolerance = p.amountTolerance ?? 1;
    if (p.expectedAmountReceived < totalAmount - tolerance) {
      console.error("[fulfillment] AMOUNT MISMATCH", {
        sessionRef,
        expected: totalAmount,
        received: p.expectedAmountReceived,
        formationIds,
        productIds,
      });
      throw new AmountMismatchError(totalAmount, p.expectedAmountReceived);
    }
  }

  const createdEnrollments: { id: string; title: string; price: number }[] = [];
  const createdPurchases: { id: string; title: string; price: number }[] = [];
  const skipped: string[] = [];

  // Commission plateforme configurable par l'admin (FormationsConfig). Le taux
  // est lu une fois ici et STOCKÉ par vente dans PlatformRevenue → changer la
  // commission n'affecte que les nouvelles ventes (jamais rétroactif).
  const commissionRate = await getCommissionRate();
  const vendorNetRate = 1 - commissionRate;

  // ── Formations ──────────────────────────────────────────────────────
  for (const f of formations) {
    // Stock re-check (vote 23) : on refuse de fulfill un item dont le stock
    // a été épuisé entre l'init et le webhook. Skip sans planter pour ne
    // pas bloquer les autres items du même paiement.
    if (typeof f.maxStudents === "number" && f.maxStudents > 0 && (f.currentStudents ?? 0) >= f.maxStudents) {
      console.warn(`[fulfillment] formation ${f.id} stock épuisé au fulfillment — skip`);
      skipped.push(`${f.title} (stock épuisé)`);
      continue;
    }

    const finalPrice = applyDiscount(f.price);
    const platformAmount = Math.round(finalPrice * commissionRate);
    const clampedAffRate = affiliate ? Math.min(affiliate.commissionRate, 0.40) : 0;
    const affAmount = affiliate ? Math.round(finalPrice * clampedAffRate) : 0;
    const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);

    // Atomicité (vote 21) : tous les writes d'un item dans UNE transaction.
    // L'unique constraint `@@unique([userId, formationId])` sur Enrollment
    // garantit qu'une race entre webhook + verify cassera la 2e tx via P2002,
    // sans laisser de PlatformRevenue/totalEarned orphelin.
    let enrollment: { id: string } | null = null;
    try {
      enrollment = await prisma.$transaction(async (tx) => {
        const existing = await tx.enrollment.findUnique({
          where: { userId_formationId: { userId, formationId: f.id } },
        });
        if (existing) return null;

        const created = await tx.enrollment.create({
          data: { userId, formationId: f.id, paidAmount: finalPrice, stripeSessionId: sessionRef },
        });

        await tx.instructeurProfile.update({
          where: { id: f.instructeurId },
          data: { totalEarned: { increment: vendorNet } },
        });
        await tx.formation.update({
          where: { id: f.id },
          data: { studentsCount: { increment: 1 }, currentStudents: { increment: 1 } },
        });
        await tx.platformRevenue.create({
          data: {
            orderId: created.id,
            orderType: "formation",
            grossAmount: finalPrice,
            commissionRate: commissionRate,
            commissionAmount: platformAmount,
            vendorAmount: vendorNet,
            affiliateId: affiliate?.profileId ?? null,
            affiliateAmount: affAmount,
            paymentRef: sessionRef,
            currency: "XOF",
            instructeurId: f.instructeurId,
            shopId: f.shopId ?? null,
          },
        });
        if (affiliate && affAmount > 0) {
          await tx.affiliateCommission.create({
            data: {
              affiliateId: affiliate.profileId,
              orderId: created.id,
              orderType: "formation",
              orderAmount: finalPrice,
              commissionPct: affiliate.commissionRate * 100,
              commissionAmount: affAmount,
              status: "PENDING",
            },
          });
          await tx.affiliateProfile.update({
            where: { id: affiliate.profileId },
            data: { totalConversions: { increment: 1 } },
          });
        }
        return created;
      });
    } catch (e) {
      // P2002 = unique violation sur enrollment → la 2e tx d'une race perd,
      // c'est exactement le comportement voulu. On skip et on continue.
      if ((e as { code?: string }).code === "P2002") {
        skipped.push(f.title);
        continue;
      }
      throw e;
    }
    if (!enrollment) { skipped.push(f.title); continue; }

    createdEnrollments.push({ id: enrollment.id, title: f.title, price: finalPrice });

    // Trigger marketing automation hooks (séquences email, workflows…) — non bloquant.
    // onFormationPurchase retourne void (gère ses propres erreurs via fireAndForget),
    // donc PAS de .catch() ici — sinon TypeError sur undefined qui plante tout
    // le fulfillment APRÈS que les DB inserts soient déjà passés.
    onFormationPurchase(userId, f.id, finalPrice, {
      formationTitle: f.title,
      paymentRef: sessionRef,
    });
  }

  // ── Produits digitaux ───────────────────────────────────────────────
  for (const p of products) {
    // Stock re-check (vote 23) — utilise max(currentBuyers, salesCount) cf. fix d'intégrité comptable du 2026-05-26.
    const soldNow = Math.max(p.currentBuyers ?? 0, p.salesCount ?? 0);
    if (typeof p.maxBuyers === "number" && p.maxBuyers > 0 && soldNow >= p.maxBuyers) {
      console.warn(`[fulfillment] product ${p.id} stock épuisé au fulfillment — skip`);
      skipped.push(`${p.title} (stock épuisé)`);
      continue;
    }

    const finalPrice = applyDiscount(p.price);
    const platformAmount = Math.round(finalPrice * commissionRate);
    const clampedAffRate = affiliate ? Math.min(affiliate.commissionRate, 0.40) : 0;
    const affAmount = affiliate ? Math.round(finalPrice * clampedAffRate) : 0;
    const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);

    // Atomicité (vote 21) — l'absence d'unique constraint native sur
    // DigitalProductPurchase nous oblige à un findFirst + create dans la
    // même tx ; en cas de race, l'une des deux verra l'autre et skippera.
    let purchase: { id: string } | null = null;
    try {
      purchase = await prisma.$transaction(async (tx) => {
        const existing = await tx.digitalProductPurchase.findFirst({
          where: { userId, productId: p.id },
        });
        if (existing) return null;

        const created = await tx.digitalProductPurchase.create({
          data: { userId, productId: p.id, paidAmount: finalPrice, stripeSessionId: sessionRef },
        });

        await tx.instructeurProfile.update({
          where: { id: p.instructeurId },
          data: { totalEarned: { increment: vendorNet } },
        });
        await tx.digitalProduct.update({
          where: { id: p.id },
          data: { salesCount: { increment: 1 }, currentBuyers: { increment: 1 } },
        });
        await tx.platformRevenue.create({
          data: {
            orderId: created.id,
            orderType: "product",
            grossAmount: finalPrice,
            commissionRate: commissionRate,
            commissionAmount: platformAmount,
            vendorAmount: vendorNet,
            affiliateId: affiliate?.profileId ?? null,
            affiliateAmount: affAmount,
            paymentRef: sessionRef,
            currency: "XOF",
            instructeurId: p.instructeurId,
            shopId: p.shopId ?? null,
          },
        });
        if (affiliate && affAmount > 0) {
          await tx.affiliateCommission.create({
            data: {
              affiliateId: affiliate.profileId,
              orderId: created.id,
              orderType: "product",
              orderAmount: finalPrice,
              commissionPct: affiliate.commissionRate * 100,
              commissionAmount: affAmount,
              status: "PENDING",
            },
          });
          await tx.affiliateProfile.update({
            where: { id: affiliate.profileId },
            data: { totalConversions: { increment: 1 } },
          });
        }
        return created;
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") {
        skipped.push(p.title);
        continue;
      }
      throw e;
    }
    if (!purchase) { skipped.push(p.title); continue; }

    createdPurchases.push({ id: purchase.id, title: p.title, price: finalPrice });

    // Trigger marketing automation hooks — non bloquant.
    // Idem onFormationPurchase : retourne void, NE PAS chainer .catch().
    onProductPurchase(userId, p.id, finalPrice, {
      productTitle: p.title,
      paymentRef: sessionRef,
    });
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
    }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
    await prisma.discountUsage
      .create({
        data: {
          discountId: appliedCode.id,
          userId,
          orderType: createdEnrollments.length > 0 ? "formation" : "product",
          orderId: sessionRef,
          originalAmount: subTotal,
          discountAmount,
          finalAmount: totalAmount,
        },
      })
      .catch((err) => {
        // P2002 = unique constraint sur (discountId, userId, orderId) — déjà créé, idempotent
        if ((err as { code?: string }).code === "P2002") return null;
        console.error("[fulfillment discountUsage]", (err as { message?: string })?.message ?? err);
        return null;
      });
  }

  // ── Vider le panier (formations) ────────────────────────────────────
  if (formationIds.length > 0) {
    await prisma.cartItem.deleteMany({
      where: { userId, formationId: { in: formationIds } },
    }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
  }

  // ── Notification récap acheteur ─────────────────────────────────────
  if (createdEnrollments.length + createdPurchases.length > 0) {
    const all = [...createdEnrollments, ...createdPurchases];
    const itemTitles = all.map((i) => i.title).slice(0, 3).join(", ");
    const more = all.length - 3;
    const summary = more > 0 ? `${itemTitles} et ${more} autre(s)` : itemTitles;
    const buyerLink = createdEnrollments.length > 0 ? "/apprenant/mes-formations" : "/apprenant/mes-produits";
    await prisma.notification.create({
      data: {
        userId,
        type: "ORDER",
        title: "Achat confirmé",
        message: `Votre achat est confirmé : ${summary}.`,
        link: buyerLink,
      },
    }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
    // Push natif : l'acheteur est prévenu que son accès est disponible
    sendPushToUser(userId, {
      title: "Achat confirmé ✅",
      body: `Votre accès est prêt : ${summary}.`,
      url: buyerLink,
      tag: "purchase",
    });
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
    }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));

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
      }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
    }
    if (vendorUserId) {
      prisma.notification.create({
        data: {
          userId: vendorUserId,
          type: "ORDER",
          title: "Nouvelle vente !",
          message: `${fName} vient d'acheter votre formation « ${f.title} » pour ${Math.round(created.price * vendorNetRate)} FCFA nets.`,
          link: "/vendeur/dashboard",
        },
      }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
      // Temps réel : la cloche du vendeur s'allume en direct sur la vente
      broadcast(`user:${vendorUserId}`, "notification", { type: "ORDER", title: "Nouvelle vente !", link: "/vendeur/dashboard" });
      // Push natif : le vendeur est prévenu même app fermée
      sendPushToUser(vendorUserId, { title: "Nouvelle vente ! 🎉", body: `${fName} a acheté « ${f.title} »`, url: "/vendeur/dashboard", tag: "sale" });
    }
  }

  for (const p of products) {
    const created = createdPurchases.find((q) => q.title === p.title);
    if (!created) continue;

    // Les valeurs stockées en DB (p.files[].url, p.fileUrl) peuvent être :
    //  - un chemin Supabase Storage brut (ex: "user-abc/123.pdf")
    //  - une signed URL déjà expirée (créée à l'upload, TTL 1h)
    //  - une URL publique externe (Cloudinary, etc.)
    // resolveStorageFileUrl() gère les 3 cas et régénère un signed URL frais avec TTL email.
    const dashboardFallback = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/apprenant/mes-produits`;
    const resolvedFiles = Array.isArray(p.files) && p.files.length > 0
      ? await Promise.all(
          p.files.map(async (f) => ({
            name: f.name,
            url: (await resolveStorageFileUrl(f.url, "order-deliveries", EMAIL_LINK_TTL_SECONDS)) || dashboardFallback,
          })),
        )
      : [];
    const downloadUrl =
      resolvedFiles[0]?.url
      ?? (await resolveStorageFileUrl(p.fileUrl, "order-deliveries", EMAIL_LINK_TTL_SECONDS))
      ?? dashboardFallback;

    sendDigitalProductDeliveryEmail({
      email: user.email,
      name: fName,
      productTitle: p.title,
      downloadUrl,
      files: resolvedFiles.length > 0 ? resolvedFiles : undefined,
      locale: "fr",
    }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));

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
      }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
    }
    if (vendorUserId) {
      prisma.notification.create({
        data: {
          userId: vendorUserId,
          type: "ORDER",
          title: "Nouvelle vente !",
          message: `${fName} vient d'acheter votre produit « ${p.title} » pour ${Math.round(created.price * vendorNetRate)} FCFA nets.`,
          link: "/vendeur/dashboard",
        },
      }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
      // Temps réel : la cloche du vendeur s'allume en direct sur la vente
      broadcast(`user:${vendorUserId}`, "notification", { type: "ORDER", title: "Nouvelle vente !", link: "/vendeur/dashboard" });
      // Push natif : le vendeur est prévenu même app fermée
      sendPushToUser(vendorUserId, { title: "Nouvelle vente ! 🎉", body: `${fName} a acheté « ${p.title} »`, url: "/vendeur/dashboard", tag: "sale" });
    }
  }

  // ── Declenche les webhooks sortants 'order.paid' pour chaque vendeur
  // concerne par cette commande. Fire-and-forget : on ne bloque pas le return
  // si un webhook rate (le vendeur verra le failureCount augmenter).
  try {
    // Union des instructeurIds de tous les produits achetes
    const instructeurIdsSet = new Set<string>();
    for (const f of formations) if (f.instructeurId) instructeurIdsSet.add(f.instructeurId);
    for (const p of products) if (p.instructeurId) instructeurIdsSet.add(p.instructeurId);
    for (const instructeurId of instructeurIdsSet) {
      dispatchVendorEvent(instructeurId, "order.paid", {
        sessionRef,
        subTotal,
        discountAmount,
        totalAmount,
        appliedCode: appliedCode?.code ?? null,
        buyer: { email: user.email, name: user.name },
        enrollments: createdEnrollments.filter((e) =>
          formations.find((f) => f.id === e.id)?.instructeurId === instructeurId,
        ),
        purchases: createdPurchases.filter((pr) =>
          products.find((p) => p.id === pr.id)?.instructeurId === instructeurId,
        ),
      }).catch(() => null);
    }
  } catch { /* ne jamais bloquer sur webhook */ }

  // Mark abandoned carts as converted now that purchase completed.
  // Bureau session 4 (P0 Fatou) : on matche AUSSI sur visitorEmail/email
  // pour ne plus rater les invités qui reviennent finir leur achat via
  // un lien de relance. Sans ça, la stat "RÉCUPÉRÉ" sous-évaluait
  // systématiquement le revenu reconverti.
  if (createdEnrollments.length + createdPurchases.length > 0) {
    const buyerEmail = user.email?.toLowerCase() ?? null;
    const buyerMatch = buyerEmail
      ? { OR: [{ userId }, { email: buyerEmail }] }
      : { userId };
    await prisma.abandonedCart.updateMany({
      where: { ...buyerMatch, status: { in: ["DETECTE", "RELANCE_1", "RELANCE_2", "RELANCE_3"] } },
      data: { status: "CONVERTI" },
    }).catch(() => null);
    // Mark checkout attempts as recovered (loggés OU invités via visitorEmail).
    const attemptMatch = buyerEmail
      ? { OR: [{ userId }, { visitorEmail: buyerEmail }] }
      : { userId };
    await prisma.checkoutAttempt.updateMany({
      where: { ...attemptMatch, status: { in: ["FAILED", "ABANDONED"] } },
      data: { status: "RECOVERED", recoveredAt: new Date() },
    }).catch(() => null);
  }

  // Rafraîchir les pages publiques en cache (compteurs de ventes) dès qu'une
  // vente fraîche est enregistrée — sinon la home/fiche reste figée (ISR 300s).
  if (createdEnrollments.length + createdPurchases.length > 0) {
    revalidatePublicCatalog();
  }

  return {
    success: true,
    sessionRef,
    subTotal,
    discountAmount,
    totalAmount,
    netToInstructor: totalAmount * vendorNetRate,
    commission: totalAmount * commissionRate,
    appliedCode: appliedCode?.code ?? null,
    enrollments: createdEnrollments,
    purchases: createdPurchases,
    skipped,
    recipient: { email: user.email, name: user.name ?? user.email.split("@")[0] },
  };
}
