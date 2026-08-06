// Orchestrateur de PAYOUT avec bascule automatique de fournisseur.
//
// Ordre de bascule : FedaPay → FeexPay.
// On tente chaque fournisseur configuré ET capable de servir l'opérateur du
// bénéficiaire. Si l'un REFUSE (solde insuffisant, IP non autorisée, validation),
// on rejoue le même versement chez le suivant. Aucun argent ne circule entre
// fournisseurs : c'est juste un ré-essai du versement ailleurs.
//
// ── SÛRETÉ MONÉTAIRE (le point le plus important) ──
// On ne bascule QUE sur un refus AVANT tout mouvement d'argent :
//   insufficient_funds / not_available / validation  → le fournisseur a dit non,
//   rien n'a bougé → on peut réessayer ailleurs sans risque.
// Sur une erreur AMBIGUË (réseau, timeout, 5xx, inconnue) on NE bascule PAS et
// on N'ÉCHOUE PAS : on s'arrête et on renvoie "ambiguous" pour que l'admin
// vérifie manuellement — car le versement a PEUT-ÊTRE été pris en compte, et
// rejouer ailleurs risquerait un DOUBLE paiement.
//
// Idempotence : dans un seul appel, on s'arrête au 1er fournisseur qui accepte
// (renvoie une référence). L'identifiant de retrait interne sert de clé
// l'id du retrait, ce qui protège les ré-essais du MÊME fournisseur.

import { routeFor } from "@/lib/payments/registry";
import {
  initPayout as feexpayInit, isFeexpayConfigured, classifyFeexpayError, normalizeFeexpayStatus,
} from "@/lib/feexpay";
import {
  initPayout as fedapayInit, isFedapayConfigured, classifyFedapayError, normalizeFedapayStatus,
} from "@/lib/fedapay";
import { getPayoutMapping, baseMethodCode } from "@/lib/payout/methods-map";

export type PayoutProviderId = "feexpay" | "fedapay" | "pawapay" | "monetbil";

/** Ordre de tentative : le premier configuré ET capable emporte le versement. */
/**
 * Ordre d'essai des passerelles de VERSEMENT — décision fondateur du
 * 2026-08-04 : FedaPay d'abord, FeexPay en secours.
 *
 * Ne pas confondre avec l'ordre d'ENCAISSEMENT, qui se décide par pays et par
 * opérateur : ici, les deux passerelles servent les mêmes réseaux, c'est donc
 * la fiabilité constatée qui tranche.
 */
// PawaPay en DERNIER : aucun versement reel ne l'a encore eprouve. Il ne prend
// donc la main que la ou les deux autres ne savent pas faire — c'est-a-dire
// partout hors zone franc, ou il est de toute facon le seul.
const PROVIDER_ORDER: PayoutProviderId[] = ["fedapay", "feexpay", "pawapay", "monetbil"];

export type PayoutExecutionInput = {
  /** Code opérateur interne (le suffixe _mentor est toléré). */
  method: string;
  amount: number;
  /** Numéro normalisé, chiffres + indicatif pays, SANS "+" (ex "2290166000000"). */
  msisdn: string;
  customer: { email: string; firstName: string; lastName: string };
  description: string;
  /** Id du retrait interne — sert d'idempotence et de référence webhook. */
  withdrawalId: string;
  /**
   * Test / diagnostic admin : forcer UN fournisseur précis, SANS bascule.
   * Permet à l'admin de router délibérément un versement de test à travers
   * FeexPay ou FedaPay sans laisser l'ordre de bascule décider.
   * En usage normal : laisser vide → ordre + bascule standard.
   */
  forceProvider?: PayoutProviderId;
};

/**
 * Ce qu'une passerelle doit savoir faire pour entrer dans le pipeline.
 *
 * Tout est ici : ajouter KkiaPay ou e-Pay Financial revient à écrire un
 * adaptateur et à le nommer dans l'ordre — sans rouvrir la boucle ci-dessous,
 * qui porte les règles de sûreté monétaire. C'est précisément ce code-là qu'on
 * ne veut PAS toucher à chaque nouvelle intégration.
 */
