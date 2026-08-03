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
  /**
   * Ce qui a été livré, quand ça vient d'être fait. Sert à déclencher
   * l'événement d'achat des pixels vendeurs : sans montant ni liste de
   * produits, aucune régie publicitaire ne peut mesurer la vente.
   */
  fulfilled?: {
    totalAmount: number;
    formationIds: string[];
    productIds: string[];
  };
};

/** Fournisseurs qui savent encaisser en direct et répondre sur un statut. */
const STATUS_CHECKERS: Record<
  string,
  (ref: string, code?: string) => Promise<{ status: "success" | "failed" | "pending"; amount?: number | null }>
> = {
  feexpay: async (ref) => {
    const { checkCollectStatus } = await import("@/lib/feexpay");
    return checkCollectStatus(ref);
  },
  fedapay: async (ref) => {
    const { checkCollectStatus } = await import("@/lib/fedapay");
    return checkCollectStatus(ref);
  },
  ipaymoney: async (ref, code) => {
    const { checkCollectStatus } = await import("@/lib/ipaymoney");
    // Le type ("mobile" / "card") est aussi obligatoire à la consultation.
    return checkCollectStatus(ref, code);
  },
  kkiapay: async (ref) => {
    // La référence est l'identifiant de transaction rendu par la fenêtre.
    const { verifyTransaction } = await import("@/lib/kkiapay");
    return verifyTransaction(ref);
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
  // Une tentative « abandonnée » qu'on reprend redevient une tentative en
  // cours : sinon le cron d'abandon et celui de réconciliation se la
  // renverraient indéfiniment.
  if (attempt.status === "ABANDONED") {
    await prisma.checkoutAttempt
      .update({ where: { id: attempt.id }, data: { status: "STARTED" } })
      .catch(() => null);
  }

  const meta = (attempt.metadata ?? {}) as Record<string, unknown>;
  const provider = String(meta.paymentProvider ?? "").toLowerCase();
  const checker = STATUS_CHECKERS[provider];
  if (!checker) {
    return { matched: true, status: "unknown", delivered: false, attemptId: attempt.id, reason: `Fournisseur « ${provider || "?"} » sans suivi de statut` };
  }

  // La référence à interroger est celle que le fournisseur nous a rendue.
  // Code natif du fournisseur pour cet opérateur (« mobile », « card »…) :
  // certains le réclament aussi à la consultation de statut.
  const { routeFor } = await import("@/lib/payments/registry");
  const codeRoute = routeFor(String(attempt.paymentMethod ?? ""), provider as never, "collect")?.code;

  const providerRef = attempt.providerRef;
  if (!providerRef) {
    return { matched: true, status: "unknown", delivered: false, attemptId: attempt.id, reason: "Aucune référence fournisseur enregistrée" };
  }

  let status: "success" | "failed" | "pending";
  let montantFournisseur: number | null = null;
  try {
    const rep = await checker(providerRef, codeRoute);
    status = rep.status;
    montantFournisseur = typeof rep.amount === "number" && rep.amount > 0 ? rep.amount : null;
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

  let livraison: Awaited<ReturnType<typeof fulfillCheckout>>;
  try {
    livraison = await fulfillCheckout({
      userId: attempt.userId,
      formationIds,
      productIds,
      discountCodeStr: typeof meta.discountCode === "string" && meta.discountCode ? meta.discountCode : null,
      sessionRef: internalRef,
      /**
       * MONTANT RÉELLEMENT ENCAISSÉ. Il ne s'agit pas d'un détail : sans lui,
       * la livraison retombe sur le prix du CATALOGUE. Un lien de paiement à
       * prix libre est alors comptabilisé à son prix « suggéré » — souvent
       * zéro — donc produit livré, vendeur crédité de rien, et un tableau de
       * bord à zéro sans la moindre erreur pour l'expliquer.
       *
       * Il rétablit aussi le garde-fou : la livraison refuse si le montant
       * reçu est inférieur au total recalculé côté serveur.
       *
       * Priorité au montant annoncé par le fournisseur ; à défaut celui de la
       * tentative, calculé par nous à l'initialisation. Jamais une valeur
       * venue du navigateur.
       */
      expectedAmountReceived: montantFournisseur ?? Math.round(attempt.amount),
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

  // ENCAISSÉ SANS RIEN LIVRER. Arrive quand tout le panier était déjà possédé :
  // la livraison n'a alors rien créé — ni achat, ni revenu, ni crédit vendeur —
  // alors que l'argent est bien parti. L'init refuse désormais ce cas en amont,
  // mais si une commande passe quand même par là, elle ne doit surtout pas
  // ressembler à un succès ordinaire : c'est de l'argent sans contrepartie, à
  // rembourser ou à régulariser à la main.
  const rienDeLivre = livraison.enrollments.length === 0 && livraison.purchases.length === 0;
  if (rienDeLivre) {
    console.error("[reconcile-collect] ENCAISSÉ SANS LIVRAISON", {
      internalRef,
      montant: Math.round(attempt.amount),
      deja: livraison.skipped,
    });
  }

  return {
    matched: true,
    status: "success",
    delivered: true,
    attemptId: attempt.id,
    ...(rienDeLivre
      ? { reason: `Encaissé mais rien de nouveau à livrer (déjà possédé : ${livraison.skipped.join(", ") || "?"}) — à régulariser` }
      : {}),
    fulfilled: {
      totalAmount: livraison.totalAmount,
      // Les identifiants livrés, pas ceux demandés : un produit déjà possédé
      // est ignoré par la livraison et ne doit pas gonfler la vente déclarée
      // aux régies.
      formationIds: livraison.enrollments.map((e) => e.id),
      productIds: livraison.purchases.map((p) => p.id),
    },
  };
}

/**
 * Variante par référence, pour les webhooks qui n'ont que ça.
 *
 * `providerRefHint` sert aux fournisseurs dont la référence n'existe qu'APRÈS
 * le paiement — cas de KkiaPay, où l'identifiant de transaction naît dans la
 * fenêtre du navigateur. Si le webhook arrive avant que la page ait eu le
 * temps de nous le transmettre, la tentative est retrouvée par notre propre
 * référence et on enregistre celle du fournisseur au passage. Sans ça, un
 * acheteur qui ferme sa fenêtre juste après avoir payé n'était jamais livré :
 * ni le navigateur ni le cron n'avaient de quoi interroger le fournisseur.
 */
export async function reconcileCollectByRef(
  reference: string,
  providerRefHint?: string,
): Promise<CollectReconcileOutcome> {
  let attempt = await findAttemptByAnyRef(reference);
  if (!attempt && providerRefHint) attempt = await findAttemptByAnyRef(providerRefHint);
  if (!attempt) return { matched: false, status: "unknown", delivered: false };

  if (!attempt.providerRef && providerRefHint) {
    attempt = await prisma.checkoutAttempt
      .update({ where: { id: attempt.id }, data: { providerRef: providerRefHint } })
      .catch(() => attempt);
  }
  return reconcileCollectAttempt(attempt!);
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
