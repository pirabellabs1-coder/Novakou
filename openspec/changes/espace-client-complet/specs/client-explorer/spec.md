## ADDED Requirements

### Requirement: Explorer page SHALL display project offers with horizontal cards
La page `/client/freelances` (explorateur) SHALL afficher les offres de projets sous forme de cards horizontales conformes à la maquette `explorateur_d_offres_de_projets`. Chaque card contient : image gauche (w-64), titre du projet, budget en vert (ex: "200 000 FCFA" converti en EUR), description (2 lignes max), tags de compétences en pills arrondies, métadonnées (durée, localisation, nombre de propositions), bouton "Postuler" vert.

#### Scenario: Affichage de la liste d'offres
- **WHEN** l'utilisateur accède à `/client/freelances`
- **THEN** les offres s'affichent en liste verticale avec des cards horizontales contenant image, titre, budget, description, tags et bouton d'action

### Requirement: Explorer SHALL have advanced filter bar
La barre de filtres SHALL contenir des pills/dropdowns horizontaux : Budget, Catégorie, Pays, Type de contrat. Un bouton "Effacer les filtres" permet de réinitialiser. Le header affiche "Explorateur d'Offres" en titre large avec un bouton "Actualiser".

#### Scenario: Filtrage par catégorie
- **WHEN** l'utilisateur sélectionne une catégorie dans le dropdown
- **THEN** seules les offres correspondant à cette catégorie sont affichées

#### Scenario: Effacer les filtres
- **WHEN** l'utilisateur clique "Effacer les filtres"
- **THEN** tous les filtres sont réinitialisés et toutes les offres sont affichées

### Requirement: Explorer SHALL support pagination
La pagination SHALL afficher des boutons numérotés (1-12 avec ellipsis), des flèches précédent/suivant, et le bouton actif en fond vert `#19e642`.

#### Scenario: Navigation par page
- **WHEN** l'utilisateur clique sur le bouton page 2
- **THEN** la page 2 est surlignée en vert et les offres correspondantes s'affichent

### Requirement: Project cards SHALL show urgent badge
Les projets urgents SHALL afficher un badge "URGENT" en fond vert sur l'image du projet.

#### Scenario: Affichage badge urgent
- **WHEN** un projet a le flag urgent activé
- **THEN** un badge "URGENT" vert s'affiche en overlay sur l'image du projet

### Requirement: Explorer SHALL show demo data in EUR
Les données de démo SHALL inclure au minimum 3 projets : "Développement Application Mobile E-commerce" (305€, 30 jours, Sénégal, 12 propositions), "Design Logo & Charte Graphique" (76€, 7 jours, Côte d'Ivoire, 5 propositions), "Rédaction de Contenus SEO - Blog Tech" (130€, 15 jours, France, 8 propositions).

#### Scenario: Montants en EUR
- **WHEN** la page se charge
- **THEN** tous les budgets sont affichés en EUR (€) par défaut
