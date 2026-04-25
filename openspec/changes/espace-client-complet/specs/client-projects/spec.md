## ADDED Requirements

### Requirement: Projects list page SHALL display filterable project cards
La page `/client/projets` SHALL afficher la liste des projets du client avec filtres par statut (Tous, Actif, Terminé, Brouillon), une barre de recherche, et un bouton "Nouveau Projet". Chaque projet affiche : titre, client, progression (barre + pourcentage), statut (badge coloré), date d'échéance, budget.

#### Scenario: Filtrage par statut
- **WHEN** l'utilisateur clique sur le filtre "Actif"
- **THEN** seuls les projets avec statut "Actif" sont affichés

#### Scenario: Création nouveau projet
- **WHEN** l'utilisateur clique sur "Nouveau Projet"
- **THEN** il est redirigé vers `/client/projets/nouveau`

### Requirement: Project creation wizard SHALL have 4 steps
La page `/client/projets/nouveau` SHALL afficher un wizard de 4 étapes conforme à la maquette `client_project_posting_wizard` :
- Étape 1 (Détails) : Titre du projet, catégorie principale (dropdown), deadline (date picker), description détaillée (textarea)
- Étape 2 (Catégorie) : Expertise requise, sous-catégories
- Étape 3 (Budget) : Type (Prix Fixe / Taux Horaire toggle), montant estimé, devise
- Étape 4 (Révision) : Compétences requises (tags input), prévisualisation, confirmation

#### Scenario: Navigation entre étapes
- **WHEN** l'utilisateur remplit l'étape 1 et clique "Étape Suivante"
- **THEN** le stepper gauche avance à l'étape 2 et la barre de progression passe à 50%

#### Scenario: Sauvegarde en brouillon
- **WHEN** l'utilisateur clique "Sauvegarder en brouillon" à n'importe quelle étape
- **THEN** un toast de confirmation s'affiche et le projet est sauvegardé localement

### Requirement: Wizard SHALL display left stepper panel
Le panneau gauche du wizard SHALL afficher la progression : 4 étapes numérotées (Détails, Catégorie, Budget, Révision), l'étape active surlignée en vert avec bordure gauche, et une barre de progression en bas (25% par étape). Un encart "Conseil d'expert" avec une ampoule SHALL donner un conseil contextuel.

#### Scenario: Stepper visuel
- **WHEN** l'utilisateur est à l'étape 1
- **THEN** "Détails" est surligné en vert, les autres étapes sont grisées, la barre affiche 25%

### Requirement: Wizard SHALL display right visibility preview
Le panneau droit du wizard SHALL afficher "Aperçu de la visibilité" avec : une portée estimée (barre segmentée + indicateur "Haute"), un résumé du projet (budget, délai, public), et un encart "Besoin d'aller plus vite ?" avec bouton "Promouvoir mon projet".

#### Scenario: Mise à jour dynamique de l'aperçu
- **WHEN** l'utilisateur modifie le budget dans le formulaire
- **THEN** le résumé dans le panneau droit se met à jour en temps réel

### Requirement: Skills tag input SHALL allow adding and removing tags
Le champ "Compétences requises" SHALL permettre d'ajouter des tags en tapant puis Entrée, et de les supprimer en cliquant sur l'icône X. Les tags s'affichent en pills vertes arrondies.

#### Scenario: Ajout d'un tag
- **WHEN** l'utilisateur tape "React" et appuie sur Entrée
- **THEN** un pill "React ×" vert apparaît dans le champ

#### Scenario: Suppression d'un tag
- **WHEN** l'utilisateur clique sur le × d'un tag
- **THEN** le tag est retiré de la liste
