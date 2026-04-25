## ADDED Requirements

### Requirement: Liste des commandes avec assignation
La page commandes SHALL afficher toutes les commandes issues des services agence avec : référence, service, client, membre assigné, montant, statut, date.

#### Scenario: Affichage des commandes
- **WHEN** l'utilisateur accède à `/agence/commandes`
- **THEN** les commandes sont listées avec filtres par statut

### Requirement: Filtres par statut
Les commandes SHALL être filtrables par : Toutes, En cours, Livrées, En révision, Annulées.

#### Scenario: Filtrage par statut
- **WHEN** l'utilisateur clique sur "En cours"
- **THEN** seules les commandes en cours sont affichées

### Requirement: Assignation à un membre
Chaque commande SHALL permettre d'assigner ou réassigner un membre de l'équipe.

#### Scenario: Assignation réussie
- **WHEN** l'utilisateur sélectionne un membre et confirme
- **THEN** le membre est assigné et un toast est affiché
