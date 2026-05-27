// Cron de réconciliation des payouts Moneroo + PayGenius.
//
// Bureau session 4 — post-mortem "payouts qui échouent" (les deux providers).
// Cause racine identifiée : le statut `InstructorWithdrawal` reste EN_ATTENTE
// après init provider, et dépend du webhook `payout.success`/`payout.failed`
// pour passer à TRAITE/REFUSE. Si le webhook ne fire pas (URL non configurée
// chez le provider, secret rotaté, downtime, etc.), le retrait reste piégé
// même si l'argent est parti.
//
// Ce cron tourne toutes les 10 min et appelle `retrievePayout` côté
// provider pour chaque retrait `EN_ATTENTE` avec `paymentRef != null`
// et `paymentProvider in (moneroo, paygenius)`. Idempotent : ne touche
// pas les rows déjà finalisées.
//
// Trigger : `vercel.json` cron `0,10,20,30,40,50 * * * *` (toutes les 10 min)
//           OU Vercel Cron `*/10 * * * *` selon la version supportée.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { retrievePayout as retrieveMonerooPayout, isMonerooConfigured } from "@/lib/moneroo";
import { retrievePayout as retrievePayGeniusPayout, isPayGeniusConfigured } from "@/lib/paygenius";
import { requireCronAuth } from "@/lib/cron/auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Provider = "moneroo" | "paygenius";

interface Outcome {
  withdrawalId: string;
  provider: Provider;
  before: string;
  after: string;
  message?: string;
}

type ProviderStatus = "pending" | "success" | "failed" | "processing" | "cancelled" | "unknown";

async function reconcileOne(w: {
  id: string;
  amount: number;
  paymentRef: string | null;
  paymentProvider: string | null;
  method: string;
  instructeurId: string;
  instructeur: { user: { id: string } | null };
}): Promise<Outcome | null> {
  if (!w.paymentRef || !w.paymentProvider) return null;
  const provider = w.paymentProvider as Provider;

  // Lecture du status courant côté provider.
  let providerStatus: ProviderStatus = "unknown";
  let providerAmount = 0;
  try {
    if (provider === "moneroo" && isMonerooConfigured()) {
      const r = await retrieveMonerooPayout(w.paymentRef);
      providerStatus = (r.status ?? "unknown") as ProviderStatus;
      providerAmount = r.amount ?? 0;
    } else if (provider === "paygenius" && isPayGeniusConfigured()) {
      const r = await retrievePayGeniusPayout(w.paymentRef);
      providerStatus = (r.status ?? "unknown") as ProviderStatus;
      providerAmount = r.amount ?? 0;
    } else {
      return null; // provider non configuré
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[payout-reconcile] retrievePayout ${provider} échec withdrawal=${w.id}`, msg);
    return { withdrawalId: w.id, provider, before: "EN_ATTENTE", after: "EN_ATTENTE", message: `retrieve_failed:${msg.slice(0, 100)}` };
  }

  // Décision : appliquer le bon statut côté DB.
  if (providerStatus === "success") {
    await prisma.instructorWithdrawal.update({
      where: { id: w.id },
      data: { status: "TRAITE", processedAt: new Date(), errorMessage: null },
    });
    // Notification user — best-effort
    if (w.instructeur.user?.id) {
      await prisma.notification
        .create({
          data: {
            userId: w.instructeur.user.id,
            type: "PAYMENT",
            title: "Retrait versé ✅",
            message: `Vos ${Math.round(w.amount)} FCFA ont été versés (via ${provider}). Vérifiez votre compte Mobile Money. Confirmation détectée par cron de réconciliation.`,
            link: w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet",
          },
        })
        .catch(() => null);
    }
    console.log(`[payout-reconcile] ${w.id} EN_ATTENTE → TRAITE (provider=${provider}, amount=${providerAmount})`);
    return { withdrawalId: w.id, provider, before: "EN_ATTENTE", after: "TRAITE" };
  }

  if (providerStatus === "failed" || providerStatus === "cancelled") {
    await prisma.instructorWithdrawal.update({
      where: { id: w.id },
      data: {
        status: "REFUSE",
        processedAt: new Date(),
        errorMessage: `Provider a rejeté (status=${providerStatus})`,
        refusedReason: `Échec du transfert ${provider}. Vérifiez vos coordonnées de réception et créez une nouvelle demande.`,
      },
    });
    if (w.instructeur.user?.id) {
      await prisma.notification
        .create({
          data: {
            userId: w.instructeur.user.id,
            type: "PAYMENT",
            title: "Retrait échoué",
            message: `Votre retrait de ${Math.round(w.amount)} FCFA n'a pas pu aboutir. Vérifiez vos coordonnées et créez une nouvelle demande.`,
            link: w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet",
          },
        })
        .catch(() => null);
    }
    console.log(`[payout-reconcile] ${w.id} EN_ATTENTE → REFUSE (provider=${provider})`);
    return { withdrawalId: w.id, provider, before: "EN_ATTENTE", after: "REFUSE", message: providerStatus };
  }

  // pending / processing — on touche pas, on retentera au prochain tour.
  return { withdrawalId: w.id, provider, before: "EN_ATTENTE", after: "EN_ATTENTE", message: providerStatus };
}

