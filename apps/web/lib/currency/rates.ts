/**
 * Affichage des prix dans la devise du visiteur.
 *
 * RÈGLE FONDATRICE — le FCFA est la SEULE devise de vérité.
 *
 * Un produit est enregistré, débité et crédité en FCFA. Les autres devises ne
 * servent qu'à l'AFFICHAGE : elles aident un visiteur guinéen à se représenter
 * un prix, elles ne changent jamais ce que le vendeur reçoit.
 *
 * Cette règle n'est pas un détail d'implémentation. Si un prix pouvait être
 * stocké en GNF, il faudrait un portefeuille par devise, des retraits par
 * devise, et une réconciliation qui compare des montants convertis à des
 * montants d'origine — c'est là que naissent les écarts qu'on ne retrouve
 * jamais. Ici, le vendeur reçoit exactement le prix qu'il a fixé.
 *
 * Le risque de change est donc porté par la plateforme, et c'est un choix
 * assumé : les taux ci-dessous sont RÉVISABLES, et doivent l'être quand une
 * devise dérive.
 */

/** Devise de référence : celle dans laquelle tout est stocké et versé. */
export const DEVISE_REFERENCE = "XOF" as const;

export type CodeDevise = "XOF" | "XAF" | "GNF" | "CDF" | "UGX" | "LRD";

export type Devise = {
  code: CodeDevise;
  /** Ce que le visiteur lit — jamais le code ISO, qui ne parle à personne. */
  symbole: string;
  /** Combien d'unités de CETTE devise vaut 1 FCFA. */
  pourUnFcfa: number;
  /** Arrondi d'affichage : un prix en GNF à l'unité près n'a aucun sens. */
  arrondi: number;
};

/**
 * Taux de référence, exprimés en unités par FCFA.
 *
 * XOF et XAF sont à parité fixe — ce n'est pas une approximation, c'est leur
 * régime de change. Les autres sont des ordres de grandeur à réviser : ils
 * servent à afficher, jamais à décider d'un versement.
 */
export const DEVISES: Record<CodeDevise, Devise> = {
  XOF: { code: "XOF", symbole: "F CFA", pourUnFcfa: 1, arrondi: 1 },
  XAF: { code: "XAF", symbole: "FCFA", pourUnFcfa: 1, arrondi: 1 },
  GNF: { code: "GNF", symbole: "GNF", pourUnFcfa: 14.6, arrondi: 500 },
  CDF: { code: "CDF", symbole: "FC", pourUnFcfa: 4.6, arrondi: 100 },
  UGX: { code: "UGX", symbole: "USh", pourUnFcfa: 6.2, arrondi: 100 },
  LRD: { code: "LRD", symbole: "L$", pourUnFcfa: 0.31, arrondi: 5 },
};

/**
 * Devise d'usage d'un pays, par code ISO-2.
 *
 * Les deux unions monétaires sont listées EN ENTIER — 8 pays pour l'UEMOA,
 * 6 pour la CEMAC. Un pays de la zone franc absent d'ici retomberait sur le
 * FCFA par défaut, donc afficherait juste : c'est précisément ce qui rend
 * l'oubli invisible, et pourquoi la liste doit être complète plutôt que
 * remplie au fur et à mesure des demandes.
 */
const DEVISE_PAR_PAYS: Record<string, CodeDevise> = {
  // UEMOA
  BJ: "XOF", BF: "XOF", CI: "XOF", GW: "XOF", ML: "XOF", NE: "XOF", SN: "XOF", TG: "XOF",
  // CEMAC
  CM: "XAF", CF: "XAF", TD: "XAF", CG: "XAF", GQ: "XAF", GA: "XAF",
  // Hors zone franc
  GN: "GNF", CD: "CDF", UG: "UGX", LR: "LRD",
};

/** Devise à afficher pour ce pays, FCFA par défaut. */
export function deviseDuPays(pays: string | null | undefined): Devise {
  const code = DEVISE_PAR_PAYS[(pays ?? "").trim().toUpperCase()];
  return DEVISES[code ?? DEVISE_REFERENCE];
}

/**
 * Convertit un prix EN FCFA vers la devise d'affichage.
 *
 * On arrondit VERS LE HAUT au pas de la devise : afficher moins que le prix
 * réel ferait découvrir un montant supérieur au moment de payer, ce qui est
 * la meilleure façon de perdre un acheteur au dernier écran.
 */
export function convertirDepuisFcfa(montantFcfa: number, devise: Devise): number {
  if (devise.code === DEVISE_REFERENCE || devise.pourUnFcfa === 1) {
    return Math.round(montantFcfa);
  }
  const brut = montantFcfa * devise.pourUnFcfa;
  return Math.ceil(brut / devise.arrondi) * devise.arrondi;
}