type AdaptateurVersement = {
  /** Clés présentes ? Sinon la passerelle est sautée, sans être appelée. */
  configure: () => Promise<boolean>;
  /**
   * Route confirmée pour cet opérateur, ou null. On n'invente JAMAIS un
   * endpoint de versement : sans route déclarée, la passerelle est sautée.
   */
  route: (m: NonNullable<ReturnType<typeof getPayoutMapping>>) => unknown;
  /** Envoie le versement et rend la référence du fournisseur. */
  envoyer: (
    ctx: { input: PayoutExecutionInput; route: never; currency: string; motif: string },
  ) => Promise<{ ref: string; statut: "success" | "pending" | "failed"; brut: string }>;
  /** Traduit une erreur en catégorie — c'est elle qui autorise ou non la bascule. */
  classer: (msg: string, err?: unknown) => { category: string; userMessage: string };
  /** Nom lisible, pour l'admin uniquement. */
  libelle: string;
};

export type PayoutAttempt = {
  provider: PayoutProviderId;
  outcome: "accepted" | "rejected" | "skipped" | "ambiguous";
  category?: string;
  detail?: string;
};

const ADAPTATEURS: Record<PayoutProviderId, AdaptateurVersement> = {
  fedapay: {
    libelle: "FedaPay",
    configure: isFedapayConfigured,
    route: (m) => m.fedapay ?? null,
    classer: classifyFedapayError,
    envoyer: async ({ input, route, currency, motif }) => {
      const r = await fedapayInit({
        amount: input.amount,
        currencyIso: currency,
        mode: (route as { mode: string }).mode,
        phoneNumber: `+${input.msisdn}`,
        countryIso: (route as { country?: string }).country ?? "",
        customer: {
          firstname: input.customer.firstName,
          lastname: input.customer.lastName,
          email: input.customer.email,
        },
        description: motif,
        merchantReference: input.withdrawalId,
      });
      return { ref: String(r.id), statut: normalizeFedapayStatus(r.status), brut: String(r.status) };
    },
  },
  monetbil: {
    libelle: "Monetbil",
    // SE REFUSE TANT QUE L'ADRESSE EST INCONNUE, et c'est deliberé. Monetbil
    // couvrirait la Guinee, le Liberia, le Gabon, le Cameroun et la RD Congo -
    // les pays qui n'ont aujourd'hui aucun chemin de retrait. Mais onze
    // variantes d'endpoint testees repondent 404 : on n'invente pas une adresse
    // qui deplace de l'argent.
    //
    // Le declarer « pret » ferait pire que rien : la verification de couverture
    // annoncerait ces pays servis, et le trou deviendrait invisible - alors que
    // c'est justement lui qu'il faut garder sous les yeux.
    //
    // POSER MONETBIL_PAYOUT_URL SUFFIRA a l'activer, sans autre changement.
    configure: async () => Boolean(process.env.MONETBIL_PAYOUT_URL?.trim()),
    route: (m) => {
      const code = (m as { code?: string }).code;
      if (!code) return null;
      const r = routeFor(code, "monetbil", "payout");
      return r ? { operateur: r.code, code } : null;
    },
    classer: (msg: string) => ({
      category: "provider_failed" as const,
      userMessage: `Monetbil : ${msg}`,
    }),
    envoyer: async () => {
      // Inatteignable tant que configure() renvoie faux. Presente pour que
      // l'activation soit une ligne le jour ou l'adresse arrive.
      throw new Error("Adresse de versement Monetbil non communiquee.");
    },
  },
  pawapay: {
    libelle: "PawaPay",
    configure: async () => (await import("@/lib/pawapay")).isPawapayConfigured(),
    // La route vient du REGISTRE, pas de la table des methodes : dupliquer les
    // codes dans deux tables les ferait diverger, et l'ecart se paierait en
    // virements partis sur le mauvais reseau.
    route: (m) => {
      const code = (m as { code?: string }).code;
      if (!code) return null;
      const r = routeFor(code, "pawapay", "payout");
      return r ? { provider: r.code, code } : null;
    },
    classer: (msg: string) => ({
      category: "provider_failed" as const,
      userMessage: `PawaPay : ${msg}`,
    }),
    envoyer: async ({ input, route, motif }) => {
      const { provider, code } = route as { provider: string; code: string };
      const { initPayout } = await import("@/lib/pawapay");
      // MEME conversion qu'a l'encaissement. L'enjeu est plus grand ici :
      // envoyer un montant FCFA brut a un vendeur ougandais lui verserait
      // 5 000 UGX au lieu de ~32 000, avec un virement marque reussi.
      const { montantAFacturer } = await import("@/lib/currency/rates");
      const { chargerTaux } = await import("@/lib/currency/taux-store");
      await chargerTaux();
      const { currencyForOperator } = await import("@/lib/payments/registry");
      const aVerser = montantAFacturer(Math.round(input.amount), currencyForOperator(code));
      const r = await initPayout({
        provider,
        amount: aVerser.montant,
        currency: aVerser.devise,
        phoneNumber: input.msisdn.replace(/\D/g, ""),
        payoutRef: input.withdrawalId,
        customerMessage: motif.slice(0, 22),
      });
      if (!r.accepted) throw new Error(r.reason ?? "versement refuse");
      // PawaPay accepte puis confirme par rappel : « pending » est le bon etat.
      return { ref: r.reference, statut: "pending" as const, brut: "ACCEPTED" };
    },
  },
  feexpay: {
    libelle: "FeexPay",
    configure: isFeexpayConfigured,
    route: (m) => m.feexpay ?? null,
    classer: classifyFeexpayError,
    envoyer: async ({ input, route, motif }) => {
      const r = await feexpayInit({
        endpoint: (route as { endpoint: string }).endpoint,
        network: (route as { network: string }).network,
        phoneNumber: input.msisdn,
        amount: input.amount,
        motif,
        callbackInfo: input.withdrawalId,
        email: input.customer.email,
      });
      return { ref: String(r.reference), statut: normalizeFeexpayStatus(r.status), brut: String(r.status) };
    },
  },
};

