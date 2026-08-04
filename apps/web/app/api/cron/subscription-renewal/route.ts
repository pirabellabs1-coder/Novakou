import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionRenewalEmail } from "@/lib/email/formations";
import { requireCronAuth } from "@/lib/cron/auth";

/**
 * GET /api/cron/subscription-renewal
 *
 * Cron Vercel — tourne 1× par jour.
 *
 * Pour chaque Subscription `active` dont `currentPeriodEnd` arrive dans les
 * 24 heures (ou est passée), on envoie à l'apprenant un lien vers notre page
 * d'abonnement. Le paiement finalisera la mise à jour
 * de `currentPeriodEnd` au prochain cycle.
 *
 * Note : le paiement Mobile Money ne fait pas de prélèvement
 * automatique sans intervention de l'acheteur. Pour le MVP on initie un
 * paiement et on envoie le lien à l'apprenant par email (TODO V2 : auto-debit
 * via une méthode de paiement enregistrée). L'apprenant a 14 jours de grace
 * pour payer avant l'expiration (cf. /cron/subscription-expire).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  // Plus de garde sur une passerelle : la relance envoie vers notre propre
  // page d'abonnement, qui choisit elle-même la passerelle au moment de payer.

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h
  const graceFloor = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // -14j

  // Subscriptions proches de leur fin (ou en past_due dans les 14j de grâce) et
  // non annulées → on (re)envoie un lien de paiement. Inclure past_due donne un
  // chemin de récupération in-app aux abonnés dont le 1er paiement a échoué.
  const subs = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "trialing", "past_due"] },
      currentPeriodEnd: { lte: horizon, gte: graceFloor },
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
    take: 200, // hard cap pour éviter de saturer la passerelle
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

      // Le paiement passe par l'écran unique de la plateforme :
      // toutes les relances passent par elle, même si une vieille facture
      // référençait l'ancienne passerelle retirée.

      // On envoie l'apprenant sur NOTRE page d'abonnement : il y règle son
      // renouvellement par l'écran de paiement de la plateforme. Auparavant, ce
      // cron créait lui-même un lien chez une passerelle retirée — l'e-mail de
      // relance pointait donc vers une page morte.
      const checkoutUrl = `${APP_URL}/abonnement/${sub.plan.id}`;

      // Note l'instant de relance pour dédupliquer dans les 23h (on n'écrit PAS
      // l'URL dans paymentMethod : ce champ = snapshot du moyen de paiement, pas
      // une URL de checkout, et il n'est lu nulle part).
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextInvoiceAt: now },
      }).catch(() => null);

      // Email the apprenant the checkout link so they can pay.
      if (checkoutUrl) {
        sendSubscriptionRenewalEmail({
          email: sub.user.email,
          name: firstName,
          planName: sub.plan.name,
          price: sub.plan.price,
          currency: sub.plan.currency || "XOF",
          interval: sub.plan.interval,
          checkoutUrl,
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
