## ADDED Requirements

### Requirement: Instructor SHALL be able to create a sales funnel page for each formation
Le système DOIT permettre à chaque instructeur de créer une page de tunnel de vente personnalisée pour ses formations. Cette page DOIT être accessible publiquement via un slug unique.

#### Scenario: Accès au builder de tunnel de vente
- **WHEN** l'instructeur navigue vers `/instructeur/tunnel-de-vente`
- **THEN** une liste de ses formations DOIT s'afficher avec un bouton "Créer un tunnel" pour chacune

#### Scenario: Création d'un nouveau tunnel
- **WHEN** l'instructeur clique sur "Créer un tunnel" pour une formation
- **THEN** un éditeur de page drag-and-drop DOIT s'ouvrir avec des blocs par défaut (Hero + Pricing + CTA)

### Requirement: Sales funnel builder SHALL support drag-and-drop block editing
Le builder DOIT supporter l'ajout, la suppression, la réorganisation et l'édition de blocs via drag-and-drop.

#### Scenario: Ajout d'un bloc
- **WHEN** l'instructeur clique sur "Ajouter un bloc" dans le builder
- **THEN** une palette de blocs disponibles DOIT s'afficher (Hero, Texte, Image, Vidéo, Colonnes, Pricing, Témoignages, FAQ, CTA)

#### Scenario: Drag-and-drop pour réorganiser
- **WHEN** l'instructeur fait glisser un bloc vers une nouvelle position
- **THEN** le bloc DOIT se déplacer et l'ordre DOIT être sauvegardé

#### Scenario: Édition d'un bloc texte
- **WHEN** l'instructeur clique sur un bloc texte
- **THEN** un éditeur rich text DOIT s'ouvrir pour modifier le contenu

#### Scenario: Suppression d'un bloc
- **WHEN** l'instructeur clique sur le bouton de suppression d'un bloc
- **THEN** le bloc DOIT être supprimé après confirmation

### Requirement: Sales funnel SHALL support multiple block types
Le builder DOIT supporter les types de blocs suivants avec leurs options de personnalisation.

#### Scenario: Bloc Hero
- **WHEN** l'instructeur ajoute un bloc Hero
- **THEN** il DOIT pouvoir éditer le titre, le sous-titre, l'image de fond et le texte du bouton CTA

#### Scenario: Bloc Image
- **WHEN** l'instructeur ajoute un bloc Image
- **THEN** il DOIT pouvoir uploader une image ou saisir une URL, avec des options de taille (petite, moyenne, pleine largeur)

#### Scenario: Bloc Colonnes
- **WHEN** l'instructeur ajoute un bloc Colonnes
- **THEN** il DOIT pouvoir choisir 2 ou 3 colonnes et éditer le contenu de chaque colonne indépendamment

#### Scenario: Bloc Pricing
- **WHEN** l'instructeur ajoute un bloc Pricing
- **THEN** le prix de la formation DOIT être affiché automatiquement avec un bouton "Acheter maintenant"

#### Scenario: Bloc Témoignages
- **WHEN** l'instructeur ajoute un bloc Témoignages
- **THEN** il DOIT pouvoir ajouter des témoignages (nom, photo, texte, note)

#### Scenario: Bloc FAQ
- **WHEN** l'instructeur ajoute un bloc FAQ
- **THEN** il DOIT pouvoir ajouter des paires question/réponse en format accordion

#### Scenario: Bloc Vidéo
- **WHEN** l'instructeur ajoute un bloc Vidéo
- **THEN** il DOIT pouvoir saisir une URL YouTube ou Vimeo pour l'embed

### Requirement: Sales funnel page SHALL be publicly accessible
La page de tunnel de vente DOIT être accessible publiquement et servir de page d'atterrissage pour vendre la formation.

#### Scenario: Accès public à la page de vente
- **WHEN** un visiteur accède à `/vente/[slug]`
- **THEN** la page de vente DOIT s'afficher avec tous les blocs configurés par l'instructeur

#### Scenario: Bouton d'achat redirige vers le paiement
- **WHEN** un visiteur clique sur le bouton CTA (acheter) sur la page de vente
- **THEN** il DOIT être redirigé vers la page de paiement/inscription si non connecté, ou directement vers le checkout si connecté

### Requirement: Sales funnel data SHALL be persisted in database
Les données du tunnel de vente DOIVENT être stockées en base de données sous forme de blocs JSON.

#### Scenario: Sauvegarde automatique
- **WHEN** l'instructeur modifie un bloc dans le builder
- **THEN** les modifications DOIVENT être sauvegardées automatiquement (ou via bouton "Sauvegarder")

#### Scenario: Publication du tunnel
- **WHEN** l'instructeur clique sur "Publier"
- **THEN** la page de vente DOIT devenir accessible publiquement via son slug

#### Scenario: Prévisualisation avant publication
- **WHEN** l'instructeur clique sur "Prévisualiser"
- **THEN** un aperçu de la page de vente DOIT s'afficher dans un nouvel onglet
