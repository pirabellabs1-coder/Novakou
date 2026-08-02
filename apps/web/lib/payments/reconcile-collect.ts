import { prisma } from "@/lib/prisma";
import { fulfillCheckout } from "@/lib/formations/fulfillment";

/**
 * Réconciliation d'un ENCAISSEMENT : constate l'état réel du paiement auprès du
 * fournisseur, puis livre le produit.
 *
 * Pourquoi ce module existe
 * -------------------------
 * Un encaissement Mobile Money est un « push » : l'acheteur valide sur son
 * téléphone, il n'y a pas de redirection de retour. Jusqu'ici la livraison ne
 * se déclenchait que depuis la page d'attente, donc depuis le NAVIGATEUR de
 * l'acheteur. Onglet fermé, batterie vide, 3G qui saute — et une vente
 * encaissée restait non livrée.
 *
 * Trois chemins appellent désormais cette fonction, et le premier arrivé livre :
 *   1. la page d'attente        (rapide, mais dépend du navigateur) ;
 *   2. le webhook du fournisseur (rapide, mais dépend de sa configuration) ;
 *   3. le cron de réconciliation (lent, mais ne dépend de rien).
 *
 * Le n°3 est le filet : même si 1 et 2 tombent, la vente est livrée.
 *
 * SÛRETÉ
 * ------
 *  - le statut est TOUJOURS demandé au fournisseur via un appel authentifié,
 *    jamais lu dans le corps d'un webhook (qui n'est pas signé de façon
 *    vérifiable chez tous nos fournisseurs) ;
 *  - le montant et le contenu de la commande viennent de la tentative
 *    enregistrée à l'initialisation, jamais de la requête entrante ;
 *  - `fulfillCheckout` est idempotent : trois chemins concurrents ne livrent
 *    qu'une seule fois.
 */

export type CollectReconcileOutcome = {
  /** true si une tentative correspondait à cette référence. */
  matched: boolean;
  status: "success" | "failed" | "pending" | "unknown";
  /** true si la livraison a été effectuée (ou l'était déjà). */
  delivered: boolean;
  attemptId?: string;
  reason?: string;
};

/** Fournisseurs qui savent encaisser en direct et répondre sur un statut. */
const STATUS_CHECKERS: Record<string, (ref: string) => Promise<{ status: "success" | "failed" | "pending" }>> = {
  feexpay: async (ref) => {
    const { checkCollectStatus } = await import("@/lib/feexpay");
    return checkCollectStatus(ref);
  },
  fedapay: async (ref) => {
    const { checkCollectStatus } = await import("@/lib/fedapay");
    return checkCollectStatus(ref);
  },
};

/**
 * Retrouve la tentative d'achat visée par une référence.
 *
 * Les fournisseurs ne renvoient pas tous la même clé : certains renvoient LEUR
 * identifiant de transaction (`providerRef`), d'autres l'identifiant que nous
 * leur avons transmis (`internalRef`, passé en `customId`/`callback_info`).
 * On accepte les deux plutôt que de parier sur l'un.
 */
export async function findAttemptByAnyRef(reference: string) {
  const byProviderRef = await prisma.checkoutAttempt.findFirst({
    where: { providerRef: reference },
    orderBy: { createdAt: "desc" },
  });
  if (byProviderRef) return byProviderRef;

  return prisma.checkoutAttempt.findFirst({
    where: { metadata: { path: ["internalRef"], equals: reference } },
    orderBy: { createdAt: "desc" },
  });
}

type AttemptRow = NonNullable<Awaited<ReturnType<typeof findAttemptByAnyRef>>>;

/**
 * Constate le statut réel puis livre si le paiement est passé.
 *
 * @param attempt tentative déjà chargée (évite une requête au cron qui vient
 *                justement de les lister).
 */
