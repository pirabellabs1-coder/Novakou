/**
 * LES USAGES D'IA DU SITE, ET CE QU'ILS ONT LE DROIT DE COÛTER.
 *
 * Pourquoi une liste fermée
 * -------------------------
 * L'IA tournait dans le NAVIGATEUR (Puter.js) : c'était le compte de
 * l'utilisateur qui payait. En basculant sur OpenRouter, c'est Novakou qui
 * paie chaque génération. Si le navigateur pouvait choisir librement son
 * modèle et sa longueur de réponse, n'importe qui pourrait demander le modèle
 * le plus cher en boucle — la facture est alors sans plafond.
 *
 * Le navigateur n'envoie donc QUE l'usage et le texte. Le modèle, la longueur
 * maximale et la température sont décidés ici, côté serveur.
 */

export type Usage =
  | "support"     // widget d'aide public
  | "recherche"   // reformulation d'une recherche acheteur
  | "studio"      // génération de contenu vendeur
  | "tunnel"      // génération d'un tunnel de vente
  | "copilote"    // assistant admin
  | "agent"       // chat d'agent (vendeur)
  | "redaction";  // aide à la rédaction dans l'éditeur

export type ReglesUsage = {
  /** Modèle imposé. Vide = modèle par défaut du compte. */
  modele?: string;
  maxTokens: number;
  temperature: number;
  /** Un visiteur non connecté peut-il s'en servir ? */
  publiquement: boolean;
  /** Appels par jour et par personne (ou par adresse si non connecté). */
  parJour: number;
};

export const USAGES: Record<Usage, ReglesUsage> = {
  // Public : court, fréquent, et volontairement bon marché — c'est la porte
  // ouverte sur notre crédit, elle doit être la plus étroite.
  support: { maxTokens: 500, temperature: 0.5, publiquement: true, parJour: 30 },
  recherche: { maxTokens: 60, temperature: 0.2, publiquement: true, parJour: 40 },

  // Réservé aux comptes : plus long, donc plus cher.
  studio: { maxTokens: 4000, temperature: 0.7, publiquement: false, parJour: 60 },
  tunnel: { maxTokens: 6000, temperature: 0.7, publiquement: false, parJour: 20 },
  agent: { maxTokens: 2000, temperature: 0.5, publiquement: false, parJour: 80 },
  redaction: { maxTokens: 1500, temperature: 0.6, publiquement: false, parJour: 80 },

  // Admin : le plus permissif, mais pas illimité — une boucle dans un écran
  // interne coûte aussi cher qu'une boucle dans un écran public.
  copilote: { maxTokens: 4000, temperature: 0.3, publiquement: false, parJour: 300 },
};

export function estUnUsage(v: unknown): v is Usage {
  return typeof v === "string" && v in USAGES;
}

/**
 * PLAFOND GLOBAL du site, tous usages et toutes personnes confondus.
 *
 * Les quotas individuels bornent un abus isolé ; celui-ci borne la facture.
 * Sans lui, mille comptes à trente appels font trente mille appels, et la
 * découverte se ferait sur le relevé.
 */
export const PLAFOND_QUOTIDIEN_SITE = Number(process.env.AI_PLAFOND_QUOTIDIEN || 3000);