/**
 * Montant à TRANSMETTRE À LA PASSERELLE, dans la devise qu'elle facturera.
 *
 * Distinct de l'affichage sur un point : ici, se tromper coûte de l'argent
 * réel. Nos prix sont stockés en FCFA, mais une passerelle facture dans la
 * devise de l'opérateur. Envoyer 5 000 sur un opérateur guinéen débiterait
 * 5 000 GNF — environ 340 FCFA, quatorze fois moins que le prix affiché — et
 * la vente serait considérée réussie : aucune erreur, aucun log, l'écart sort
 * de la poche de la plateforme à chaque transaction.
 *
 * D'où le refus explicite sur devise inconnue. Retomber sur le montant brut
 * serait exactement le comportement qui a rendu ce défaut invisible.
 *
 * Le calcul est volontairement le MÊME que celui de l'affichage : l'acheteur
 * doit être débité du montant qu'il a lu, au franc près.
 */
export function montantAFacturer(
  montantFcfa: number,
  codeDevise: string | null | undefined,
): { montant: number; devise: CodeDevise } {
  const code = (codeDevise ?? "").trim().toUpperCase();
  const devise = (DEVISES as Record<string, Devise | undefined>)[code];
  if (!devise) {
    throw new Error(
      `Devise d'encaissement inconnue (« ${codeDevise ?? "vide"} ») : ` +
        `impossible de convertir ${montantFcfa} FCFA sans risquer de débiter un montant faux.`,
    );
  }
  if (!Number.isFinite(montantFcfa) || montantFcfa <= 0) {
    throw new Error(`Montant à encaisser invalide : ${montantFcfa}`);
  }
  return { montant: convertirDepuisFcfa(montantFcfa, devise), devise: devise.code };
}

/**
 * Ramène en FCFA un montant annoncé par une passerelle dans SA devise.
 *
 * Indispensable au garde-fou de livraison, qui refuse quand le montant reçu
 * est inférieur au total recalculé. Comparé brut, un paiement libérien de
 * 1 550 LRD passerait pour inférieur à un prix de 5 000 FCFA — et la livraison
 * d'une commande pourtant payée serait refusée. À l'inverse, 73 000 GNF
 * passeraient le contrôle sans rien prouver.
 *
 * On arrondit vers le BAS : la conversion aller arrondit vers le haut, donc
 * le retour doit rester conservateur pour ne pas fabriquer des centimes qui
 * n'ont jamais été payés.
 */
export function montantVersFcfa(montant: number, codeDevise: string | null | undefined): number {
  const code = (codeDevise ?? "").trim().toUpperCase();
  const devise = (DEVISES as Record<string, Devise | undefined>)[code];
  if (!devise || devise.pourUnFcfa === 1) return Math.round(montant);
  return Math.floor(montant / devise.pourUnFcfa);
}

/** Prix prêt à afficher, dans la devise choisie. */
export function formaterPrix(montantFcfa: number, devise: Devise): string {
  const v = convertirDepuisFcfa(montantFcfa, devise);
  return `${new Intl.NumberFormat("fr-FR").format(v)} ${devise.symbole}`;
}

/**
 * Pays proposés au sélecteur.
 *
 * Pas de drapeau ici : Windows ne rend AUCUN emoji drapeau (il affiche les
 * deux lettres du code à la place). Le dessin vient de <CountryFlag>, en SVG,
 * pour un rendu identique partout — un drapeau se repère sans lire.
 */
export const PAYS_AFFICHAGE: Array<{ code: string; nom: string }> = [
  { code: "BJ", nom: "Bénin" },
  { code: "BF", nom: "Burkina Faso" },
  { code: "CI", nom: "Côte d'Ivoire" },
  { code: "GW", nom: "Guinée-Bissau" },
  { code: "ML", nom: "Mali" },
  { code: "NE", nom: "Niger" },
  { code: "SN", nom: "Sénégal" },
  { code: "TG", nom: "Togo" },
  { code: "CM", nom: "Cameroun" },
  { code: "CF", nom: "Centrafrique" },
  { code: "TD", nom: "Tchad" },
  { code: "CG", nom: "Congo" },
  { code: "GQ", nom: "Guinée équatoriale" },
  { code: "GA", nom: "Gabon" },
  { code: "GN", nom: "Guinée" },
  { code: "CD", nom: "RD Congo" },
  { code: "UG", nom: "Ouganda" },
  { code: "LR", nom: "Liberia" },
];
