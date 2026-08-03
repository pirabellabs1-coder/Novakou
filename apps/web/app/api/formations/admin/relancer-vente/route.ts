import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { reconcileCollectAttempt } from "@/lib/payments/reconcile-collect";

/**
 * POST /api/formations/admin/relancer-vente   (admin uniquement)
 * body : { refs?: string[] }   — références internes ; toutes les bloquées si omis
 *
 * Force la reprise d'une vente restée en attente : on redemande son état au
 * fournisseur et, s'il confirme l'encaissement, on livre.
 *
 * Le cron fait déjà ce travail toutes les 5 minutes. Ce point existe pour deux
 * raisons : livrer TOUT DE SUITE un acheteur qui a payé et attend, et surtout
 * VOIR la raison quand ça ne passe pas — le cron, lui, échoue en silence.
 *
 * Sans risque : la livraison est idempotente, une commande déjà livrée n'est
 * pas livrée deux fois, et le montant vient de la tentative enregistrée à
 * l'initialisation, jamais de cette requête.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Au-delà, une tentative n'est plus interrogeable utilement chez le fournisseur. */
const FENETRE_HEURES = 72;

/**
 * Accessible aussi en GET : ouvrir un lien depuis le navigateur est la seule
 * façon pratique d'agir quand on est devant un incident. L'action reste sans
 * risque — la livraison est idempotente, la relancer ne livre pas deux fois.
 */
export async function GET(req: NextRequest) {
  return traiter(req);
}

export async function POST(req: NextRequest) {
  return traiter(req);
}

async function traiter(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toString().toUpperCase();
  if (!session?.user || (role !== "ADMIN" && !IS_DEV)) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const depuisUrl = (req.nextUrl.searchParams.get("refs") ?? "")
    .split(",").map((r) => r.trim()).filter(Boolean);
  const refs: string[] = Array.isArray(body?.refs)
    ? body.refs.filter((r: unknown) => typeof r === "string")
    : depuisUrl;

  const tentatives = await prisma.checkoutAttempt.findMany({
    where: {
      status: "STARTED",
      providerRef: { not: null },
      createdAt: { gte: new Date(Date.now() - FENETRE_HEURES * 3600_000) },
      // Un filtre JSON n'accepte pas de liste : on combine des égalités.
      ...(refs.length > 0
        ? { OR: refs.map((r) => ({ metadata: { path: ["internalRef"], equals: r } })) }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const resultats: Array<Record<string, unknown>> = [];
  let livrees = 0;
  let refusees = 0;
  let enAttente = 0;

  for (const t of tentatives) {
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    const ligne: Record<string, unknown> = {
      quand: t.createdAt.toISOString(),
      montant: Math.round(t.amount),
      acheteur: t.visitorEmail,
      moyen: t.paymentMethod,
      passerelle: typeof meta.paymentProvider === "string" ? meta.paymentProvider : null,
      referenceFournisseur: t.providerRef,
      referenceInterne: typeof meta.internalRef === "string" ? meta.internalRef : null,
    };
    try {
      const r = await reconcileCollectAttempt(t);
      ligne.resultat = r.delivered ? "LIVRÉE" : r.status === "failed" ? "refusée par le fournisseur" : "toujours en attente";
      // La raison est l'information la plus utile ici : c'est elle qui manque
      // quand le cron échoue sans rien dire.
      if (r.reason) ligne.raison = r.reason;
      if (r.delivered) livrees++;
      else if (r.status === "failed") refusees++;
      else enAttente++;
    } catch (err) {
      ligne.resultat = "ERREUR";
      ligne.raison = err instanceof Error ? err.message : String(err);
      enAttente++;
    }
    resultats.push(ligne);
  }

  return NextResponse.json({
    data: {
      examinees: tentatives.length,
      livrees,
      refusees,
      enAttente,
      resultats,
      note:
        "« toujours en attente » signifie que le fournisseur n'a pas encore " +
        "confirmé l'encaissement : l'acheteur n'a probablement pas validé sur " +
        "son téléphone. La raison ci-dessus dit si l'appel a échoué.",
    },
  });
}
