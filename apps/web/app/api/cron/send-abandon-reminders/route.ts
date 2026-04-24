import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder1, sendReminder2 } from "@/lib/email/abandon-reminders";

/**
 * POST /api/cron/send-abandon-reminders
 *
 * Cron Vercel qui envoie les emails de relance aux abandons/echecs.
 *
 * - Email #1 : 30 min apres tentative ABANDONED/FAILED, jamais envoye
 * - Email #2 : 24h apres reminder1, jamais envoye, toujours pas RECOVERED
 *
 * Protection :
 *  - Appele par Vercel Cron avec Authorization: Bearer CRON_SECRET
 *  - Accepte aussi ?token=<CRON_SECRET> pour tests manuels
 *
 * Idempotent : utilise les timestamps reminder1SentAt/reminder2SentAt pour
 * ne jamais envoyer 2x le meme email.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const token = new URL(request.url).searchParams.get("token");
  if (token === secret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const log = { reminder1Sent: 0, reminder2Sent: 0, errors: [] as string[] };

  // ─── Email #1 : 30 min+ depuis l'abandon, pas encore envoye ───
  const pendingR1 = await prisma.checkoutAttempt.findMany({
    where: {
      status: { in: ["FAILED", "ABANDONED"] },
      reminder1SentAt: null,
      createdAt: { lte: thirtyMinutesAgo },
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

  // ─── Email #2 : 24h+ depuis R1, pas encore envoye, toujours pas recovered ─
  const pendingR2 = await prisma.checkoutAttempt.findMany({
    where: {
      status: { in: ["FAILED", "ABANDONED"] },
      reminder1SentAt: { not: null, lte: oneDayAgo },
      reminder2SentAt: null,
      recoveredAt: null,
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