export async function GET(request: NextRequest) {
  const auth = requireCronAuth(request);
  if (auth) return auth;

  // Cherche tous les retraits coincés en EN_ATTENTE avec un paymentRef
  // (= l'init provider a réussi, on attend juste la confirmation finale).
  // On limite à ceux >= 5 min d'âge pour laisser le webhook arriver d'abord.
  // 5 min minimum d'âge : laisse le webhook arriver d'abord avant de poller.
  // `InstructorWithdrawal` n'a pas de champ `updatedAt` au schéma — on filtre
  // sur `createdAt` à la place (équivalent fonctionnel : un retrait avec
  // paymentRef = un init déjà fait, le createdAt borne la fenêtre).
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
  const stuck = await prisma.instructorWithdrawal.findMany({
    where: {
      status: "EN_ATTENTE",
      paymentRef: { not: null },
      paymentProvider: { in: ["moneroo", "paygenius"] },
      createdAt: { lt: fiveMinAgo },
    },
    select: {
      id: true,
      amount: true,
      paymentRef: true,
      paymentProvider: true,
      method: true,
      instructeurId: true,
      instructeur: { select: { user: { select: { id: true } } } },
    },
    take: 50, // burst protection
    orderBy: { createdAt: "asc" },
  });

  console.log(`[payout-reconcile] scanning ${stuck.length} stuck withdrawal(s)`);

  const outcomes: Outcome[] = [];
  for (const w of stuck) {
    const out = await reconcileOne(w);
    if (out) outcomes.push(out);
  }

  return NextResponse.json({
    runAt: new Date().toISOString(),
    scanned: stuck.length,
    finalized: outcomes.filter((o) => o.after !== "EN_ATTENTE").length,
    stillPending: outcomes.filter((o) => o.after === "EN_ATTENTE").length,
    outcomes,
  });
}

/** Permet à l'admin de déclencher la réconciliation manuellement pour 1 retrait. */
export async function POST(request: NextRequest) {
  const auth = requireCronAuth(request);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const w = await prisma.instructorWithdrawal.findUnique({
    where: { id },
    include: {
      instructeur: { select: { user: { select: { id: true } } } },
    },
  });
  if (!w) return NextResponse.json({ error: "Retrait introuvable" }, { status: 404 });
  if (!w.paymentRef || !w.paymentProvider) {
    return NextResponse.json({ error: "Retrait sans paymentRef — rien à réconcilier" }, { status: 400 });
  }

  const out = await reconcileOne(w);
  return NextResponse.json({ data: out ?? { withdrawalId: id, before: "EN_ATTENTE", after: "EN_ATTENTE", message: "no_change" } });
}
