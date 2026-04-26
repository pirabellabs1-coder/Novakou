import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initPayment, isMonerooConfigured } from "@/lib/moneroo";
import { sendSubscriptionRenewalEmail } from "@/lib/email/formations";

/**
 * GET /api/cron/subscription-renewal
 *
 * Cron Vercel — tourne 1× par jour.
 *
 * Pour chaque Subscription `active` dont `currentPeriodEnd` arrive dans les
 * 24 heures (ou est passée), on déclenche un nouveau checkout Moneroo en
 * mode `subscription_renewal`. Le webhook moneroo finalisera la mise à jour
 * de `currentPeriodEnd` au prochain cycle.
 *
 * Note : Moneroo en mode hosted-checkout ne fait pas de prélèvement
 * automatique sans intervention de l'acheteur. Pour le MVP on initie un
 * paiement et on envoie le lien à l'apprenant par email (TODO V2 : auto-debit
 * via une méthode de paiement enregistrée). L'apprenant a 14 jours de grace
 * pour payer avant l'expiration (cf. /cron/subscription-expire).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isMonerooConfigured()) {
    return NextResponse.json({ skipped: true, reason: "MONEROO_SECRET_KEY non configurée" });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

  // Subscriptions actives proches de leur fin et qui ne sont pas annulées
  const subs = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "trialing"] },
      currentPeriodEnd: { lte: horizon },
      cancelAtPeriodEnd: false,
      // Pas de checkout déjà initié dans les 23h écoulées
      OR: [
        { nextInvoiceAt: null },
        { nextInvoiceAt: { lte: new Date(now.getTime() - 23 * 60 * 60 * 1000) } },
      ],
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      plan: { select: { id: true, name: true, price: true, currency: true, interval: true, instructeurId: true, isActive: true } },
    },
    take: 200, // hard cap pour éviter de saturer Moneroo
  });

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  const results: Array<{ subId: string; status: "ok" | "skipped" | "error"; reason?: string }> = [];

  for (const sub of subs) {
    if (!sub.plan?.isActive) {
      results.push({ subId: sub.id, status: "skipped", reason: "plan_inactive" });
      continue;
    }
    if (!sub.user?.email) {
      results.push({ subId: sub.id, status: "skipped", reason: "no_email" });
      continue;
    }

    try {
      const firstName = (sub.user.name || sub.user.email.split("@")[0]).split(" ")[0];
      const lastName = (sub.user.name || "").split(" ").slice(1).join(" ") || "Membre";

      const payment = await initPayment({
        amount: Math.round(sub.plan.price),
        currency: sub.plan.currency || "XOF",
        description: `Renouvellement : ${sub.plan.name}`,
        customer: {
          email: sub.user.email,
          first_name: firstName,
          last_name: lastName,
        },
        return_url: `${APP_URL}/payment/return`,
        metadata: {
          type: "subscription_renewal",
          planId: sub.plan.id,
          subscriptionId: sub.id,
          userId: sub.user.id,
          instructeurId: sub.plan.instructeurId,
          interval: sub.plan.interval,
        },
      });

      // Note the checkout link to dedupe within 23h.
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextInvoiceAt: now, paymentMethod: payment.checkout_url ?? null },
      }).catch(() => null);

      // Email the apprenant the checkout link so they can pay.
      if (payment.checkout_url) {
        sendSubscriptionRenewalEmail({
          email: sub.user.email,
          name: firstName,
          planName: sub.plan.name,
          price: sub.plan.price,
          currency: sub.plan.currency || "XOF",
          interval: sub.plan.interval,
          checkoutUrl: payment.checkout_url,
          currentPeriodEnd: sub.currentPeriodEnd,
        }).catch((e) => console.warn("[cron/subscription-renewal email]", sub.id, e?.message ?? e));
      }

      results.push({ subId: sub.id, status: "ok" });
    } catch (err) {
      console.error("[cron/subscription-renewal]", sub.id, err);
      results.push({
        subId: sub.id,
        status: "error",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: subs.length,
    results,
    runAt: now.toISOString(),
  });
}
