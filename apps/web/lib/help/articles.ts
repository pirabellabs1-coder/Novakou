/**
 * Novakou — Bibliothèque d'articles du centre d'aide.
 * Stockée en TypeScript (pas de CMS) pour faciliter la maintenance, la
 * recherche full-text en mémoire et le SEO (rendu server-side).
 *
 * Convention : un article = un objet { slug, title, excerpt, category, body }.
 * Le `body` est du Markdown simplifié (h2, h3, listes, liens, code, notes).
 */

export type ArticleCategorySlug =
  | "demarrer"
  | "vendre"
  | "mentorat"
  | "apprenant"
  | "paiements"
  | "marketing"
  | "boutique"
  | "securite"
  | "problemes";

export interface ArticleCategory {
  slug: ArticleCategorySlug;
  title: string;
  icon: string;
  description: string;
  color: string; // tailwind-compatible hex for accents
}

export interface Article {
  slug: string;
  category: ArticleCategorySlug;
  title: string;
  excerpt: string;
  readingMin: number; // estimated reading time
  lastUpdated: string; // ISO date
  body: string; // simplified Markdown
  tags?: string[];
}

export const CATEGORIES: ArticleCategory[] = [
  {
    slug: "demarrer",
    title: "Démarrer sur Novakou",
    icon: "rocket_launch",
    description: "Créer votre compte, vérifier votre identité, choisir votre rôle.",
    color: "#006e2f",
  },
  {
    slug: "vendre",
    title: "Vendre vos formations & produits",
    icon: "storefront",
    description: "Publier une formation, un e-book, un template, gérer votre catalogue.",
    color: "#0ea5e9",
  },
  {
    slug: "mentorat",
    title: "Être mentor",
    icon: "support_agent",
    description: "Proposer des séances, packs, abonnements et gérer votre calendrier.",
    color: "#a855f7",
  },
  {
    slug: "apprenant",
    title: "Acheter & apprendre",
    icon: "school",
    description: "Acheter une formation, réserver un mentor, suivre votre progression.",
    color: "#f59e0b",
  },
  {
    slug: "paiements",
    title: "Paiements & retraits",
    icon: "account_balance_wallet",
    description: "Méthodes Mobile Money, cartes, virements, retraits, délais et commissions.",
    color: "#10b981",
  },
  {
    slug: "marketing",
    title: "Marketing & croissance",
    icon: "campaign",
    description: "Codes promo, affiliation, bundles, funnels, retargeting panier.",
    color: "#f97316",
  },
  {
    slug: "boutique",
    title: "Votre boutique publique",
    icon: "store",
    description: "Personnaliser votre boutique, connecter votre domaine, thèmes, multi-shops.",
    color: "#ec4899",
  },
  {
    slug: "securite",
    title: "Sécurité & vie privée",
    icon: "shield",
    description: "2FA, cookies, RGPD, suppression de compte, sessions actives.",
    color: "#6366f1",
  },
  {
    slug: "problemes",
    title: "Résoudre un problème",
    icon: "build",
    description: "Paiement échoué, erreur de connexion, mot de passe oublié, bugs fréquents.",
    color: "#ef4444",
  },
];

