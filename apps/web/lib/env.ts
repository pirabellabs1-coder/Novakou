// Environment flags — separate from Prisma to avoid triggering heavy module loading
// Import this instead of @/lib/prisma when you only need IS_DEV

export const IS_VERCEL = !!process.env.VERCEL;

// Durcissement sécurité : IS_DEV ne doit JAMAIS être actif dans un
// environnement déployé. De nombreux handlers utilisent `!IS_DEV` pour bypasser
// l'auth ou servir des données mock en local. En gating IS_DEV sur « pas sur
// Vercel ET pas en NODE_ENV=production », ces bypass restent inertes en prod/
// preview même si DEV_MODE=true était positionné par erreur. Vrai uniquement
// sur une machine locale avec DEV_MODE=true.
export const IS_DEV =
  process.env.DEV_MODE === "true" &&
  !process.env.VERCEL &&
  process.env.NODE_ENV !== "production";

/**
 * LE SEUL interrupteur du mode développement — tout le code passe par lui.
 *
 * Vingt fichiers lisaient `process.env.DEV_MODE === "true"` directement. Lors
 * de la migration Vercel du 2026-10-04, DEV_MODE="true" (valeur de
 * `.env.local`) a été recopié en production : la connexion cherchait les
 * comptes dans le magasin JSON de démo (« compte inexistant » pour TOUS les
 * vendeurs), l'envoi de code acheteur renvoyait le code dans la réponse, des
 * routes marketing répondaient sans authentification et les fichiers envoyés
 * partaient sur le disque éphémère au lieu de Supabase. Ici, la variable est
 * IGNORÉE sur Vercel et en production, quelle que soit sa valeur.
 */
export const MODE_DEV_LOCAL = IS_DEV;

/**
 * USE_PRISMA_FOR_DATA — On Vercel, les dev stores en mémoire sont éphémères
 * (perdus entre les invocations serverless). Les APIs de données critiques
 * (services, projets, commandes) doivent utiliser Prisma même si DEV_MODE=true.
 *
 * En local, les dev stores ne servent QUE sans base de données. Dès qu'une
 * DATABASE_URL est configurée, on suit le même chemin qu'en production : les
 * stores en mémoire (héritage FreelanceHigh, `createStore<any>()`) n'ont pas
 * toutes les méthodes que les routes appellent — /api/notifications répondait
 * 500 en local (« getByUser is not a function ») et les vérifications locales
 * ne reflétaient pas la prod.
 */
export const USE_PRISMA_FOR_DATA = IS_VERCEL || !IS_DEV || Boolean(process.env.DATABASE_URL);
