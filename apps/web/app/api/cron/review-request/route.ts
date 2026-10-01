/**
 * Cron : demande d'avis après achat (deux relances).
 *
 * Avant, aucun email n'invitait l'acheteur à noter son produit/formation : les
 * fiches restaient à « 0 avis » et convertissaient moins. Ce cron envoie :
 *   • Relance 1 — ~5 jours après l'achat, si aucun avis n'a été laissé ;
 *   • Relance 2 (dernière) — ~5 jours après la relance 1 (≈ 10 j après l'achat),
 *     seulement si toujours aucun avis.
 *
 * Idempotence : `reviewAskedAt` et `reviewReminderAt` (sur DigitalProductPurchase
 * et Enrollment) marquent ce qui a déjà été envoyé. Un achat n'est jamais
 * relancé deux fois au même stade.
 *
 * Anti-spam : la relance 1 ne vise QUE les achats de 5 à 20 jours. On n'arrose
 * donc jamais tout l'historique au premier passage — seuls les achats récents,
 * puis chaque nouvel achat au fil de l'eau, reçoivent la demande.
 *
 * Authentification : Bearer CRON_SECRET. Cadence : une fois par jour.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { sendReviewRequestEmail } from "@/lib/email/formations";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JOUR = 86_400_000;
const MAX_PAR_PASSAGE = 120; // plafond par type et par stade, deliverabilité

async function handle(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const now = Date.now();
  const borneStage1Debut = new Date(now - 20 * JOUR); // pas plus vieux que 20 j
  const borneStage1Fin = new Date(now - 5 * JOUR); //    au moins 5 j
  const borneStage2 = new Date(now - 5 * JOUR); //        relancé il y a ≥ 5 j
  let envoyes = 0;
  const erreurs: string[] = [];

  // Un helper qui envoie et marque, en isolant chaque échec.
  async function envoyer(
    p: { email: string | null | undefined; name: string | null | undefined; title: string; kind: "product" | "formation"; itemId: string; final: boolean },
    marquer: () => Promise<unknown>,
  ) {
    if (!p.email) return;
    try {
      await sendReviewRequestEmail({ email: p.email, name: p.name || "", itemTitle: p.title, kind: p.kind, itemId: p.itemId, final: p.final });
      await marquer();
      envoyes++;
    } catch (e) {
      erreurs.push(`${p.kind}:${p.itemId} ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`);
    }
  }

  // ── PRODUITS ──
  // Relance 1
  const prodStage1 = await prisma.digitalProductPurchase.findMany({
    where: {
      reviewAskedAt: null,
      createdAt: { gte: borneStage1Debut, lte: borneStage1Fin },
      product: { reviews: { none: {} } }, // aucun avis du tout → filtre grossier
    },
    take: MAX_PAR_PASSAGE,
    select: { id: true, userId: true, productId: true, user: { select: { email: true, name: true } }, product: { select: { title: true } } },
  });
  for (const a of prodStage1) {
    // L'acheteur a-t-il DÉJÀ noté CE produit ? (le filtre ci-dessus est large)
    const deja = await prisma.digitalProductReview.findUnique({ where: { userId_productId: { userId: a.userId, productId: a.productId } }, select: { id: true } }).catch(() => null);
    if (deja) { await prisma.digitalProductPurchase.update({ where: { id: a.id }, data: { reviewAskedAt: new Date() } }); continue; }
    await envoyer(
      { email: a.user?.email, name: a.user?.name, title: a.product?.title ?? "votre produit", kind: "product", itemId: a.productId, final: false },
      () => prisma.digitalProductPurchase.update({ where: { id: a.id }, data: { reviewAskedAt: new Date() } }),
    );
  }
  // Relance 2
  const prodStage2 = await prisma.digitalProductPurchase.findMany({
    where: { reviewAskedAt: { lte: borneStage2 }, reviewReminderAt: null },
    take: MAX_PAR_PASSAGE,
    select: { id: true, userId: true, productId: true, user: { select: { email: true, name: true } }, product: { select: { title: true } } },
  });
  for (const a of prodStage2) {
    const deja = await prisma.digitalProductReview.findUnique({ where: { userId_productId: { userId: a.userId, productId: a.productId } }, select: { id: true } }).catch(() => null);
    if (deja) { await prisma.digitalProductPurchase.update({ where: { id: a.id }, data: { reviewReminderAt: new Date() } }); continue; }
    await envoyer(
      { email: a.user?.email, name: a.user?.name, title: a.product?.title ?? "votre produit", kind: "product", itemId: a.productId, final: true },
      () => prisma.digitalProductPurchase.update({ where: { id: a.id }, data: { reviewReminderAt: new Date() } }),
    );
  }

  // ── FORMATIONS ──
  const formStage1 = await prisma.enrollment.findMany({
    where: { reviewAskedAt: null, refundedAt: null, createdAt: { gte: borneStage1Debut, lte: borneStage1Fin } },
    take: MAX_PAR_PASSAGE,
    select: { id: true, userId: true, formationId: true, user: { select: { email: true, name: true } }, formation: { select: { title: true } } },
  });
  for (const e of formStage1) {
    const deja = await prisma.formationReview.findUnique({ where: { userId_formationId: { userId: e.userId, formationId: e.formationId } }, select: { id: true } }).catch(() => null);
    if (deja) { await prisma.enrollment.update({ where: { id: e.id }, data: { reviewAskedAt: new Date() } }); continue; }
    await envoyer(
      { email: e.user?.email, name: e.user?.name, title: e.formation?.title ?? "votre formation", kind: "formation", itemId: e.formationId, final: false },
      () => prisma.enrollment.update({ where: { id: e.id }, data: { reviewAskedAt: new Date() } }),
    );
  }
  const formStage2 = await prisma.enrollment.findMany({
    where: { reviewAskedAt: { lte: borneStage2 }, reviewReminderAt: null, refundedAt: null },
    take: MAX_PAR_PASSAGE,
    select: { id: true, userId: true, formationId: true, user: { select: { email: true, name: true } }, formation: { select: { title: true } } },
  });
  for (const e of formStage2) {
    const deja = await prisma.formationReview.findUnique({ where: { userId_formationId: { userId: e.userId, formationId: e.formationId } }, select: { id: true } }).catch(() => null);
    if (deja) { await prisma.enrollment.update({ where: { id: e.id }, data: { reviewReminderAt: new Date() } }); continue; }
    await envoyer(
      { email: e.user?.email, name: e.user?.name, title: e.formation?.title ?? "votre formation", kind: "formation", itemId: e.formationId, final: true },
      () => prisma.enrollment.update({ where: { id: e.id }, data: { reviewReminderAt: new Date() } }),
    );
  }

  if (envoyes > 0 || erreurs.length) {
    console.log(`[review-request] ${envoyes} email(s) envoyé(s), ${erreurs.length} échec(s)`);
  }
  return NextResponse.json({ ok: true, envoyes, erreurs: erreurs.slice(0, 10) });
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
