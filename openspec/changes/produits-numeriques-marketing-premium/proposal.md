## Why

La plateforme Formations est fonctionnelle en MVP (cours, paiement, certificats, admin) mais il manque des fonctionnalités critiques de croissance et de monétisation. Les instructeurs ne peuvent pas vendre de produits numériques standalone (ebooks, PDFs, licences), n'ont aucun outil marketing (pixels publicitaires, relance panier abandonné, promotions flash), et les descriptions sont en texte brut sans mise en forme. Ces lacunes empêchent la plateforme de rivaliser avec Gumroad, Teachable ou Hotmart. L'ajout de ces fonctionnalités est prioritaire pour maximiser le taux de conversion (+15-25%) et élargir l'offre au-delà des cours vidéo.

**Version cible : V1-V2** (implémentation progressive)

## What Changes

### Produits Numériques (Ebooks, PDFs, Licences)
- Nouveau type de produit `PRODUIT_NUMERIQUE` dans le schéma Prisma avec modèle `DigitalProduct` dédié
- Marketplace de produits numériques (livres, PDFs, templates, licences logicielles)
- Page de création produit avec description riche (Markdown/Tiptap), bannière, aperçu avec filigrane
- Aperçu configurable par le vendeur (pages sélectionnées, filigrane automatique)
- Limitation du nombre d'acheteurs (stock limité) avec compteur visible
- Système de licences avec clés uniques et validation
- Téléchargement sécurisé via URLs signées Supabase Storage avec expiration

### Descriptions Riches (Markdown/Tiptap)
- Éditeur Tiptap intégré pour les descriptions de formations ET de produits numériques
- Support : gras, italique, titres, listes, tableaux, images, couleurs, blocs de code, citations
- Rendu Markdown côté public avec sanitisation HTML
- Migration des champs `descriptionFr/En` de texte brut vers Tiptap JSON

### Promotions Flash & Urgence
- Champ `discountStartAt` + `discountEndAt` sur Formation et DigitalProduct
- Compteur de places restantes (`maxStudents` / `maxBuyers` avec décompte temps réel)
- Widget countdown timer affiché sur la page détail et dans le panier
- Promotions configurables par l'instructeur depuis son dashboard

### Automatisation Marketing Instructeur
- Relance automatique des paniers abandonnés (détection 1h, email à 1h/24h/7j) via job BullMQ
- Relance des paiements échoués (webhook Stripe `payment_intent.payment_failed`)
- Dashboard marketing instructeur avec métriques (vues, ajouts panier, conversions, abandons)
- Intégration pixels publicitaires : Facebook Pixel, Google Ads Tag, TikTok Pixel (configurable par instructeur)
- Événements de conversion trackés : page vue, ajout panier, achat complété

### APIs & Webhooks
- Webhook Stripe étendu : `payment_intent.payment_failed`, `charge.disputed`, `charge.refunded`
- API produits numériques : CRUD, achat, téléchargement, aperçu
- API marketing : stats conversion, abandon panier, relances
- API promotions : CRUD flash sales, countdown, stock limité

## Capabilities

### New Capabilities
- `digital-products`: Marketplace de produits numériques (ebooks, PDFs, licences) avec création, achat, téléchargement sécurisé, aperçu filigrane, stock limité
- `rich-text-editor`: Éditeur Tiptap/Markdown pour descriptions de formations et produits avec images, tableaux, couleurs, mise en forme complète
- `flash-promotions`: Promotions limitées dans le temps et en quantité avec countdown timer, stock restant, prix barré automatique
- `marketing-automation`: Relance paniers abandonnés, récupération paiements échoués, emails automatiques séquentiels via BullMQ
- `ad-pixel-tracking`: Intégration pixels publicitaires (Facebook, Google, TikTok) avec événements de conversion par instructeur
- `instructor-marketing-dashboard`: Tableau de bord marketing instructeur avec funnel de conversion, métriques d'abandon, ROI publicitaire

### Modified Capabilities
_(Aucune spec existante à modifier — toutes les capabilities sont nouvelles)_

## Impact

### Schéma Prisma (nouvelles tables)
- `DigitalProduct` — produit numérique avec prix, fichier, aperçu, stock, licence
- `DigitalProductPurchase` — achat avec clé de licence, téléchargements
- `AbandonedCart` — détection panier abandonné avec séquence de relance
- `MarketingPixel` — configuration pixel pub par instructeur
- `FlashPromotion` — promotion flash avec dates, stock, countdown
- `MarketingEvent` — événements de conversion (page_view, add_to_cart, purchase)
- Colonnes ajoutées sur `Formation` : `maxStudents`, `discountStartAt`, `discountEndAt`, `descriptionFormat`

### APIs impactées
- `POST /api/formations/checkout` — support produits numériques + flash promotions
- `POST /api/webhooks/stripe` — nouveaux événements (failed, disputed, refunded)
- Nouvelles routes : `/api/produits/`, `/api/instructeur/marketing/`, `/api/formations/promotions/`

### Jobs BullMQ nécessaires
- `abandoned-cart-check` — cron toutes les heures, détecte les paniers > 1h
- `abandoned-cart-email` — envoi séquentiel (1h, 24h, 7j)
- `failed-payment-retry` — notification + incitation après paiement échoué
- `flash-promo-expiry` — désactivation automatique des promotions expirées

### Templates Email (Resend + React Email)
- `abandoned-cart-reminder` — "Vous avez oublié quelque chose !"
- `failed-payment-notification` — "Votre paiement n'a pas abouti"
- `flash-promo-starting` — "Promotion flash : -X% pendant Y heures"
- `digital-product-delivery` — "Votre produit est prêt à télécharger"
- `license-key-delivery` — "Votre clé de licence"

### Impact sur les rôles
- **Instructeur** : nouveau dashboard marketing, création produits numériques, config pixels, promotions flash
- **Apprenant** : achat produits numériques, bibliothèque de téléchargements, aperçu filigrane
- **Admin** : modération produits numériques, analytics marketing, gestion flash promos
- **Public** : marketplace produits numériques, pages avec descriptions riches, countdown timers

### Dépendances
- `@tiptap/react`, `@tiptap/starter-kit`, extensions Tiptap (déjà installé pour les services)
- `pdf-lib` pour l'ajout de filigrane sur les aperçus PDF
- Aucune nouvelle infrastructure (utilise Supabase Storage, BullMQ, Stripe existants)
