## 1. Schéma Prisma & Modèles de Données

- [x] 1.1 Ajouter le modèle `DigitalProduct` dans schema.prisma avec tous les champs (id, slug, titleFr/En, descriptionFr/En, descriptionFormat, productType enum EBOOK/PDF/TEMPLATE/LICENCE/AUDIO/VIDEO/AUTRE, price, originalPrice, isFree, banner, fileUrl, fileStoragePath, fileSize, fileMimeType, previewEnabled, previewPages, watermarkEnabled, maxBuyers, currentBuyers, status enum, instructeurId, categoryId, tags, rating, reviewsCount, salesCount, viewsCount, createdAt, updatedAt) + relations InstructeurProfile et FormationCategory
- [x] 1.2 Ajouter le modèle `DigitalProductPurchase` (id, userId, productId, paidAmount, stripeSessionId, licenseKey, downloadCount, maxDownloads=5, createdAt) + relations User et DigitalProduct
- [x] 1.3 Ajouter le modèle `DigitalProductReview` (id, userId, productId, rating 1-5, comment, instructorResponse, createdAt) + relations
- [x] 1.4 Ajouter le modèle `FlashPromotion` (id, formationId nullable, digitalProductId nullable, discountPct, startsAt, endsAt, maxUsage, usageCount, isActive, createdAt) + relations Formation et DigitalProduct
- [x] 1.5 Ajouter le modèle `AbandonedCart` (id, userId, cartItemIds String[], detectedAt, emailSequence 0-3, lastEmailAt, status enum DETECTE/RELANCE_1/RELANCE_2/RELANCE_3/CONVERTI/TERMINE/DESABONNE, createdAt) + relation User
- [x] 1.6 Ajouter le modèle `MarketingPixel` (id, instructeurId, type enum FACEBOOK/GOOGLE/TIKTOK, pixelId, isActive, createdAt) + relation InstructeurProfile
- [x] 1.7 Ajouter le modèle `MarketingEvent` (id, type enum PAGE_VIEW/ADD_TO_CART/CHECKOUT_STARTED/PURCHASE_COMPLETED/PAYMENT_FAILED/CART_ABANDONED, formationId nullable, digitalProductId nullable, userId nullable, metadata Json, createdAt) + index sur type + createdAt
- [x] 1.8 Ajouter les colonnes `maxStudents`, `discountStartAt`, `discountEndAt`, `descriptionFormat` sur le modèle Formation existant
- [x] 1.9 Exécuter `prisma migrate dev` et vérifier que la migration passe sans erreur + régénérer le client Prisma

## 2. Produits Numériques — APIs Backend

- [x] 2.1 Créer `POST /api/produits` — création d'un produit numérique par un instructeur (validation Zod, upload fichier vers Supabase Storage bucket `digital-products`, création DigitalProduct en statut EN_ATTENTE)
- [x] 2.2 Créer `GET /api/produits` — liste des produits numériques actifs avec filtres (catégorie, type, prix min/max, note), tri (populaire, récent, prix), pagination, pour la marketplace publique
- [x] 2.3 Créer `GET /api/produits/[slug]` — détail d'un produit numérique (inclut instructeur, avis, promo flash active, stock restant)
- [x] 2.4 Créer `PUT /api/produits/[id]` — mise à jour d'un produit par son instructeur (titre, description, prix, paramètres aperçu, stock max)
- [x] 2.5 Créer `DELETE /api/produits/[id]` — archivage d'un produit (passe en statut ARCHIVE, pas de suppression physique)
- [x] 2.6 Créer `GET /api/produits/[id]/preview` — génération d'un aperçu PDF filigrané via pdf-lib (N premières pages, texte "APERÇU - FreelanceHigh" en diagonale, cache Redis 1h)
- [x] 2.7 Créer `GET /api/produits/[id]/download` — téléchargement sécurisé via URL signée Supabase Storage (vérifier achat, vérifier downloadCount < 5, incrémenter downloadCount)
- [x] 2.8 Créer `POST /api/produits/checkout` — création session Stripe Checkout pour un produit numérique (avec transaction atomique pour vérifier stock si maxBuyers)
- [x] 2.9 Modifier le webhook Stripe `/api/webhooks/stripe` pour gérer les achats de produits numériques (créer DigitalProductPurchase, générer licenseKey si type LICENCE, incrémenter salesCount et currentBuyers, envoyer email livraison)
- [x] 2.10 Installer le package `pdf-lib` pour la génération de filigrane PDF

