import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder1, sendReminder2 } from "@/lib/email/abandon-reminders";
import { requireCronAuth } from "@/lib/cron/auth";

/**
 * POST /api/cron/send-abandon-reminders
 *
 * Cron Vercel qui envoie les emails de relance aux abandons/echecs.
 *
 * - Email #1 : 20 min apres la tentative (STARTED/FAILED/ABANDONED), jamais envoye
 * - Email #2 : 1h apres la tentative, reminder1 envoye, toujours pas RECOVERED
 *
 * Cible aussi les paniers STARTED (paiement jamais confirme par webhook) car
 * un achat reussi passe l'attempt en COMPLETED + recoveredAt → exclu via
 * recoveredAt:null : on ne relance JAMAIS un acheteur qui a fini par payer.
 *
 * Protection :
 *  - Appele par Vercel Cron avec Authorization: Bearer CRON_SECRET ou
 *    le header x-vercel-cron injecte par Vercel.
 *
 * Idempotent : utilise les timestamps reminder1SentAt/reminder2SentAt pour
 * ne jamais envoyer 2x le meme email.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const log = { reminder1Sent: 0, reminder2Sent: 0, errors: [] as string[] };

  // ─── Email #1 : 20 min+ depuis la tentative, pas encore envoye ───
  const pendingR1 = await prisma.checkoutAttempt.findMany({
    where: {
      status: { in: ["STARTED", "FAILED", "ABANDONED"] },
      reminder1SentAt: null,
      recoveredAt: null,
      createdAt: { lte: twentyMinutesAgo },
      visitorEmail: { not: null },
    },
    take: 50,
    select: {
      id: true, visitorEmail: true, visitorName: true, amount: true, currency: true,
      formation: { select: { title: true, slug: true } },
      product: { select: { title: true, slug: true } },
      instructeur: { select: { user: { select: { name: true } } } },
    },
  });

  for (const a of pendingR1) {
    if (!a.visitorEmail) continue;
    const product = a.formation || a.product;
    if (!product) continue;
    try {
      await sendReminder1({
        to: a.visitorEmail,
        visitorName: a.visitorName,
        productTitle: product.title,
        productSlug: product.slug,
        productKind: a.formation ? "formation" : "product",
        amount: a.amount,
        currency: a.currency,
        vendorName: a.instructeur?.user?.name ?? null,
        attemptId: a.id,
      });
      await prisma.checkoutAttempt.update({
        where: { id: a.id },
        data: { reminder1SentAt: now },
      });
      log.reminder1Sent++;
    } catch (e) {
      log.errors.push(`R1 ${a.id}: ${e instanceof Error ? e.message : "err"}`);
    }
  }

  // ─── Email #2 : 1h+ depuis la tentative, R1 envoye, pas encore recovered ─
  const pendingR2 = await prisma.checkoutAttempt.findMany({
    where: {
      status: { in: ["STARTED", "FAILED", "ABANDONED"] },
      reminder1SentAt: { not: null },
      reminder2SentAt: null,
      recoveredAt: null,
      createdAt: { lte: oneHourAgo },
      visitorEmail: { not: null },
    },
    take: 50,
    select: {
      id: true, visitorEmail: true, visitorName: true, amount: true, currency: true,
      formation: { select: { title: true, slug: true } },
      product: { select: { title: true, slug: true } },
      instructeur: { select: { user: { select: { name: true } } } },
    },
  });

  for (const a of pendingR2) {
    if (!a.visitorEmail) continue;
    const product = a.formation || a.product;
    if (!product) continue;
    try {
      await sendReminder2({
        to: a.visitorEmail,
        visitorName: a.visitorName,
        productTitle: product.title,
        productSlug: product.slug,
        productKind: a.formation ? "formation" : "product",
        amount: a.amount,
        currency: a.currency,
        vendorName: a.instructeur?.user?.name ?? null,
        attemptId: a.id,
      });
      await prisma.checkoutAttempt.update({
        where: { id: a.id },
        data: { reminder2SentAt: now },
      });
      log.reminder2Sent++;
    } catch (e) {
      log.errors.push(`R2 ${a.id}: ${e instanceof Error ? e.message : "err"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    runAt: now.toISOString(),
    ...log,
  });
}
