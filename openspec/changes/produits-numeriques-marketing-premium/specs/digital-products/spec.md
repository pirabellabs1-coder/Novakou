## ADDED Requirements

### Requirement: Instructeur SHALL create digital products
Le système DOIT permettre aux instructeurs approuvés de créer des produits numériques (ebooks, PDFs, templates, licences logicielles) avec un wizard de création dédié. Un produit numérique comprend : titre (FR/EN), description riche (Tiptap), prix, bannière/couverture, fichier principal, catégorie, tags, et paramètres d'aperçu.

#### Scenario: Création d'un ebook avec aperçu
- **WHEN** un instructeur approuvé accède à `/instructeur/produits/creer` et remplit le formulaire (titre, description Tiptap, prix 29€, upload PDF 15MB, bannière, catégorie "Développement", aperçu activé avec 5 pages, filigrane activé)
- **THEN** le système crée un `DigitalProduct` avec statut `EN_ATTENTE`, stocke le fichier dans Supabase Storage bucket `digital-products`, génère un aperçu filigrané des 5 premières pages, et notifie l'admin pour modération

#### Scenario: Création d'une licence logicielle
- **WHEN** un instructeur crée un produit de type `LICENCE` avec nombre de clés max 100 et fichier ZIP
- **THEN** le système crée le produit avec `productType: LICENCE`, `maxBuyers: 100`, `currentBuyers: 0`, et prépare la génération automatique de clés uniques à chaque achat

#### Scenario: Upload fichier trop volumineux
- **WHEN** un instructeur tente d'uploader un fichier > 200MB
- **THEN** le système refuse l'upload avec le message "Taille maximale : 200 MB" et ne crée pas le produit

### Requirement: System SHALL store digital products in Prisma
Le système DOIT persister les produits numériques dans un modèle `DigitalProduct` avec les champs : id, slug, titleFr, titleEn, descriptionFr, descriptionEn, descriptionFormat, productType (EBOOK, PDF, TEMPLATE, LICENCE, AUDIO, VIDEO, AUTRE), price, originalPrice, isFree, bannière, fileUrl, fileStoragePath, fileSize, fileMimeType, previewEnabled, previewPages, watermarkEnabled, maxBuyers, currentBuyers, status (BROUILLON, EN_ATTENTE, ACTIF, ARCHIVE), instructeurId, categoryId, tags, rating, reviewsCount, salesCount, viewsCount, createdAt, updatedAt.

#### Scenario: Schéma Prisma validé
- **WHEN** le schéma Prisma est migré
- **THEN** la table `DigitalProduct` existe avec toutes les colonnes et relations vers InstructeurProfile et FormationCategory, et les index sur slug, status, instructeurId, categoryId

### Requirement: Buyer SHALL purchase digital products
Le système DOIT permettre aux utilisateurs authentifiés d'acheter des produits numériques via Stripe Checkout. Après paiement confirmé, un enregistrement `DigitalProductPurchase` est créé avec la clé de licence (si type LICENCE), et l'email de livraison est envoyé.

#### Scenario: Achat réussi d'un ebook
- **WHEN** un utilisateur achète un ebook à 29€ et le paiement Stripe est confirmé via webhook
- **THEN** le système crée un `DigitalProductPurchase` (userId, productId, paidAmount, stripeSessionId), incrémente `salesCount` et `currentBuyers`, envoie l'email de livraison avec le lien de téléchargement sécurisé, et crédite 70% à l'instructeur

#### Scenario: Achat d'un produit avec stock épuisé
- **WHEN** un utilisateur tente d'acheter un produit dont `currentBuyers >= maxBuyers`
- **THEN** le système affiche "Ce produit n'est plus disponible" et bloque le checkout

#### Scenario: Achat d'une licence
- **WHEN** un utilisateur achète un produit de type LICENCE
- **THEN** le système génère une clé de licence unique (format `FH-XXXX-XXXX-XXXX`), la stocke dans `DigitalProductPurchase.licenseKey`, et l'envoie par email

### Requirement: Buyer SHALL download purchased products securely
Le système DOIT fournir un téléchargement sécurisé via URL signée Supabase Storage avec expiration de 24h. Les téléchargements sont comptabilisés et limités à 5 par achat.

#### Scenario: Téléchargement du fichier acheté
- **WHEN** un acheteur accède à `/api/produits/[id]/download` avec un achat valide
- **THEN** le système génère une URL signée Supabase Storage (expiration 24h), incrémente `downloadCount`, et redirige vers l'URL signée

#### Scenario: Limite de téléchargements atteinte
- **WHEN** un acheteur a déjà téléchargé 5 fois
- **THEN** le système retourne une erreur 403 "Nombre maximum de téléchargements atteint. Contactez le support."

### Requirement: Public SHALL preview digital products with watermark
Le système DOIT permettre aux visiteurs de prévisualiser un produit numérique si l'instructeur a activé l'aperçu. L'aperçu est limité aux N premières pages du PDF avec un filigrane "APERÇU - FreelanceHigh" en diagonale sur chaque page.

#### Scenario: Aperçu filigrané d'un ebook
- **WHEN** un visiteur accède à `/api/produits/[id]/preview` et que le produit a `previewEnabled: true, previewPages: 5, watermarkEnabled: true`
- **THEN** le système retourne un PDF contenant les 5 premières pages avec le filigrane "APERÇU - FreelanceHigh" en gris semi-transparent en diagonale sur chaque page

#### Scenario: Aperçu désactivé par le vendeur
- **WHEN** un visiteur accède à l'aperçu d'un produit avec `previewEnabled: false`
- **THEN** le système retourne une erreur 404 "Aperçu non disponible pour ce produit"

### Requirement: Instructeur SHALL manage digital products
Le système DOIT fournir une page de gestion des produits numériques à `/instructeur/produits` avec liste, statistiques (ventes, revenus, vues), et actions (modifier, archiver, dupliquer).

#### Scenario: Liste des produits avec statistiques
- **WHEN** un instructeur accède à sa page produits
- **THEN** le système affiche la liste de ses produits avec pour chacun : titre, type, prix, ventes, revenus, stock restant (si limité), statut, et actions

### Requirement: Admin SHALL moderate digital products
Le système DOIT permettre aux admins d'approuver, rejeter ou archiver les produits numériques depuis l'espace admin formations. La modération suit le même flux que les formations (EN_ATTENTE → ACTIF ou rejeté avec motif).

#### Scenario: Admin approuve un produit numérique
- **WHEN** un admin approuve un produit en attente
- **THEN** le statut passe à `ACTIF`, le produit apparaît dans la marketplace, et l'instructeur reçoit un email de confirmation

### Requirement: Public SHALL browse digital products marketplace
Le système DOIT afficher les produits numériques dans une section dédiée de la marketplace accessible à `/produits` avec filtres (catégorie, prix, type, note), tri, et pagination.

#### Scenario: Exploration de la marketplace produits
- **WHEN** un visiteur accède à `/produits`
- **THEN** le système affiche une grille de produits numériques actifs avec bannière, titre, prix, type, note, nombre de ventes, badge "Stock limité" si applicable, et badge "Aperçu disponible" si aperçu activé

#### Scenario: Page détail produit numérique
- **WHEN** un visiteur accède à `/produits/[slug]`
- **THEN** le système affiche : bannière, titre, description riche (Tiptap rendu), prix (barré si promo), type de produit, instructeur, avis, bouton "Aperçu gratuit" (si activé), bouton "Acheter", compteur stock restant (si limité), countdown promo (si active)