## 3. Produits Numériques — Pages Frontend

- [x] 3.1 Créer la page marketplace produits `/produits/page.tsx` — grille responsive avec bannière, titre, prix, type badge, note, ventes, badge "Stock limité", badge "Aperçu dispo", filtres et tri
- [x] 3.2 Créer la page détail produit `/produits/[slug]/page.tsx` — bannière grande, description Tiptap rendue, prix (barré si promo), type produit, instructeur, avis, bouton aperçu, bouton acheter, compteur stock, countdown promo
- [x] 3.3 Créer le composant `CountdownTimer` réutilisable (jours/heures/minutes/secondes, mise à jour chaque seconde, disparition à zéro)
- [x] 3.4 Créer le composant `StockCounter` réutilisable (barre de progression, "Plus que X places/exemplaires !", couleur rouge si < 10%)
- [x] 3.5 Créer la page wizard création produit `/(instructeur)/instructeur/produits/creer/page.tsx` — wizard 4 étapes : Informations (titre FR/EN, catégorie, type produit, tags), Description (éditeur Tiptap), Fichier & Aperçu (upload, bannière, config aperçu/filigrane, stock max), Prix & Publication (prix, prix original, gratuit, soumettre)
- [x] 3.6 Créer la page liste produits instructeur `/(instructeur)/instructeur/produits/page.tsx` — tableau avec titre, type, prix, ventes, revenus, stock, statut, actions (modifier, archiver, dupliquer)
- [x] 3.7 Créer la page bibliothèque téléchargements apprenant `/(apprenant)/mes-produits/page.tsx` — liste des produits achetés avec bouton télécharger, clé de licence (si type LICENCE), nombre de téléchargements restants
- [x] 3.8 Ajouter le lien "Produits numériques" dans la sidebar instructeur et le lien "Mes produits" dans la sidebar apprenant

## 4. Éditeur de Description Riche (Tiptap)

- [x] 4.1 Créer le composant `FormationRichEditor` basé sur le RichTextEditor existant dans `components/services/wizard/editor/` — adapter pour les formations (même extensions : bold, italic, heading, lists, tables, images, colors, links, code blocks, blockquote)
- [x] 4.2 Intégrer `FormationRichEditor` dans le wizard de création de formation (étape 1) pour les champs descriptionFr et descriptionEn en remplacement des textarea
- [x] 4.3 Intégrer `FormationRichEditor` dans le wizard de création de produit numérique (étape 2)
- [x] 4.4 Créer le composant `TiptapRenderer` pour le rendu readonly sur les pages publiques — utilise `@tiptap/react` avec `editable: false`, sanitise le HTML (supprime scripts, iframes non autorisées)
- [x] 4.5 Modifier la page détail formation `/[slug]/page.tsx` pour utiliser `TiptapRenderer` au lieu du rendu texte brut — avec fallback : si `descriptionFormat !== 'tiptap'`, wrapper le texte brut en paragraphe Tiptap
- [x] 4.6 Ajouter le support drag-and-drop d'images dans l'éditeur Tiptap — upload vers `/api/upload/image` (Cloudinary), insertion en tant que nœud image avec URL optimisée

## 5. Promotions Flash & Stock Limité

- [x] 5.1 Créer `POST /api/instructeur/promotions` — création d'une promotion flash par un instructeur (validation : discountPct 1-90, startsAt futur, endsAt > startsAt, formationId ou digitalProductId requis)
- [x] 5.2 Créer `GET /api/instructeur/promotions` — liste des promotions de l'instructeur (actives, programmées, terminées) avec statistiques d'utilisation
- [x] 5.3 Créer `PUT /api/instructeur/promotions/[id]` — modification d'une promotion (seulement si pas encore commencée ou active)
- [x] 5.4 Créer `DELETE /api/instructeur/promotions/[id]` — annulation d'une promotion
- [x] 5.5 Modifier `GET /api/formations/[slug]` et `GET /api/produits/[slug]` pour inclure la promotion flash active dans la réponse (discountPct, endsAt, usageCount, maxUsage)
- [x] 5.6 Modifier la page détail formation pour afficher : prix barré + prix réduit + badge % + CountdownTimer + StockCounter si maxStudents configuré
- [x] 5.7 Modifier le checkout formations pour appliquer automatiquement la promotion flash active (priorité sur le code promo si réduction supérieure)
- [x] 5.8 Ajouter les colonnes `maxStudents` sur Formation dans le wizard de création (étape Prix) avec un toggle "Limiter le nombre d'étudiants"
- [x] 5.9 Créer le job BullMQ `flash-promo-expiry` — cron toutes les 5 minutes, désactive les promotions avec `endsAt < now()` ou `usageCount >= maxUsage`, met `isActive: false`

