// Liste des catégories proposées au vendeur (création ET édition de produit).
// Partagée entre les deux pages pour qu'elles ne divergent jamais : une
// catégorie ajoutée ici apparaît partout d'un coup.
//
// Ce fichier est volontairement sans dépendance serveur (pas de Prisma) :
// il est importé par des composants client.
export const CATEGORIES_PRODUITS = [
  "Développement Web",
  "Marketing Digital",
  "Design Graphique",
  "Entrepreneuriat",
  "Finance & Comptabilité",
  "Langues & Communication",
  "Photographie & Vidéo",
  "Business & Management",
  "Productivité",
  "Intelligence Artificielle",
  "E-commerce & Dropshipping",
  "Réseaux sociaux & Création de contenu",
  "Crypto & Trading",
  "Immobilier",
  "Agriculture & Élevage",
  "Cuisine & Restauration",
  "Mode, Beauté & Coiffure",
  "Santé & Bien-être",
  "Développement personnel",
  "Éducation & Concours",
  "Religion & Spiritualité",
  "Musique & Audio",
  "Livres & E-books",
  "Modèles & Templates",
  "Logiciels & Outils",
  "Artisanat & Métiers manuels",
  "Droit & Démarches administratives",
];

/**
 * Valeur sentinelle du choix « Autre » : le vendeur écrit alors sa propre
 * catégorie. Le serveur sait déjà l'accueillir — il fait du trouve-ou-crée
 * (getOrCreateCategory) sur n'importe quel libellé — la limite n'a jamais
 * été que dans cette liste figée.
 */
export const CATEGORIE_AUTRE = "__autre__";
