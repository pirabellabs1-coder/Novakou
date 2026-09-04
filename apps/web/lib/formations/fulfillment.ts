/**
 * Checkout fulfillment — logique partagée entre :
 *   - /api/formations/checkout (chemin "free" / mock)
 *   - /api/webhooks/passerelle (après confirmation réelle de paiement)
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
 * (le webhook peut être appelé deux fois par la passerelle en cas de retry).
 */

import { prisma } from "@/lib/prisma";
import { computeCheckoutDiscount, lineFinalPrice } from "@/lib/formations/checkout-discount";
import { fireServerConversion, platformCapiPixels } from "@/lib/marketing/capi";
import {
  sendEnrollmentConfirmedEmail,
  sendDigitalProductDeliveryEmail,
  sendNewStudentNotificationEmail,
} from "@/lib/email/formations";
import { getCommissionRate } from "@/lib/formations/platform-settings";
import { notifyGiftRecipient, notifyGiftSent } from "@/lib/email/gift";
import { dispatchVendorEvent } from "@/lib/formations/vendor-webhooks";
import { onFormationPurchase, onProductPurchase } from "@/lib/marketing/hooks";
import { firePaylinkWebhook } from "@/lib/formations/paylink-webhook";
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
  /**
   * Rabais RÉELLEMENT débité à l'init, lu depuis la metadata provider (signée).
   * Fourni par les webhooks de paiement : fait AUTORITÉ sur le montant remisé,
   * pour que le fulfillment ne recalcule jamais un rabais différent de ce qui a
   * été payé — un garde stateful (maxUses, firstOrderOnly…) peut avoir basculé
   * entre l'init et le webhook. Absent (chemin gratuit/mock) → décision fraîche.
   */
  chargedDiscountAmount?: number | null;
  /**
   * Achat d'un PACK. Le pack se paie MOINS CHER que la somme de ses éléments —
   * c'est sa raison d'être. Sans cette information, le garde-fou anti-fraude
   * ci-dessous compare le montant reçu à la somme des prix unitaires et REFUSE
   * la livraison : l'acheteur aurait payé sans rien recevoir.
   *
   * Le prix ET le contenu sont relus en base : passer un identifiant de pack
   * bon marché avec des formations chères en plus ne donne rien de plus.
   */
  bundleId?: string | null;
  /**
   * ACHAT-CADEAU : quand présent, l'ACCÈS (Enrollment/DigitalProductPurchase) est
   * créé pour ce destinataire au lieu de l'acheteur. L'acheteur reste le payeur ;
   * le crédit vendeur/commission (PlatformRevenue, totalEarned) est INCHANGÉ (il
   * ne dépend pas du bénéficiaire de l'accès). Le destinataire reçoit l'e-mail
   * cadeau + le lien d'accès ; l'acheteur reçoit une confirmation « cadeau envoyé ».
   */
  recipientUserId?: string | null;
  /** Message personnalisé de l'offreur, affiché dans l'e-mail cadeau. */
  giftMessage?: string | null;
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
  const { userId, discountCodeStr, sessionRef } = p;
  const affiliate = p.affiliate ?? null;

  // ── PACK ──────────────────────────────────────────────────────────────────
  // Contenu et prix relus en base. Quand un pack est en jeu, on ne livre QUE
  // ses éléments : tout identifiant supplémentaire arrivé par ailleurs est
  // ignoré, sinon un pack à 5 000 F servirait à obtenir une formation à 50 000.
  const pack = p.bundleId
    ? await prisma.productBundle.findFirst({
        where: { id: p.bundleId, isActive: true },
        select: { id: true, priceXof: true, items: { select: { formationId: true, productId: true } } },
      })
    : null;

  const formationIds = pack
    ? pack.items.map((i) => i.formationId).filter((x): x is string => !!x)
    : p.formationIds;
  const productIds = pack
    ? pack.items.map((i) => i.productId).filter((x): x is string => !!x)
    : p.productIds;

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
            isPaymentLink: true, allowCustomAmount: true, webhookUrl: true, webhookSecret: true,
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

  // ── ACHAT-CADEAU : bénéficiaire = destinataire, payeur = acheteur ──────────
  const isGift = !!p.recipientUserId && p.recipientUserId !== userId;
  const beneficiaryId = isGift ? p.recipientUserId! : userId;
  const beneficiary = isGift
    ? (await prisma.user.findUnique({ where: { id: beneficiaryId }, select: { id: true, name: true, email: true } })) ?? user
    : user;

  // Lien de paiement à PRIX LIBRE (commande d'un seul produit) : le montant
  // « attendu » N'EST PAS le prix suggéré mais le montant réellement payé par
  // l'acheteur (vérifié par la passerelle). On aligne subTotal dessus pour que le
  // garde-fou anti-fraude ci-dessous et la ventilation restent cohérents.
  const singleCustomLink =
    formations.length === 0 && products.length === 1 &&
    products[0].isPaymentLink && products[0].allowCustomAmount &&
    typeof p.expectedAmountReceived === "number" && p.expectedAmountReceived > 0;

  const subTotal = pack
    ? pack.priceXof
    : singleCustomLink
      ? Math.round(p.expectedAmountReceived as number)
      : formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0);

  // Code promo — MÊME source de vérité qu'au checkout (computeCheckoutDiscount) :
  // le montant recalculé ici == le montant débité à l'init (déterministe), donc
  // le garde-fou anti-fraude plus bas ne casse jamais une vraie commande. La
  // remise ne porte QUE sur les items éligibles (vendeur propriétaire du code +
  // sa portée) → jamais de fuite de marge inter-vendeur. Jamais de code sur un
  // lien de paiement à prix libre.
  let discountAmount = 0;
  let appliedCode: { id: string; code: string; maxUses: number | null } | null = null;
  let discountEligible = new Set<string>();
  let discountEligibleSubtotal = 0;
  if (discountCodeStr && !singleCustomLink) {
    const disc = await computeCheckoutDiscount(discountCodeStr, userId, [
      ...formations.map((f) => ({ id: f.id, kind: "formation" as const, price: f.price, instructeurId: f.instructeurId })),
      ...products.map((pr) => ({ id: pr.id, kind: "product" as const, price: pr.price, instructeurId: pr.instructeurId })),
    ]);
    if (disc.codeId && disc.code && disc.eligibleIds.length > 0) {
      // Montant remisé : AUTORITÉ = ce qui a été DÉBITÉ à l'init (webhook, via
      // chargedDiscountAmount) ; sinon la décision fraîche gardée (chemin
      // gratuit/mock). Toujours clampé au sous-total éligible.
      const charged = p.chargedDiscountAmount;
      const amount =
        typeof charged === "number" && Number.isFinite(charged)
          ? Math.max(0, Math.min(Math.round(charged), disc.eligibleSubtotal))
          : disc.applied
            ? disc.discountAmount
            : 0;
      if (amount > 0) {
        discountAmount = amount;
        appliedCode = { id: disc.codeId, code: disc.code, maxUses: disc.maxUses };
        discountEligible = new Set(disc.eligibleIds);
        discountEligibleSubtotal = disc.eligibleSubtotal;
      }
    }
  }

  const totalAmount = Math.max(0, subTotal - discountAmount);
  // Prix final d'un item : remise répartie au prorata SUR LES SEULS items
  // éligibles ; un item non éligible garde son prix plein.
  const applyDiscount = (id: string, price: number) =>
    lineFinalPrice(price, discountEligible.has(id), discountAmount, discountEligibleSubtotal);

  // Auto-parrainage : un affilié ne perçoit JAMAIS de commission sur les ventes
  // de son propre catalogue. On résout son userId une fois pour le comparer au
  // vendeur de chaque item plus bas.
  let affiliateUserId: string | null = null;
  if (affiliate) {
    const ap = await prisma.affiliateProfile.findUnique({
      where: { id: affiliate.profileId },
      select: { userId: true },
    });
    affiliateUserId = ap?.userId ?? null;
  }

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

    const finalPrice = applyDiscount(f.id, f.price);
    const platformAmount = Math.round(finalPrice * commissionRate);
    // Commission affilié coupée si l'affilié EST le vendeur (auto-parrainage).
    const affActive = affiliate != null && affiliateUserId != null && affiliateUserId !== f.instructeur?.user?.id;
    const clampedAffRate = affActive ? Math.min(affiliate!.commissionRate, 0.40) : 0;
    const affAmount = affActive ? Math.round(finalPrice * clampedAffRate) : 0;
    const affProfileId = affActive ? affiliate!.profileId : null;
    const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);

    // Atomicité (vote 21) : tous les writes d'un item dans UNE transaction.
    // L'unique constraint `@@unique([userId, formationId])` sur Enrollment
    // garantit qu'une race entre webhook + verify cassera la 2e tx via P2002,
    // sans laisser de PlatformRevenue/totalEarned orphelin.
    let enrollment: { id: string } | null = null;
    try {
      enrollment = await prisma.$transaction(async (tx) => {
        const existing = await tx.enrollment.findUnique({
          where: { userId_formationId: { userId: beneficiaryId, formationId: f.id } },
        });
        if (existing) return null;

        const created = await tx.enrollment.create({
          data: { userId: beneficiaryId, formationId: f.id, paidAmount: finalPrice, stripeSessionId: sessionRef },
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
            affiliateId: affProfileId,
            affiliateAmount: affAmount,
            paymentRef: sessionRef,
            currency: "XOF",
            instructeurId: f.instructeurId,
            shopId: f.shopId ?? null,
          },
        });
        if (affProfileId && affAmount > 0) {
          await tx.affiliateCommission.create({
            data: {
              affiliateId: affProfileId,
              orderId: created.id,
              orderType: "formation",
              orderAmount: finalPrice,
              commissionPct: affiliate!.commissionRate * 100,
              commissionAmount: affAmount,
              status: "PENDING",
            },
          });
          await tx.affiliateProfile.update({
            where: { id: affProfileId },
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

    // Lien de paiement à PRIX LIBRE : on crédite le montant réellement payé
    // (déjà porté par subTotal pour ce cas single-item, cf. plus haut), et non
    // p.price qui n'est qu'une suggestion.
    const finalPrice = singleCustomLink ? subTotal : applyDiscount(p.id, p.price);
    const platformAmount = Math.round(finalPrice * commissionRate);
    // Commission affilié coupée si l'affilié EST le vendeur (auto-parrainage).
    const affActive = affiliate != null && affiliateUserId != null && affiliateUserId !== p.instructeur?.user?.id;
    const clampedAffRate = affActive ? Math.min(affiliate!.commissionRate, 0.40) : 0;
    const affAmount = affActive ? Math.round(finalPrice * clampedAffRate) : 0;
    const affProfileId = affActive ? affiliate!.profileId : null;
    const vendorNet = Math.max(0, finalPrice - platformAmount - affAmount);

    // Atomicité (vote 21) — l'absence d'unique constraint native sur
    // DigitalProductPurchase nous oblige à un findFirst + create dans la
    // même tx ; en cas de race, l'une des deux verra l'autre et skippera.
    let purchase: { id: string } | null = null;
    try {
      purchase = await prisma.$transaction(async (tx) => {
        const existing = await tx.digitalProductPurchase.findFirst({
          where: { userId: beneficiaryId, productId: p.id },
        });
        if (existing) return null;

        const created = await tx.digitalProductPurchase.create({
          data: { userId: beneficiaryId, productId: p.id, paidAmount: finalPrice, stripeSessionId: sessionRef },
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
            affiliateId: affProfileId,
            affiliateAmount: affAmount,
            paymentRef: sessionRef,
            currency: "XOF",
            instructeurId: p.instructeurId,
            shopId: p.shopId ?? null,
          },
        });
        if (affProfileId && affAmount > 0) {
          await tx.affiliateCommission.create({
            data: {
              affiliateId: affProfileId,
              orderId: created.id,
              orderType: "product",
              orderAmount: finalPrice,
              commissionPct: affiliate!.commissionRate * 100,
              commissionAmount: affAmount,
              status: "PENDING",
            },
          });
          await tx.affiliateProfile.update({
            where: { id: affProfileId },
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

    // Lien de paiement INTÉGRÉ : notifie le site du vendeur (webhook signé),
    // UNE fois par vente réelle (on est dans le cas « nouvel achat »).
    if (p.isPaymentLink && p.webhookUrl) {
      const webhookUrl = p.webhookUrl;
      const webhookSecret = p.webhookSecret ?? "";
      prisma.user
        .findUnique({ where: { id: userId }, select: { email: true, name: true } })
        .then((buyer) =>
          firePaylinkWebhook(webhookUrl, webhookSecret, {
            event: "payment.succeeded",
            paymentRef: sessionRef,
            linkId: p.id,
            linkSlug: p.slug,
            title: p.title,
            amount: finalPrice,
            currency: "XOF",
            buyerEmail: buyer?.email ?? null,
            buyerName: buyer?.name ?? null,
            createdAt: new Date().toISOString(),
          }),
        )
        .catch((e) => console.error("[fulfillment] paylink webhook:", e));
    }
  }

  // ── Usage du code promo ─────────────────────────────────────────────
  if (appliedCode && createdEnrollments.length + createdPurchases.length > 0) {
    // Réservation atomique de maxUses : un seul UPDATE gardé par `usedCount <
    // maxUses`. Deux commandes concurrentes ne peuvent pas dépasser la limite
    // globale (la 2e voit 0 ligne affectée). Sans maxUses → incrément simple.
    await prisma.discountCode.updateMany({
      where: {
        id: appliedCode.id,
        ...(appliedCode.maxUses != null ? { usedCount: { lt: appliedCode.maxUses } } : {}),
      },
      data: {
        usedCount: { increment: 1 },
        totalDiscounted: { increment: discountAmount },
        revenue: { increment: totalAmount },
      },
    }).catch((e) => console.error("[fulfillment discount usedCount]", e?.message ?? e));
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
        title: isGift ? "Cadeau envoyé 🎁" : "Achat confirmé",
        message: isGift
          ? `Votre cadeau « ${summary} » a été envoyé à ${beneficiary.email}.`
          : `Votre achat est confirmé : ${summary}.`,
        link: buyerLink,
      },
    }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
    // Push natif : l'acheteur est prévenu que son accès (ou son cadeau) est prêt
    sendPushToUser(userId, {
      title: isGift ? "Cadeau envoyé 🎁" : "Achat confirmé ✅",
      body: isGift ? `Cadeau envoyé à ${beneficiary.email}.` : `Votre accès est prêt : ${summary}.`,
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
    // Cadeau : le destinataire reçoit la notice « cadeau » (plus bas), pas l'e-mail
    // de confirmation d'achat destiné à l'acheteur.
    if (!isGift) {
      sendEnrollmentConfirmedEmail({
        email: user.email,
        name: fName,
        formationTitle: f.title,
        formationSlug: f.slug,
        paidAmount: Number((created.price / eurRate).toFixed(2)),
        locale: "fr",
      }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
    }

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

    // Cadeau : le destinataire reçoit la notice « cadeau » (plus bas) au lieu de
    // l'e-mail de livraison de l'acheteur.
    if (!isGift) {
      sendDigitalProductDeliveryEmail({
        email: user.email,
        name: fName,
        productTitle: p.title,
        downloadUrl,
        files: resolvedFiles.length > 0 ? resolvedFiles : undefined,
        // Référence de paiement (la MÊME que voit le vendeur) + reçu téléchargeable.
        // Essentiel pour un lien de paiement, qui n'a aucun fichier à livrer.
        paymentRef: sessionRef,
        receiptUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/formations/payment/receipt?ref=${encodeURIComponent(sessionRef)}`,
        locale: "fr",
      }).catch((e) => console.error("[fulfillment email]", e?.message ?? e));
    }

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

  // ── ACHAT-CADEAU : notice au destinataire + confirmation à l'offreur ────────
  if (isGift && createdEnrollments.length + createdPurchases.length > 0) {
    const all = [...createdEnrollments, ...createdPurchases];
    const titres =
      all.map((i) => i.title).slice(0, 3).join(", ") +
      (all.length > 3 ? ` et ${all.length - 3} autre(s)` : "");
    const gifterName = user.name?.trim() || user.email.split("@")[0];
    await notifyGiftRecipient({
      to: beneficiary.email,
      recipientName: beneficiary.name,
      itemTitle: titres,
      gifterName,
      message: p.giftMessage,
    });
    await notifyGiftSent({
      to: user.email,
      buyerName: user.name,
      recipientEmail: beneficiary.email,
      itemTitle: titres,
    });
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

  // ── API de Conversion (server-side) : évènement Purchase vers Meta/TikTok ──
  // Serveur-à-serveur = fiable (résiste ad-block / iOS). Dédup avec le pixel
  // navigateur via event_id = sessionRef. Uniquement sur un vrai encaissement.
  // Fire-and-forget : ne bloque jamais, n'échoue jamais le fulfillment.
  if (totalAmount > 0 && createdEnrollments.length + createdPurchases.length > 0) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;
      const byVendor = new Map<string, { amount: number; contentIds: string[] }>();
      for (const e of createdEnrollments) {
        const f = formations.find((x) => x.id === e.id);
        if (!f) continue;
        const v = byVendor.get(f.instructeurId) ?? { amount: 0, contentIds: [] };
        v.amount += e.price; v.contentIds.push(f.id); byVendor.set(f.instructeurId, v);
      }
      for (const pr of createdPurchases) {
        const prod = products.find((x) => x.id === pr.id);
        if (!prod) continue;
        const v = byVendor.get(prod.instructeurId) ?? { amount: 0, contentIds: [] };
        v.amount += pr.price; v.contentIds.push(prod.id); byVendor.set(prod.instructeurId, v);
      }
      const vendorIds = [...byVendor.keys()];
      const vendorPixels = vendorIds.length > 0
        ? await prisma.marketingPixel.findMany({
            where: {
              instructeurId: { in: vendorIds },
              isActive: true,
              type: { in: ["FACEBOOK", "TIKTOK"] },
              accessToken: { not: null },
            },
            select: { instructeurId: true, type: true, pixelId: true, accessToken: true, testEventCode: true },
          })
        : [];
      const capiCalls: Promise<unknown>[] = [];
      for (const [vid, agg] of byVendor) {
        const vpx = vendorPixels
          .filter((x) => x.instructeurId === vid && x.accessToken)
          .map((x) => ({ type: x.type as "FACEBOOK" | "TIKTOK", pixelId: x.pixelId, accessToken: x.accessToken as string, testEventCode: x.testEventCode }));
        if (vpx.length === 0) continue;
        capiCalls.push(fireServerConversion(vpx, {
          eventName: "Purchase",
          eventId: sessionRef,
          value: agg.amount,
          currency: "XOF",
          email: user.email,
          contentIds: agg.contentIds,
          eventSourceUrl: appUrl,
        }));
      }
      // Pixels PLATEFORME (pubs Novakou) : total encaissé de la commande.
      capiCalls.push(fireServerConversion(platformCapiPixels(), {
        eventName: "Purchase",
        eventId: sessionRef,
        value: totalAmount,
        currency: "XOF",
        email: user.email,
        eventSourceUrl: appUrl,
      }));
      // Attendre l'envoi (serverless) — borné à 4 s pour ne pas retenir le webhook.
      await Promise.race([
        Promise.allSettled(capiCalls),
        new Promise((r) => setTimeout(r, 4000)),
      ]);
    } catch (e) {
      console.error("[fulfillment capi]", e);
    }
  }

  // ── Trace de l'achat du PACK ──────────────────────────────────────────────
  // Les formations et produits sont déjà livrés au-dessus. Ceci enregistre
  // l'achat du pack en tant que tel : statistiques vendeur, droit de laisser un
  // avis, historique d'achat. `paymentRef` est unique en base, donc une
  // deuxième livraison du même paiement ne crée pas de doublon.
  if (pack) {
    await prisma.productBundlePurchase
      .upsert({
        where: { paymentRef: sessionRef },
        update: {},
        create: {
          bundleId: pack.id,
          userId,
          paidAmount: Math.round(totalAmount),
          paymentRef: sessionRef,
          provider: "novakou",
          status: "PAID",
        },
      })
      .catch((err) => {
        // Ne JAMAIS faire échouer une livraison déjà effectuée pour une trace
        // manquante : l'acheteur a son contenu, c'est ce qui compte.
        console.error("[fulfillment pack] trace non enregistrée", err);
      });
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