## 6. Automatisation Marketing — Paniers Abandonnés

- [x] 6.1 Créer le job BullMQ `abandoned-cart-check` — cron toutes les 30 minutes, détecte les CartItem > 1h sans Enrollment correspondant, crée AbandonedCart en statut DETECTE
- [x] 6.2 Créer le job BullMQ `abandoned-cart-email` — cron toutes les 15 minutes, vérifie les AbandonedCart et envoie l'email correspondant à la séquence (1h=RELANCE_1, 24h=RELANCE_2, 7j=RELANCE_3)
- [x] 6.3 Créer le template React Email `AbandonedCartReminder1` — "Vous avez oublié quelque chose !" avec image formation, titre, prix, bouton "Reprendre mon panier", lien désabonnement
- [x] 6.4 Créer le template React Email `AbandonedCartReminder2` — "Votre formation vous attend" avec les points clés (learnPoints), avis récents, bouton "Revenir au panier"
- [x] 6.5 Créer le template React Email `AbandonedCartReminder3` — "Dernière chance !" avec message final, bouton "Finaliser mon achat"
- [x] 6.6 Modifier le webhook Stripe (checkout.session.completed) pour mettre à jour les AbandonedCart correspondants en statut CONVERTI
- [x] 6.7 Créer `GET /api/formations/unsubscribe/[token]` — page de désabonnement des emails de relance, met tous les AbandonedCart de l'utilisateur en statut DESABONNE

## 7. Automatisation Marketing — Paiements Échoués & Litiges

- [x] 7.1 Ajouter le listener `payment_intent.payment_failed` dans le webhook Stripe — envoie email "Votre paiement n'a pas abouti" avec motif d'échec et lien pour réessayer
- [x] 7.2 Ajouter le listener `charge.disputed` dans le webhook Stripe — met `Enrollment.refundRequested: true`, notifie admin et instructeur par email
- [x] 7.3 Ajouter le listener `charge.refunded` dans le webhook Stripe — met à jour Enrollment.refundedAt, notifie l'apprenant et l'instructeur
- [x] 7.4 Créer le template React Email `FailedPaymentNotification` — "Votre paiement n'a pas abouti" avec motif, bouton "Réessayer", aide (contacter support)
- [x] 7.5 Créer le template React Email `DisputeNotification` — notification instructeur "Un litige a été ouvert"
- [x] 7.6 Créer le `MarketingEvent` pour chaque événement webhook (PAYMENT_FAILED, PURCHASE_COMPLETED) afin d'alimenter le dashboard marketing

## 8. Pixels Publicitaires (Facebook, Google, TikTok)

- [x] 8.1 Créer `GET /api/instructeur/marketing/pixels` — liste des pixels configurés par l'instructeur
- [x] 8.2 Créer `POST /api/instructeur/marketing/pixels` — ajout d'un pixel (type FACEBOOK/GOOGLE/TIKTOK, pixelId validé par regex, isActive)
- [x] 8.3 Créer `PUT /api/instructeur/marketing/pixels/[id]` — modification/désactivation d'un pixel
- [x] 8.4 Créer `DELETE /api/instructeur/marketing/pixels/[id]` — suppression d'un pixel
- [x] 8.5 Créer le composant `PixelTracker` — injecte les scripts pixels via `next/script` strategy `afterInteractive` en fonction des pixels actifs de l'instructeur de la formation/produit courant
- [x] 8.6 Créer les helpers `firePixelEvent(type, data)` pour déclencher PageView, AddToCart, Purchase sur les 3 plateformes avec les bons formats (fbq, gtag, ttq)
- [x] 8.7 Intégrer `PixelTracker` dans le layout formations `(public)` — charger les pixels de l'instructeur pour la formation courante
- [x] 8.8 Déclencher `firePixelEvent('AddToCart')` dans la fonction d'ajout au panier et `firePixelEvent('Purchase')` sur la page de succès post-paiement
- [x] 8.9 Créer la page configuration pixels `/(instructeur)/instructeur/marketing/pixels/page.tsx` — formulaire avec champs par type de pixel, toggle actif/inactif, validation format