export async function reconcileCollectAttempt(attempt: AttemptRow): Promise<CollectReconcileOutcome> {
  // Déjà finalisée : rien à refaire, et surtout pas un appel fournisseur.
  if (attempt.status === "COMPLETED") {
    return { matched: true, status: "success", delivered: true, attemptId: attempt.id };
  }
  if (attempt.status === "FAILED") {
    return { matched: true, status: "failed", delivered: false, attemptId: attempt.id };
  }

  const meta = (attempt.metadata ?? {}) as Record<string, unknown>;
  const provider = String(meta.paymentProvider ?? "").toLowerCase();
  const checker = STATUS_CHECKERS[provider];
  if (!checker) {
    return { matched: true, status: "unknown", delivered: false, attemptId: attempt.id, reason: `Fournisseur « ${provider || "?"} » sans suivi de statut` };
  }

  // La référence à interroger est celle que le fournisseur nous a rendue.
  const providerRef = attempt.providerRef;
  if (!providerRef) {
    return { matched: true, status: "unknown", delivered: false, attemptId: attempt.id, reason: "Aucune référence fournisseur enregistrée" };
  }

  let status: "success" | "failed" | "pending";
  try {
    status = (await checker(providerRef)).status;
  } catch (err) {
    // Fournisseur injoignable : on ne conclut rien. Le paiement est peut-être
    // en cours ; annoncer un échec ici priverait l'acheteur de son produit.
    return {
      matched: true,
      status: "pending",
      delivered: false,
      attemptId: attempt.id,
      reason: `Statut indisponible : ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (status === "pending") {
    return { matched: true, status: "pending", delivered: false, attemptId: attempt.id };
  }

  if (status === "failed") {
    await prisma.checkoutAttempt
      .update({
        where: { id: attempt.id },
        data: { status: "FAILED", failureReason: "Paiement refusé ou annulé par l'acheteur" },
      })
      .catch(() => null);
    return { matched: true, status: "failed", delivered: false, attemptId: attempt.id };
  }

  // ── Paiement confirmé : livrer ────────────────────────────────────────────
  if (!attempt.userId) {
    return {
      matched: true,
      status: "success",
      delivered: false,
      attemptId: attempt.id,
      reason: "Tentative sans compte acheteur — livraison impossible",
    };
  }

  const internalRef = typeof meta.internalRef === "string" ? meta.internalRef : attempt.id;
  const formationIds = toIdList(meta.formationIds);
  const productIds = toIdList(meta.productIds);

  try {
    await fulfillCheckout({
      userId: attempt.userId,
      formationIds,
      productIds,
      discountCodeStr: typeof meta.discountCode === "string" && meta.discountCode ? meta.discountCode : null,
      sessionRef: internalRef,
    });
  } catch (err) {
    // L'argent EST encaissé. On laisse la tentative ouverte pour que le cron
    // repasse : marquer COMPLETED ici enterrerait définitivement la livraison.
    console.error("[reconcile-collect] paiement OK mais livraison échouée:", internalRef, err);
    return {
      matched: true,
      status: "success",
      delivered: false,
      attemptId: attempt.id,
      reason: err instanceof Error ? err.message : String(err),
    };
  }

  await prisma.checkoutAttempt
    .update({ where: { id: attempt.id }, data: { status: "COMPLETED", recoveredAt: new Date() } })
    .catch(() => null);

  return { matched: true, status: "success", delivered: true, attemptId: attempt.id };
}

/** Variante par référence, pour les webhooks qui n'ont que ça. */
export async function reconcileCollectByRef(reference: string): Promise<CollectReconcileOutcome> {
  const attempt = await findAttemptByAnyRef(reference);
  if (!attempt) return { matched: false, status: "unknown", delivered: false };
  return reconcileCollectAttempt(attempt);
}

/**
 * Les identifiants sont stockés tantôt en tableau, tantôt en chaîne séparée par
 * des virgules selon le chemin d'écriture. On accepte les deux.
 */
function toIdList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string" && x.length > 0);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}
