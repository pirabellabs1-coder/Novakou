import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/admin/ventes-bloquees   (admin uniquement)
 *
 * « Une vente a été faite, aucune trace sur la plateforme. »
 *
 * Une tentative de paiement laisse toujours une ligne, même quand la commande
 * n'aboutit pas. Cet écran montre ces lignes telles quelles : c'est le seul
 * endroit où l'on voit la différence entre « personne n'a payé » et « quelqu'un
 * a payé et la livraison a échoué ».
 *
 * Lecture seule, aucune écriture : on constate, on ne répare pas ici.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Une tentative encore ouverte au-delà de ce délai mérite un regard. */
const SUSPECT_MINUTES = 10;

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toString().toUpperCase();
  if (!session?.user || (role !== "ADMIN" && !IS_DEV)) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  const depuis = new Date(Date.now() - 7 * 24 * 3600_000);
  const seuil = new Date(Date.now() - SUSPECT_MINUTES * 60_000);

  const tentatives = await prisma.checkoutAttempt.findMany({
    where: { createdAt: { gte: depuis } },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      createdAt: true,
      status: true,
      amount: true,
      paymentMethod: true,
      providerRef: true,
      failureCode: true,
      failureReason: true,
      userId: true,
      visitorEmail: true,
      visitorPhone: true,
      metadata: true,
    },
  });

  const lignes = tentatives.map((t) => {
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    return {
      quand: t.createdAt.toISOString(),
      statut: t.status,
      montant: Math.round(t.amount),
      moyen: t.paymentMethod ?? null,
      passerelle: typeof meta.paymentProvider === "string" ? meta.paymentProvider : null,
      referenceFournisseur: t.providerRef,
      referenceInterne: typeof meta.internalRef === "string" ? meta.internalRef : null,
      acheteur: t.visitorEmail ?? (t.userId ? "compte connecté" : null),
      telephone: t.visitorPhone,
      compteRattache: Boolean(t.userId),
      echec: t.failureCode ? `${t.failureCode} — ${(t.failureReason ?? "").slice(0, 160)}` : null,
    };
  });

  /**
   * Les cas qui coûtent de l'argent : une demande est bien partie chez le
   * fournisseur (référence obtenue), elle n'est ni livrée ni marquée en échec,
   * et le délai raisonnable est dépassé. Si l'acheteur a confirmé sur son
   * téléphone, il a payé sans rien recevoir.
   */
  const aVerifier = tentatives
    .filter((t) => t.status === "STARTED" && t.providerRef && t.createdAt < seuil)
    .map((t) => {
      const meta = (t.metadata ?? {}) as Record<string, unknown>;
      return {
        quand: t.createdAt.toISOString(),
        montant: Math.round(t.amount),
        moyen: t.paymentMethod,
        passerelle: typeof meta.paymentProvider === "string" ? meta.paymentProvider : null,
        referenceFournisseur: t.providerRef,
        referenceInterne: typeof meta.internalRef === "string" ? meta.internalRef : null,
        telephone: t.visitorPhone,
        acheteur: t.visitorEmail,
        /** Sans compte rattaché, la livraison est impossible même payée. */
        livrableAujourdhui: Boolean(t.userId),
      };
    });

  const parStatut = tentatives.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    data: {
      fenetre: "7 jours",
      total: tentatives.length,
      parStatut,
      aVerifier,
      lignes,
      note:
        "STARTED = demande partie, pas encore constatée. COMPLETED = livrée. " +
        "FAILED = refusée. Une ligne dans « aVerifier » avec une référence " +
        "fournisseur signifie qu'il faut aller regarder cette référence dans le " +
        "tableau de bord de la passerelle avant toute conclusion.",
    },
  });
}