## 9. Dashboard Marketing Instructeur

- [x] 9.1 Créer `GET /api/instructeur/marketing/stats` — API retournant le funnel de conversion (pageViews, addToCarts, checkouts, purchases avec taux), paniers abandonnés (total, recovered, recoveryRate, recoveredRevenue), revenus par source, promotions flash actives/programmées
- [x] 9.2 Créer la page dashboard marketing `/(instructeur)/instructeur/marketing/page.tsx` — layout avec 4 sections : funnel visuel, stats paniers abandonnés, revenus par source (camembert), promotions flash (calendrier)
- [x] 9.3 Créer le composant `ConversionFunnel` — visualisation funnel en 4 étapes avec barres, nombres et taux de conversion entre chaque étape + comparaison mois précédent
- [x] 9.4 Créer le composant `AbandonedCartStats` — cards avec nombre abandonné, récupéré, taux, revenus récupérés + graphique 6 mois
- [x] 9.5 Créer le composant `RevenueBySource` — graphique camembert (ventes directes, via code promo, promotions flash, récupération paniers)
- [x] 9.6 Créer la section promotions flash dans le dashboard marketing — calendrier visuel avec promotions passées (résultats), actives (countdown), programmées + bouton "Nouvelle promotion flash"
- [x] 9.7 Ajouter le lien "Marketing" dans la sidebar instructeur entre "Statistiques" et "Paramètres"

## 10. Admin — Modération Produits & Analytics Marketing

- [x] 10.1 Créer `GET /api/admin/formations/produits` — liste des produits numériques pour l'admin (tous statuts) avec filtres
- [x] 10.2 Créer `POST /api/admin/formations/produits/approve/[id]` — approbation d'un produit (statut → ACTIF, email instructeur)
- [x] 10.3 Créer `POST /api/admin/formations/produits/reject/[id]` — rejet d'un produit avec motif (email instructeur)
- [x] 10.4 Créer la page admin produits numériques `/(admin)/admin/produits/page.tsx` — tableau avec titre, type, instructeur, prix, statut, actions (approuver, rejeter, archiver)
- [x] 10.5 Ajouter les stats produits numériques dans le dashboard admin (total produits, ventes, revenus) et le lien "Produits" dans la sidebar admin
- [x] 10.6 Ajouter les stats marketing dans le dashboard admin (paniers abandonnés plateforme, taux récupération global, paiements échoués)

## 11. Navigation, i18n & Intégration

- [x] 11.1 Ajouter les clés i18n dans fr.json et en.json pour : produits numériques (marketplace, détail, création, gestion), promotions flash, dashboard marketing, paniers abandonnés, pixels publicitaires, emails de relance
- [x] 11.2 Ajouter les routes `/produits/*` et `/instructeur/produits/*` et `/instructeur/marketing/*` dans le middleware avec les vérifications d'authentification appropriées
- [x] 11.3 Ajouter le lien "Produits numériques" dans le FormationsHeader (navigation publique) entre "Catégories" et "Devenir instructeur"
- [x] 11.4 Mettre à jour la page d'accueil formations pour inclure une section "Produits numériques populaires" sous les formations
- [x] 11.5 Ajouter les templates email dans `lib/email/formations.ts` : `sendDigitalProductDeliveryEmail`, `sendLicenseKeyEmail`, `sendAbandonedCartEmail`, `sendFailedPaymentEmail`, `sendDisputeNotificationEmail`

## 12. Tests & Vérification Finale

- [x] 12.1 Vérifier que le build TypeScript passe sans erreur (`npx tsc --noEmit`)
- [ ] 12.2 Tester le flux produit numérique : création → modération admin → marketplace → achat → téléchargement → aperçu filigrané
- [ ] 12.3 Tester le flux promotion flash : création promo → countdown visible → achat avec réduction → expiration automatique
- [ ] 12.4 Tester le flux panier abandonné : ajout panier → attente 1h+ → vérifier détection + email relance → conversion
- [ ] 12.5 Tester les pixels : configuration → vérifier injection script → vérifier événements (PageView, AddToCart, Purchase)
- [ ] 12.6 Tester le dashboard marketing instructeur : funnel, stats paniers, revenus par source, calendrier promos
- [ ] 12.7 Vérifier le responsive mobile sur toutes les nouvelles pages
