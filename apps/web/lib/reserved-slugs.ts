/**
 * Segments d'URL réservés à la plateforme.
 *
 * Une boutique est servie directement à la racine : `novakou.com/ma-boutique`.
 * Ces segments-là sont donc les SEULS que le middleware ne doit jamais
 * interpréter comme un nom de boutique, sous peine de rendre inaccessible une
 * page réelle du site.
 *
 * ⚠️ EN AJOUTER UN À CHAQUE NOUVELLE ROUTE RACINE. Une route créée sans être
 * inscrite ici resterait joignable (Next.js sert le statique avant le
 * dynamique), mais le middleware la laisserait passer comme publique — donc
 * une page qui devrait exiger une connexion ne la demanderait plus.
 *
 * La liste sert aussi à empêcher un vendeur de réclamer « admin », « wallet »
 * ou « checkout » comme adresse de boutique.
 */
export const RESERVED_ROOT_SLUGS = new Set<string>([
  // Espaces applicatifs
  "admin", "admin-login", "backoffice", "vendeur", "apprenant", "acheteur",
  "affilie", "instructeur", "instructeurs", "mentor", "mentors", "freelances",
  "wallet", "messages", "sessions", "kyc", "panier", "checkout", "payment",
  "payer", "paiement", "abonnement", "certificat", "services", "bundle",
  // Authentification
  "connexion", "inscription", "deconnexion", "mot-de-passe-oublie",
  "reinitialiser-mot-de-passe", "verifier-email", "onboarding", "2fa",
  "invitation",
  // Pages publiques
  "explorer", "produit", "formation", "boutique", "boutiques", "blog",
  "academie", "guides", "nouveautes", "fonctionnalites", "tarifs",
  "a-propos", "contact", "affiliation", "partenaires", "aide", "faq",
  "devenir-vendeur", "documentation-paiements", "confiance-securite",
  "recherche", "categories", "projets", "agences",
  // Mentions légales
  "cgu", "cgv", "cgu-affiliation", "confidentialite", "mentions-legales",
  "cookies",
  // Techniques et raccourcis existants
  "api", "a", "f", "maintenance", "status", "404", "500", "debug-media",
  "_next", "static", "assets", "public", "favicon.ico", "robots.txt",
  "sitemap.xml", "llms.txt", "manifest.json", "sw.js",
  // Réservés pour l'avenir — mieux vaut les bloquer que devoir les reprendre
  // à un vendeur qui les aurait déjà pris.
  "app", "www", "mail", "email", "support", "help", "docs", "dev", "test",
  "compte", "profil", "parametres", "notifications", "nouveau", "new",
]);

/** Vrai si ce segment ne peut pas servir d'adresse de boutique. */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_ROOT_SLUGS.has(slug.trim().toLowerCase());
}
