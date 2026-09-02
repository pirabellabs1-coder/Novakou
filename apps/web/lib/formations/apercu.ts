// ─────────────────────────────────────────────────────────────────────────────
// Règle plateforme de l'aperçu gratuit des e-books (PDF).
//
// Décision fondateur : l'aperçu n'est plus un réglage vendeur. Tout produit
// publié qui embarque un PDF montre EXACTEMENT ses 2 premières pages, toujours
// filigranées. Uniformiser protège les deux côtés du marché :
//   — l'acheteur sait d'avance ce qu'il obtient partout sur Novakou ;
//   — le vendeur ne peut plus offrir 20 pages par erreur et se faire piller,
//     ni couper le filigrane alors que la page produit le promet noir sur blanc.
//
// Les colonnes Prisma previewEnabled / previewPages / watermarkEnabled existent
// toujours en base mais AUCUN chemin de code ne les lit plus : c'est ce qui rend
// la règle rétroactive sans toucher une seule ligne de données en production.
// ─────────────────────────────────────────────────────────────────────────────

/** Nombre de pages montrées gratuitement. Ni le vendeur ni l'admin ne le changent. */
export const PAGES_APERCU = 2;

/** Filigrane imprimé en diagonale sur chaque page de l'aperçu. */
export const TEXTE_FILIGRANE = "APERÇU — novakou.com";