export const ARTICLES: Article[] = [
  // ─────────────────────────────────────────────────────────────────────
  // DÉMARRER
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "creer-un-compte",
    category: "demarrer",
    title: "Créer votre compte Novakou en 3 minutes",
    excerpt: "Inscription avec email + mot de passe ou connexion Google. Vérification email obligatoire.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["inscription", "compte", "email", "google"],
    body: `
## 1. Ouvrez la page d'inscription
Rendez-vous sur **https://novakou.com/inscription**.

## 2. Choisissez votre rôle principal
Dès l'inscription, vous choisissez ce qui vous correspond :
- **Apprenant** — je veux acheter des formations, trouver un mentor
- **Vendeur / créateur** — je veux vendre mes formations et produits digitaux
- **Mentor** — je veux coacher des apprenants en visio

> Vous pouvez changer ou combiner ces rôles plus tard.

## 3. Remplissez vos informations
- **Prénom + Nom** complet (utilisé pour vos factures et certificats)
- **Email** — un email valide, vous recevrez un code de vérification à 6 chiffres
- **Mot de passe** — 8 caractères minimum, avec au moins 1 majuscule et 1 chiffre

### Ou connectez-vous avec Google
Un clic sur « Continuer avec Google » — plus rapide et plus sûr. Votre email Google est automatiquement vérifié.

## 4. Vérifiez votre email
Un code à 6 chiffres vous est envoyé **immédiatement**. Saisissez-le sur la page \`/verifier-email\` pour activer votre compte.

- Pas reçu ? Vérifiez **spams / indésirables**.
- Cliquez sur « Renvoyer le code » si rien après 2 minutes.

## 5. Complétez votre profil
Au premier login, ajoutez :
- Photo de profil (recommandé pour inspirer confiance)
- Pays de résidence
- Numéro de téléphone (pour le 2FA et les alertes sécurité)

Voilà, votre compte est prêt !
`,
  },
  {
    slug: "verification-kyc",
    category: "demarrer",
    title: "Vérifier votre identité (KYC) en 4 niveaux",
    excerpt: "Les niveaux de vérification débloquent des fonctionnalités : retraits, publication, Elite.",
    readingMin: 5,
    lastUpdated: "2026-04-18",
    tags: ["kyc", "identité", "verification"],
    body: `
Novakou utilise un système de vérification progressif en **4 niveaux**.

## Niveau 1 — Email vérifié
✓ Actif dès que vous validez le code à 6 chiffres par email.
- **Débloque** : accès à l'explorateur, ajout au panier.

## Niveau 2 — Téléphone + 2FA
- Ajoutez votre numéro de téléphone dans \`/parametres\`.
- Activez l'authentification à 2 facteurs (voir article dédié).
- **Débloque** : envoyer des offres personnalisées, commander.

## Niveau 3 — Pièce d'identité
- Allez sur \`/kyc\`.
- Téléversez **une pièce d'identité** (CNI, passeport, permis).
- Téléversez **un selfie** avec votre pièce à côté de votre visage.
- Délai de validation : **24-48 heures ouvrées**.
- **Débloque** : retirer vos fonds, publier vos produits (vendeurs), proposer des séances (mentors).

## Niveau 4 — Vérification professionnelle
- Documents complémentaires : RCCM, attestation fiscale, preuve d'activité.
- **Débloque** : badge Elite visible sur votre profil public, limites de retrait relevées.

> ⚠️ Les documents sont stockés **chiffrés** et ne sont accessibles qu'aux agents KYC Novakou. Ils ne sont jamais transmis à des tiers.
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // VENDRE
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "creer-formation",
    category: "vendre",
    title: "Publier votre première formation vidéo",
    excerpt: "De la création du cours à la publication, en passant par l'upload vidéo et le prix.",
    readingMin: 8,
    lastUpdated: "2026-04-18",
    tags: ["formation", "vendre", "cours", "video"],
    body: `
## Prérequis
- KYC niveau 3 validé (pièce d'identité)
- Boutique créée (\`/vendeur/boutiques\`)
- Contenu vidéo prêt (MP4 ou MOV, max 4 Go par leçon)

## 1. Créer la formation
Allez sur \`/vendeur/produits/creer\` → choisissez **Formation vidéo**.

### Informations générales
- **Titre** (maximum 100 caractères, accrocheur, avec mots-clés SEO)
- **Description courte** (1-2 phrases, affichée dans l'explorateur)
- **Description complète** (2000 caractères recommandés, marketing)
- **Catégorie + tags**
- **Niveau** : Débutant / Intermédiaire / Avancé
- **Durée totale estimée**

### Miniature & cover
- Miniature 1280×720px (JPG/PNG, max 500 Ko)
- Teaser vidéo 30-60s optionnel

## 2. Structurer en sections et leçons
L'éditeur \`/vendeur/cours/[id]/editer\` vous permet de :
- Créer plusieurs **sections** (Module 1, Module 2…)
- Ajouter des **leçons vidéo** à chaque section
- Joindre des **PDF, templates, fichiers bonus**
- Définir des **leçons gratuites (preview)** pour convertir les indécis

## 3. Fixer le prix
- **Prix unique** en FCFA (ou équivalent EUR si client européen)
- **Gratuit** pour lead magnet / essai
- **Flash promotion** : prix barré + promo temporaire (voir article Marketing)

## 4. Publier
- Cliquez « Publier »
- La formation passe en **revue modération** (24h max)
- Une fois approuvée, elle apparaît dans l'explorateur public

> 💡 **Astuce** : activez « Générer un quiz final » pour que vos apprenants obtiennent un **certificat** — doublé taux de complétion en moyenne.
`,
  },
  {
    slug: "creer-produit-digital",
    category: "vendre",
    title: "Vendre un e-book, template ou pack digital",
    excerpt: "Produits digitaux livrés instantanément après paiement. Parfait pour vendre en passif.",
    readingMin: 5,
    lastUpdated: "2026-04-18",
    tags: ["produit", "ebook", "template", "digital"],
    body: `
## Qu'est-ce qu'un produit digital ?
Un fichier (ou pack de fichiers) qui est **téléchargé instantanément** après paiement, sans intervention de votre part. Exemples :
- E-books (PDF, EPUB)
- Templates Notion, Canva, Figma
- Packs d'images, musiques, vidéos stock
- Scripts, code, fichiers Excel

## 1. Créer le produit
\`/vendeur/produits/creer\` → **Produit digital**.

## 2. Uploader le fichier
- Formats acceptés : PDF, ZIP, EPUB, DOCX, XLSX, MP3, MP4, PNG, JPG…
- **Taille max** : 2 Go par fichier (au-delà, utilisez un lien Drive)
- Pour un **pack** : créez un ZIP contenant tous les fichiers
- Ajoutez plusieurs versions si besoin (ex. français + anglais)

## 3. Informations marketing
- **Bannière produit** (1200×628px recommandé)
- **Aperçu du contenu** (3-5 captures, important pour la conversion)
- **Tableau des fonctionnalités** ou **page de vente** (optionnel)

## 4. Prix et livraison
- Prix en FCFA
- Livraison : le fichier est envoyé par **email + téléchargement direct** dans l'espace apprenant après achat

## 5. Publier
Même flow que la formation.

> 💡 **Astuce** : si votre pack inclut 2-3 fichiers complémentaires, vendez-les en **bundle** pour augmenter le panier moyen (voir article Bundles).
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // MENTORAT
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "devenir-mentor",
    category: "mentorat",
    title: "Devenir mentor sur Novakou",
    excerpt: "Profil, tarif, disponibilités, visio automatique. Tout ce qu'il faut pour démarrer.",
    readingMin: 6,
    lastUpdated: "2026-04-18",
    tags: ["mentor", "coaching", "seance"],
    body: `
## 1. Passer en rôle Mentor
Dans \`/parametres\` → onglet **Compte** → "Devenir mentor". Si c'est la première fois, un court formulaire vous demande :
- Spécialité (ex. Marketing digital, Développement, Design…)
- Domaine (tag principal)
- Bio (2-3 paragraphes inspirants)
- Années d'expérience
- Langues parlées

KYC niveau 3 requis.

## 2. Configurer vos séances
Dans \`/mentor/profil\` :
- **Prix par séance** (défaut 25 000 FCFA, à adapter)
- **Durée par défaut** (60 min recommandé)
- **Buffer entre séances** (15 min pour souffler)
- **Délai minimum de réservation** (60 min avant, évite les réservations de dernière minute)

## 3. Définir votre disponibilité
\`/mentor/calendrier\` — deux options :
- **Récurrence hebdomadaire** : ex. Lundi 10h-12h + 14h-17h, Mercredi 9h-11h
- **Slots ponctuels** : dates spécifiques pour cette semaine / ce mois

## 4. Activer la séance découverte gratuite
15 min gratuites en premier contact — **+15% de conversion** constaté.
Allez dans \`/mentor/profil\` → activer le toggle « Séance découverte ».

## 5. Créer un questionnaire pré-séance
Dans le même panneau, ajoutez 3-5 questions que l'apprenant doit remplir au moment de la réservation.
Exemples :
- « Quel est votre objectif principal ? »
- « Qu'avez-vous déjà essayé ? »
- « Sur quoi voulez-vous travailler en priorité ? »

## 6. Recevoir des réservations
- Votre profil public est visible sur \`/mentors/[votre-id]\`
- Les apprenants réservent un créneau → paient → vous recevez notification email + in-app
- **Visio Jitsi** générée automatiquement, lien dans le booking

## 7. Packs et abonnements
Pour fidéliser : créez des packs (3/5/10 séances) dans \`/mentor/packs\` à prix dégressif.

## 8. Après la séance
- Confirmer la présence (contrôle anti-no-show)
- Partager des ressources complémentaires depuis \`/mentor/ressources\`
- Noter l'apprenant dans vos notes privées (CRM)
`,
  },
  {
    slug: "gerer-calendrier-mentor",
    category: "mentorat",
    title: "Gérer votre calendrier et vos disponibilités",
    excerpt: "Bloquer un créneau, partir en vacances, ajuster les fuseaux horaires.",
    readingMin: 4,
    lastUpdated: "2026-04-18",
    tags: ["calendrier", "disponibilite", "mentor"],
    body: `
## Vue calendrier
\`/mentor/calendrier\` affiche votre semaine glissante avec :
- 🟢 Créneaux disponibles à la réservation
- 🟡 Créneaux réservés (nom de l'apprenant visible)
- ⚫ Créneaux bloqués (pause, autre engagement)

## Mode vacances
Pour mettre tout en pause sans supprimer vos disponibilités :
- \`/mentor/profil\` → toggle « Disponible pour nouvelles réservations »
- Désactivé = plus aucun créneau visible côté public
- Vos séances déjà réservées sont conservées

## Bloquer un créneau spécifique
Dans le calendrier, cliquez sur un slot libre → **Bloquer**.
Utile pour : rendez-vous médical, journée fériée, pause déjeuner…

## Fuseau horaire
Configuré par défaut sur **Africa/Abidjan (GMT+0)**.
À changer dans \`/mentor/profil\` si vous êtes ailleurs (Europe, Canada, etc.).
Les apprenants voient toujours les créneaux dans **leur fuseau**, c'est Novakou qui gère la conversion.

## Rappels automatiques
Les apprenants reçoivent automatiquement :
- **H-24** : rappel par email avec le lien Jitsi
- **H-15 min** : rappel "ça commence bientôt"

Vous recevez le même rappel pour ne pas oublier.
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // APPRENANT
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "acheter-formation",
    category: "apprenant",
    title: "Acheter une formation : de l'ajout au panier au premier cours",
    excerpt: "Le parcours complet de l'apprenant en 5 étapes.",
    readingMin: 4,
    lastUpdated: "2026-04-18",
    tags: ["acheter", "formation", "checkout"],
    body: `
## 1. Parcourir le catalogue
\`/explorer\` pour le catalogue complet, avec filtres par catégorie, prix, note, langue.

## 2. Consulter la fiche
Cliquez sur une formation pour voir :
- Bande-annonce (si disponible)
- Programme détaillé (sections, leçons, durée)
- Bio de l'instructeur
- Avis et notes
- Preview de quelques leçons gratuites

## 3. Ajouter au panier (ou Acheter maintenant)
- **Ajouter au panier** : vous pouvez continuer à explorer, le panier est visible en haut à droite de toutes les pages
- **Acheter maintenant** : raccourci direct vers le checkout

Vous pouvez ajouter au panier **sans être connecté** — votre panier est conservé grâce à un cookie.

## 4. Payer
- **Mobile Money** (Orange Money, Wave, MTN MoMo, Moov) — instantané
- **Carte Visa / Mastercard** — international
- **PayPal** (sur demande auprès du vendeur)

Le paiement est **sécurisé SSL** et votre argent est **bloqué en séquestre** 24h (garantie qualité).

## 5. Accéder au cours
Immédiatement après paiement :
- Redirection automatique vers \`/formation/[slug]\`
- La formation apparaît dans \`/apprenant/mes-formations\`
- Email de confirmation avec le lien direct

## Progression & certificat
- Marquage automatique des leçons terminées
- **Quiz final** si l'instructeur en a configuré un
- **Certificat PDF** téléchargeable dès que vous avez complété 100% + validé le quiz (si applicable)

## Garantie 14 jours
Satisfait ou remboursé dans les 14 jours suivant l'achat, sans justification requise. Il suffit de demander depuis \`/apprenant/commandes\`.
`,
  },
  {
    slug: "reserver-mentor",
    category: "apprenant",
    title: "Réserver une séance avec un mentor",
    excerpt: "Trouver le bon mentor, réserver, préparer la séance.",
    readingMin: 4,
    lastUpdated: "2026-04-18",
    tags: ["mentor", "reservation", "visio"],
    body: `
## 1. Trouver votre mentor
\`/mentors\` — liste filtrable par :
- Spécialité (Marketing, Dev, Design, Business…)
- Langues parlées
- Fourchette de prix
- Note moyenne

## 2. Profil public
Sur chaque fiche mentor :
- Bio et spécialités
- Prix par séance
- Durée standard
- Avis d'anciens apprenants
- **Séance découverte gratuite** si proposée (15 min pour voir si le feeling passe)

## 3. Choisir un créneau
Le mentor affiche ses disponibilités des 2 prochaines semaines. Cliquez sur le créneau qui vous convient.

## 4. Remplir le questionnaire pré-séance
Si le mentor en a configuré un, quelques questions :
- Vos objectifs pour la séance
- Votre contexte / niveau
- Ce que vous avez déjà essayé

Ça lui permet d'arriver préparé — **vous profitez mieux de la séance**.

## 5. Payer la séance
Mêmes méthodes que pour les formations. Fonds bloqués en séquestre, libérés au mentor **après la séance** si vous confirmez sa présence.

## 6. Jour J — se connecter
- Email de rappel **H-24** avec le lien Jitsi
- Second rappel **H-15 min** pour vous prévenir juste avant
- Le lien de la salle est aussi dans \`/apprenant/sessions\`

## 7. Après la séance
- Vous notez le mentor (1-5 étoiles + avis)
- Le mentor peut vous partager des ressources (PDF, vidéo, templates)
- Si vous voulez continuer, le mentor peut vous proposer un **pack** à prix dégressif

## No-show ?
- Si **vous** ratez : les fonds sont quand même versés au mentor (politique anti-abus)
- Si **le mentor** rate : remboursement automatique sous 24h
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // PAIEMENTS
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "methodes-paiement",
    category: "paiements",
    title: "Méthodes de paiement acceptées",
    excerpt: "Mobile Money africain, cartes Visa/Mastercard, PayPal, virement bancaire.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["paiement", "mobile money", "carte", "paypal"],
    body: `
## Mobile Money (Afrique)
Disponible dans **17 pays** via Moneroo et CinetPay :
| Opérateur | Pays couverts |
|---|---|
| **Orange Money** | Sénégal, Côte d'Ivoire, Cameroun, Mali, Burkina Faso, Guinée, Niger |
| **Wave** | Sénégal, Côte d'Ivoire |
| **MTN MoMo** | Côte d'Ivoire, Cameroun, Ghana, Bénin, Congo, Rwanda, Ouganda |
| **Moov Money** | Bénin, Togo, Gabon, Burkina Faso, Côte d'Ivoire |

- Paiement instantané
- Pas de frais côté acheteur
- Confirmation par SMS

## Cartes bancaires
- **Visa / Mastercard** — international
- **American Express** — via Stripe (bientôt)
- 3D-Secure (validation par code SMS) automatique

## PayPal
Disponible si le vendeur l'a activé. Pratique pour les clients européens.

## Virement bancaire SEPA
Uniquement pour achats > 50 000 FCFA. Délai 24-48h pour crédit.

## En tant que vendeur, quelles méthodes j'accepte ?
Dans \`/vendeur/parametres\` → **Paiements**, cochez celles que vos clients peuvent utiliser au checkout. Par défaut : Orange Money, Wave, MTN, Moov, Carte.

Si vous désactivez une méthode, elle n'apparaîtra plus dans le sélecteur de paiement lors de l'achat de vos produits.
`,
  },
  {
    slug: "retirer-mes-gains",
    category: "paiements",
    title: "Retirer vos gains : délais, méthodes, limites",
    excerpt: "Délai de séquestre 24h, puis retrait vers Mobile Money, virement ou PayPal.",
    readingMin: 5,
    lastUpdated: "2026-04-18",
    tags: ["retrait", "payout", "gains"],
    body: `
## Où voir mes gains ?
\`/wallet\` (Revenus & retraits) centralise :
- **Total disponible** : net de commissions, déduction faite du séquestre
- **En attente de séquestre** : paiements reçus il y a < 24h
- **Déjà retiré** : historique complet

## Commission Novakou
- **5%** sur chaque vente + **0,3%** frais de traitement
- Le reste est crédité sur votre wallet (95% pour un vendeur, 95% moins la commission affilié si applicable)

## Délai de séquestre
Les fonds sont bloqués **24 heures** après paiement, le temps que la transaction soit confirmée et qu'un éventuel remboursement client ne casse pas votre bilan.

## Configurer vos comptes de retrait
\`/vendeur/parametres\` → **Paiements** → **Comptes de retrait** → Ajouter.

Vous pouvez enregistrer jusqu'à 10 méthodes :
- Mobile Money (téléphone)
- Virement bancaire (IBAN)
- PayPal (email)

Marquez-en une comme **« Principale »** — elle sera utilisée par défaut au moment du retrait.

## Faire un retrait
\`/wallet\` → **Retirer** → choisir :
- Montant (minimum 5 000 FCFA, maximum égal au solde disponible)
- Méthode de retrait

## Délais
| Méthode | Délai de réception |
|---|---|
| Mobile Money | 1 à 4 heures ouvrées |
| PayPal | 1 à 24 heures |
| Virement SEPA | 1 à 3 jours ouvrés |

## Frais de retrait
- Mobile Money : inclus (pas de frais supplémentaires)
- PayPal : 2% prélevés par PayPal
- Virement : 500 FCFA forfaitaire

## KYC niveau 3 obligatoire
Vous devez avoir validé votre pièce d'identité pour retirer.
`,
  },
  {
    slug: "commission-affiliation",
    category: "paiements",
    title: "Comment fonctionne la commission quand on a un affilié",
    excerpt: "Novakou 5%, affilié X%, vendeur le reste. Exemple détaillé.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["affiliation", "commission", "revenus"],
    body: `
## Structure de la commission

Pour chaque vente de **100 000 FCFA** :

### Cas 1 — Vente directe (pas d'affilié)
| | Part | Montant |
|---|---|---|
| Novakou (plateforme) | 5% | 5 000 FCFA |
| Vendeur | 95% | 95 000 FCFA |

### Cas 2 — Vente via un affilié qui a 20% de commission
| | Part | Montant |
|---|---|---|
| Novakou (plateforme) | 5% | 5 000 FCFA |
| Affilié | 20% | 20 000 FCFA |
| Vendeur | 75% | 75 000 FCFA |

> 💡 La commission affiliée sort **de votre part**, pas de celle de Novakou. C'est normal : vous « achetez » du trafic qualifié via vos ambassadeurs.

## Configurer un programme d'affiliation
\`/vendeur/marketing/affiliation\` → **Créer un programme** :
- Commission % que vous êtes prêt à verser (entre 5% et 50%)
- Durée de suivi du cookie (30, 60, 90 jours)
- Produits couverts (tout le catalogue ou sélection)

## Voir qui sont mes affiliés
\`/vendeur/marketing/affiliation\` affiche la liste + performance (clics → ventes → CA généré).
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // MARKETING
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "codes-promo-avances",
    category: "marketing",
    title: "Créer des codes promo avancés (BOGO, tier, premier achat)",
    excerpt: "Au-delà du simple -10%. BOGO, réductions progressives, premier achat uniquement.",
    readingMin: 4,
    lastUpdated: "2026-04-18",
    tags: ["code promo", "bogo", "reduction"],
    body: `
## Les 4 types de codes promo disponibles

### 1. Pourcentage / montant fixe (classique)
\`BIENVENUE10\` = -10% sur tout le catalogue.
\`-5000FCFA\` = -5 000 FCFA sur une commande.

### 2. Premier achat seulement
Cochez **« Première commande uniquement »** → le code n'est utilisable que par les clients qui n'ont **aucune commande passée**.
Parfait pour les lead magnets et campagnes acquisition.

### 3. BOGO (Buy One Get One free)
« Achetez N, obtenez M gratuit(s) ».
- Exemple : **BUY2GET1** — achetez 2 formations, la 3e (la moins chère) est gratuite.
- Le moteur choisit automatiquement l'article **le moins cher** comme offert.

### 4. Tiered (palier)
Plus vous achetez, plus vous économisez.
- Exemple : **2 articles → -10%, 3 articles → -25%**
- Le moteur applique **le meilleur palier** atteint.

## Limites et garde-fous
- **maxUses** : nombre total d'utilisations avant expiration
- **maxUsesPerUser** : limiter par personne (ex. 1 seule fois)
- **minOrderAmount** : montant minimum d'achat
- **expiresAt** : date d'expiration

## Créer un code
\`/vendeur/marketing/codes-promo\` → **Nouveau code** → remplir le formulaire.

## Suivre les performances
La page liste chaque code avec :
- Nombre d'utilisations
- Total remisé (coût pour vous)
- CA généré (bénéfice)
- ROI (CA / remises)
`,
  },
  {
    slug: "creer-bundle",
    category: "marketing",
    title: "Créer un bundle pour augmenter votre panier moyen",
    excerpt: "Regroupez plusieurs formations/produits à prix réduit. +20 à 30% de LTV constaté.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["bundle", "pack", "upsell"],
    body: `
## Qu'est-ce qu'un bundle ?
Un pack de **2 à 20 produits** (formations + e-books + templates) vendus ensemble à un prix inférieur à la somme des prix individuels.

## Pourquoi c'est puissant
- **Panier moyen +20 à 30%** (le client prend tout d'un coup)
- **Taux de satisfaction plus élevé** (l'expérience est complète)
- **Plus difficile à refuser** que 3 achats séparés

## Créer un bundle
\`/vendeur/bundles\` → **Nouveau bundle**.

1. **Titre** accrocheur (ex. « Pack Débutant — Marketing Digital 360° »)
2. **Description** (pourquoi ce pack est unique)
3. **Sélection des produits** (2 à 20) — vous ne pouvez inclure **que vos propres produits**
4. **Prix du bundle** (doit être < somme des prix individuels)
5. L'économie réalisée est automatiquement affichée au client

## Exemple concret
3 formations individuelles :
- Formation A : 30 000 FCFA
- Formation B : 25 000 FCFA
- Formation C : 20 000 FCFA
- **Somme : 75 000 FCFA**

Bundle proposé à **50 000 FCFA** → client économise **25 000 FCFA (-33%)**, vous vendez tout d'un coup.

## Afficher le bundle
Une fois publié, le bundle est :
- Visible sur votre boutique publique
- Référencé dans l'explorateur
- Proposé au checkout comme **upsell** quand un client achète l'un des produits inclus
`,
  },
  {
    slug: "retargeting-panier",
    category: "marketing",
    title: "Panier abandonné : la séquence de 3 emails qui récupère 7-12% des ventes",
    excerpt: "H+1h, H+24h, H+7j. Zéro config, tout est automatique.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["panier", "abandonné", "email", "retargeting"],
    body: `
## Le constat
**70% des paniers sont abandonnés** sur les sites e-commerce. Novakou récupère en moyenne **7 à 12%** de ces paniers grâce à une séquence de relance automatique.

## Qui reçoit les emails ?
- Les utilisateurs connectés qui ajoutent au panier mais ne finalisent pas
- Les **invités** qui laissent leur email à la page checkout mais partent avant de payer

## La séquence
### Email 1 — 1 heure après abandon
Objet : *« Votre panier vous attend sur Novakou »*
Contenu : rappel du produit + lien direct vers le panier + rassure sur la sécurité.

### Email 2 — 24 heures après abandon
Objet : *« On a gardé votre panier pour vous — 24h reste »*
Contenu : urgence douce + avis clients du produit + **code promo -10%** optionnel.

### Email 3 — 7 jours après abandon
Objet : *« Dernière chance — [votre produit] vous attend toujours »*
Contenu : dernier rappel + témoignage vidéo client si disponible + alternatives de paiement (si le blocage était financier).

## Désactiver les relances
Les clients peuvent se désinscrire en 1 clic depuis n'importe quel email. Vous pouvez aussi désactiver toute la séquence dans \`/vendeur/parametres\` → Notifications.

## Mesurer l'impact
\`/vendeur/statistiques\` → section **« Récupération panier abandonné »** :
- Nombre d'emails envoyés
- Taux d'ouverture
- Taux de clic
- Taux de conversion en achat
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // BOUTIQUE
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "connecter-domaine",
    category: "boutique",
    title: "Connecter votre propre nom de domaine à votre boutique",
    excerpt: "Allez de novakou.com/boutique/votre-slug à votreboutique.com en 15 minutes.",
    readingMin: 6,
    lastUpdated: "2026-04-18",
    tags: ["domaine", "dns", "boutique"],
    body: `
## Pourquoi un domaine custom ?
- **Crédibilité** : \`monacademy.com\` inspire plus confiance que \`novakou.com/boutique/slug\`
- **SEO** : votre propre domaine capitalise sur votre marque
- **Marketing** : URL courte, mémorisable, partageable

## 1. Acheter un domaine
Chez un registrar (OVH, Gandi, Namecheap, Hostinger, etc.). Coût typique : 10-15 €/an.

## 2. Ajouter le domaine dans Novakou
\`/vendeur/parametres\` → onglet **Nom de domaine** → saisir \`votreboutique.com\` → **Connecter**.

Novakou vous affiche les enregistrements DNS à configurer.

## 3. Configurer les DNS chez votre registrar

### Pour un domaine racine (\`votreboutique.com\`)
- Type : **A**
- Nom : \`@\`
- Valeur : **\`216.198.79.1\`**

### Pour un sous-domaine (\`shop.votreboutique.com\`)
- Type : **CNAME**
- Nom : \`shop\`
- Valeur : **\`cname.vercel-dns.com\`**

## 4. Supprimer les enregistrements conflictuels
**Important** : supprimez **tous** les anciens enregistrements A, AAAA ou CNAME sur ce domaine (sauf le nouveau). Sinon, la moitié de vos visiteurs verra l'ancien site.

## 5. Attendre la propagation DNS
- **10 minutes à 2 heures** en général
- Jusqu'à **24 heures** dans certains cas

## 6. Vérifier dans Novakou
Retournez sur l'onglet domaine → cliquez « Vérifier la configuration ».
- ✅ Vert : tout est bon, SSL auto-provisionné
- ❌ Rouge : vous verrez exactement quels enregistrements posent problème

## SSL automatique
Une fois le domaine vérifié, un certificat SSL est généré automatiquement en ~1 minute par Vercel. Votre boutique est en HTTPS sans action de votre part.
`,
  },
  {
    slug: "multi-shops",
    category: "boutique",
    title: "Gérer plusieurs boutiques avec un seul compte",
    excerpt: "Jusqu'à 5 boutiques indépendantes (catalogue, marketing, thème) par vendeur.",
    readingMin: 4,
    lastUpdated: "2026-04-18",
    tags: ["multi-shop", "boutique"],
    body: `
## Pourquoi plusieurs boutiques ?
- Vous vendez des formations **business** ET du **coaching perso** → 2 boutiques pour ne pas mélanger
- Vous avez **plusieurs marques** à faire cohabiter
- Vous segmentez par **langue** (boutique FR + boutique EN)

## Limite
**5 boutiques maximum** par compte. Pour aller au-delà, contactez le support.

## Créer une nouvelle boutique
\`/vendeur/boutiques\` → **+ Créer une boutique** :
- Nom
- Slug (URL)
- Description
- Couleur de thème (personnalise tout le chrome)

## Catalogue indépendant
Chaque boutique a son **propre catalogue** : une formation créée dans la boutique A **n'apparaît pas** dans la boutique B. Choisissez la boutique active avant de créer un produit.

## Basculer entre boutiques
En haut à droite, cliquez sur le chip de la boutique active → menu déroulant → choisir.
Tout le dashboard (produits, ventes, revenus) bascule sur la boutique sélectionnée.

## Domaines
Chaque boutique peut avoir **son propre domaine custom**.

## Statistiques
\`/vendeur/statistiques\` est scopé à la boutique active. Vous pouvez comparer les boutiques en basculant.

## Retraits
**Un seul wallet** pour toutes vos boutiques. Les gains sont agrégés.
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // SÉCURITÉ
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "activer-2fa",
    category: "securite",
    title: "Activer l'authentification à deux facteurs (2FA)",
    excerpt: "Protection en 30 secondes avec Google Authenticator, Authy ou 1Password.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["2fa", "securite", "authenticator"],
    body: `
## Pourquoi activer la 2FA ?
Même si quelqu'un vole votre mot de passe, il ne peut pas se connecter **sans votre téléphone**. C'est l'une des protections les plus efficaces pour un compte en ligne.

## 1. Installer une app authenticator
Au choix, gratuits :
- **Google Authenticator** (iOS, Android)
- **Authy** (multi-device, sync cloud)
- **1Password** (si vous l'avez déjà)
- **Microsoft Authenticator**

## 2. Aller dans les paramètres Novakou
\`/parametres\` → onglet **Sécurité** → section **Authentification à deux facteurs**.

Cliquez **« Activer la 2FA »**.

## 3. Scanner le QR code
Ouvrez votre app → « Ajouter un compte » → scanner le QR affiché.
(Ou saisissez manuellement la clé secrète affichée à côté.)

## 4. Confirmer
L'app affiche un code à 6 chiffres qui change toutes les 30 secondes.
Saisissez le code dans le champ prévu → **Confirmer**.

✅ 2FA activée.

## Que se passe-t-il à la prochaine connexion ?
Après avoir saisi email + mot de passe (ou connexion Google), Novakou vous demande le code à 6 chiffres de votre app.
Sans ce code, impossible d'accéder au dashboard — **même si le mot de passe est correct**.

## Désactiver la 2FA
Même écran → **« Désactiver »**. Le secret est supprimé côté serveur.

## J'ai perdu mon téléphone !
Contactez immédiatement le support (\`support@novakou.com\` ou chat) avec une pièce d'identité. On désactive la 2FA manuellement après vérification.
`,
  },
  {
    slug: "cookies-rgpd",
    category: "securite",
    title: "Cookies, analytics et confidentialité (RGPD)",
    excerpt: "Ce que Novakou collecte, comment le désactiver, et vos droits.",
    readingMin: 4,
    lastUpdated: "2026-04-18",
    tags: ["cookies", "rgpd", "vie privée"],
    body: `
## Les 4 catégories de cookies

### 1. Essentiels (toujours activés)
Sans eux le site ne marche pas :
- Authentification (\`next-auth.session-token\`)
- Sécurité CSRF
- Panier invité

### 2. Préférences
- Devise affichée
- Langue
- Thème sombre / clair
- Boutique active (pour les vendeurs multi-shops)

### 3. Analytics
- Google Analytics 4 (anonymisé IP)
- Tracker Novakou interne (pages vues, durée, parcours)

### 4. Marketing
- Pixels de conversion (Meta, TikTok) installés par les vendeurs

## Consentement explicite
Au premier visit, la bannière vous propose :
- **Tout accepter** — tout est activé
- **Tout refuser** — seuls les essentiels restent (légalement obligatoires)
- **Personnaliser** — choisissez catégorie par catégorie

Tant que vous n'avez pas accepté, **aucun tracker** n'est chargé (Consent Mode v2).

## Modifier vos choix
Cliquez sur « Cookies » dans le footer → la bannière réapparaît.

## Vos droits RGPD
Vous pouvez demander à tout moment :
- **Export** de vos données (\`/parametres\` → Confidentialité → Exporter)
- **Suppression** complète de votre compte (même endroit — 72h de délai de rétractation)
- **Rectification** de vos infos
- **Opposition** à certains traitements

Contactez \`privacy@novakou.com\` pour toute question.
`,
  },
  {
    slug: "supprimer-compte",
    category: "securite",
    title: "Supprimer votre compte Novakou",
    excerpt: "Procédure en 72h avec période de rétractation. Données supprimées définitivement.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["suppression", "compte", "rgpd"],
    body: `
## Avant de supprimer
Récupérez ce qui compte :
- **Exporter vos données** (\`/parametres\` → Confidentialité → Exporter)
- **Télécharger vos certificats** obtenus
- **Retirer tous vos gains** (si vendeur/mentor)

## Procédure
\`/parametres\` → onglet **Compte** → tout en bas, **« Supprimer mon compte »**.

1. **Indiquer la raison** (aide Novakou à s'améliorer)
2. **Confirmer** en tapant le mot « SUPPRIMER »
3. Le compte passe en **cooldown 72h**

## Pendant les 72h
- Votre compte est **désactivé** (plus de connexion, plus de visibilité publique)
- Un **admin** valide la suppression
- Vous pouvez **annuler** en revenant sur la page dans les 72h

## Après 72h
- Suppression **définitive** de votre compte
- Données personnelles effacées (nom, email, téléphone, pays, photo)
- **Historique de transactions conservé 10 ans** (obligation légale comptable)
- Vos **produits publiés** restent accessibles aux clients qui les ont achetés

## Cas particuliers
- **Gains non retirés** : vous avez 30 jours pour les retirer avant suppression
- **Séances à venir (mentor)** : annulées automatiquement, apprenants remboursés
- **Abonnements mensuels actifs** : annulés, prorata remboursé
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // PROBLÈMES
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: "paiement-echoue",
    category: "problemes",
    title: "Mon paiement a échoué — que faire ?",
    excerpt: "Vérifier le solde, réessayer, changer de méthode, contacter le support.",
    readingMin: 3,
    lastUpdated: "2026-04-18",
    tags: ["paiement", "erreur", "echec"],
    body: `
## Vérifier les raisons courantes

### 1. Solde insuffisant
Sur Mobile Money ou carte bancaire. Rechargez et réessayez.

### 2. Plafond dépassé
Les opérateurs Mobile Money ont souvent un plafond de 500 000 FCFA/transaction. Contactez votre opérateur pour lever le plafond.

### 3. Code de validation expiré
Les codes OTP SMS expirent en 30 secondes. Redemandez un code.

### 4. Mauvais numéro
Vérifiez que le numéro saisi correspond au wallet Mobile Money (erreur fréquente).

### 5. Problème de réseau
Ça arrive. Attendez 1 minute et réessayez.

## Changer de méthode de paiement
À la page de paiement, cliquez **« Changer de méthode »** → sélectionnez Wave, Orange Money, MTN, carte, PayPal…

## Le paiement s'est affiché "OK" mais la formation n'apparaît pas
- Patientez **2 minutes** (délai du webhook provider)
- Rafraîchissez \`/apprenant/mes-formations\`
- Si rien : contactez le support avec le **reçu SMS** du paiement (on retrouve la transaction)

## L'argent a été débité mais pas de formation
C'est rare mais possible. Envoyez-nous :
- Le reçu de transaction
- L'heure exacte du paiement
- Le nom du produit acheté

Nous vérifions et **créditons ou remboursons dans les 24h**.
`,
  },
  {
    slug: "mot-de-passe-oublie",
    category: "problemes",
    title: "Mot de passe oublié — réinitialisation en 2 minutes",
    excerpt: "Lien par email, création d'un nouveau mot de passe.",
    readingMin: 2,
    lastUpdated: "2026-04-18",
    tags: ["mot de passe", "reset", "connexion"],
    body: `
## Procédure

1. \`/connexion\` → cliquez **« Mot de passe oublié »**
2. Saisissez votre **email**
3. Un email avec un lien de réinitialisation vous est envoyé (valable 1h)
4. Cliquez le lien → créez un **nouveau mot de passe**
5. Connectez-vous immédiatement avec

## Email non reçu ?
- Vérifiez les **spams / courrier indésirable**
- Assurez-vous d'utiliser **la bonne adresse** (celle de votre compte)
- Attendez 2 minutes et redemandez

## J'ai aussi perdu l'accès à mon email
C'est plus complexe. Envoyez un email à \`support@novakou.com\` depuis un autre email avec :
- Votre **nom complet**
- Une **pièce d'identité**
- **Date approximative** de création du compte
- Un **reçu de transaction** récent (si possible)

Notre équipe vérifie et vous remettra en selle sous 48h.

## J'ai la 2FA activée et perdu mon téléphone
Voir l'article "Activer la 2FA" — section "J'ai perdu mon téléphone".
`,
  },
  {
    slug: "contacter-support",
    category: "problemes",
    title: "Contacter le support Novakou",
    excerpt: "Chat, email, ticket. Temps de réponse par canal.",
    readingMin: 2,
    lastUpdated: "2026-04-18",
    tags: ["support", "contact", "aide"],
    body: `
## Canaux de contact

### Chat en direct
Widget en bas à droite sur toutes les pages publiques. Disponible **Lundi-Vendredi, 8h-19h GMT**.
Temps de réponse médian : **< 5 minutes**.

### Email
**\`support@novakou.com\`**
Temps de réponse : **< 24h ouvrées**.

### Formulaire de contact
\`/contact\` → sélectionnez la catégorie de votre demande → remplissez → envoyez.
Vous recevez un numéro de ticket pour suivre la progression.

### Urgences paiement
**\`paiements@novakou.com\`** — priorité absolue, réponse **< 2h ouvrées**.

## Quelles infos fournir ?
Plus c'est précis, plus vite on résout :
- **URL** de la page où le problème est apparu
- **Capture d'écran**
- **Date + heure** du problème
- **Navigateur** (Chrome, Safari, Firefox…)
- **Numéro de transaction** si problème de paiement
- **Numéro de commande** si problème post-achat

## Pour les vendeurs / mentors premium
Un canal **Slack privé** avec accès à l'équipe produit est ouvert aux vendeurs dépassant 500 000 FCFA de CA mensuel. Contactez-nous pour y être ajouté.

## Communauté d'entraide
\`/aide\` → onglet **Communauté** (bientôt) — entraide entre vendeurs et mentors.
`,
  },
];

// ─── Helpers pour la recherche et la navigation ───────────────────────

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: ArticleCategorySlug): Article[] {
  return ARTICLES.filter((a) => a.category === category);
}

export function getCategory(slug: string): ArticleCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** Full-text search sur titre + excerpt + tags + body (lowercase, tous les tokens). */
export function searchArticles(query: string): Article[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];

  return ARTICLES.filter((a) => {
    const haystack = [
      a.title,
      a.excerpt,
      a.body,
      ...(a.tags ?? []),
      a.category,
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  })
    .map((a) => {
      // Simple scoring: title match > excerpt/tag match > body match
      const hay = a.title.toLowerCase();
      const score = tokens.reduce((s, t) => {
        if (hay.includes(t)) return s + 10;
        if (a.excerpt.toLowerCase().includes(t)) return s + 3;
        if ((a.tags ?? []).some((tag) => tag.toLowerCase().includes(t))) return s + 5;
        return s + 1;
      }, 0);
      return { a, score };
    })
    .sort((x, y) => y.score - x.score)
    .map((r) => r.a);
}
