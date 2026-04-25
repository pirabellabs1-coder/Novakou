## ADDED Requirements

### Requirement: Recherche de freelances externes
La page sous-traitance SHALL afficher une liste de freelances disponibles avec filtres : compétences, note, tarif, disponibilité.

#### Scenario: Recherche de freelance
- **WHEN** l'utilisateur filtre par compétence "React"
- **THEN** seuls les freelances avec React sont affichés

### Requirement: Missions sous-traitées
Un onglet SHALL lister les missions en cours avec le freelance externe, le statut, le montant et la marge agence.

#### Scenario: Affichage des missions
- **WHEN** l'utilisateur clique sur "Missions en cours"
- **THEN** les missions sous-traitées sont listées avec marge calculée

### Requirement: Passer une commande externe
Un bouton SHALL permettre de passer commande à un freelance externe avec : description, budget, deadline.

#### Scenario: Commande passée
- **WHEN** l'utilisateur soumet le formulaire de commande
- **THEN** un toast de succès est affiché