export type PayoutExecutionResult =
  | {
      ok: true;
      provider: PayoutProviderId;
      providerRef: string;
      /** "pending" = accepté, en cours (le webhook confirmera) ; "success" = déjà confirmé. */
      status: "pending" | "success";
      attempts: PayoutAttempt[];
    }
  | {
      ok: false;
      /**
       * rejected    : tous les fournisseurs ont refusé (rien n'a bougé) → REFUSE.
       * ambiguous   : arrêt de sûreté sur erreur non concluante → garder EN_ATTENTE
       *               et VÉRIFIER MANUELLEMENT (un versement a peut-être été pris).
       * no_provider : aucun fournisseur configuré ET capable pour cet opérateur.
       */
      terminal: "rejected" | "ambiguous" | "no_provider";
      userMessage: string;
      attempts: PayoutAttempt[];
    };

// Une catégorie d'erreur est-elle « sûre » pour basculer (aucun argent déplacé) ?
function isSafeToFallback(category: string): boolean {
  return (
    category === "insufficient_funds" ||
    category === "not_available" ||
    category === "validation" ||
    // Connexion jamais établie : rien n'a pu partir chez ce fournisseur, donc
    // en essayer un autre ne peut pas produire de double paiement. Sans ce cas,
    // une simple panne de proxy bloquait le retrait alors qu'une deuxième
    // passerelle savait le servir.
    category === "never_sent"
  );
}

/**
 * Exécute un versement en essayant les fournisseurs dans l'ordre, avec bascule
 * sur refus. Ne déclenche jamais deux versements dans un même appel.
 */
export async function executePayout(input: PayoutExecutionInput): Promise<PayoutExecutionResult> {
  const method = baseMethodCode(input.method);
  const mapping = getPayoutMapping(method);
  const attempts: PayoutAttempt[] = [];
  // Devise : depuis la table ; défaut XOF (tous les opérateurs actuels sauf CM=XAF).
  const currency = mapping?.currency ?? "XOF";
  const motif = input.description || "Retrait Novakou";
  let lastRejectionMsg: string | null = null;

  // Forçage de test : un seul fournisseur, aucune bascule. Sinon ordre standard.
  const order = input.forceProvider ? [input.forceProvider] : PROVIDER_ORDER;

  for (const provider of order) {
    const adaptateur = ADAPTATEURS[provider];
    if (!adaptateur) {
      attempts.push({ provider, outcome: "skipped", detail: "passerelle inconnue" });
      continue;
    }

    // 1) Configurée ? Sans clés, on ne l'appelle même pas.
    if (!(await adaptateur.configure())) {
      attempts.push({ provider, outcome: "skipped", detail: "non configurée" });
      continue;
    }

    // 2) Capable de servir CET opérateur ? Le registre seul en décide : sans
    //    route confirmée, on saute — on n'invente jamais un endpoint. C'est ce
    //    qui envoie directement un opérateur au fournisseur qui le sert.
    // On transmet TOUJOURS le code interne de l'operateur, meme sans entree
    // dans la table des methodes. Sans ca, PawaPay etait saute pour les neuf
    // pays hors zone franc : ils n'ont aucune entree dans cette table, qui n'a
    // jamais servi qu'a FedaPay et FeexPay. Les deux autres continuent de
    // renvoyer null quand leur cle manque — leur comportement ne change pas.
    const route = adaptateur.route({ ...(mapping ?? {}), code: method } as never);
    if (!route) {
      attempts.push({ provider, outcome: "skipped", detail: "opérateur non servi par cette passerelle" });
      continue;
    }

    // 3) Tentative.
    try {
      const r = await adaptateur.envoyer({
        input,
        route: route as never,
        currency,
        motif,
      });
      if (r.statut === "failed") {
        attempts.push({ provider, outcome: "rejected", category: "provider_failed", detail: `statut ${r.brut}` });
        lastRejectionMsg = `${adaptateur.libelle} a refusé le versement.`;
        continue;
      }
      attempts.push({ provider, outcome: "accepted", detail: `réf ${r.ref}` });
      return { ok: true, provider, providerRef: r.ref, status: r.statut, attempts };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const { category, userMessage } = ADAPTATEURS[provider].classer(msg, err);

      if (isSafeToFallback(category)) {
        // Refus propre (rien n'a bougé) → on note et on tente le suivant.
        attempts.push({ provider, outcome: "rejected", category, detail: msg.slice(0, 300) });
        lastRejectionMsg = userMessage;
        continue;
      }

      // Erreur AMBIGUË → arrêt de sûreté. On NE tente pas un autre fournisseur
      // (risque de double paiement). L'admin doit vérifier.
      attempts.push({ provider, outcome: "ambiguous", category, detail: msg.slice(0, 300) });
      return {
        ok: false,
        terminal: "ambiguous",
        userMessage:
          `${userMessage} — versement NON confirmé chez ${provider}. ` +
          `Par sécurité, aucun autre fournisseur n'a été tenté (risque de double paiement). ` +
          `Vérifiez le tableau de bord ${provider} avant de relancer.`,
        attempts,
      };
    }
  }

  // Aucun fournisseur n'a accepté.
  const anyRejected = attempts.some((a) => a.outcome === "rejected");
  if (anyRejected) {
    return { ok: false, terminal: "rejected", userMessage: lastRejectionMsg ?? "Tous les fournisseurs ont refusé le versement.", attempts };
  }
  return {
    ok: false,
    terminal: "no_provider",
    userMessage: "Aucun fournisseur de paiement n'est configuré et capable de servir cet opérateur.",
    attempts,
  };
}
