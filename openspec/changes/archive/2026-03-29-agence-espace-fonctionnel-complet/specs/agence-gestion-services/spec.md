## ADDED Requirements

### Requirement: Agency services page SHALL display real statistics from API
La page de gestion des services (`/agence/services`) MUST afficher en haut 4 cartes statistiques calculees depuis l'API : total services, services actifs, CA total services, taux de conversion moyen. La liste des services MUST provenir de l'API `/api/services` filtree par l'agence.

#### Scenario: Statistiques services depuis API
- **WHEN** un utilisateur agence accede a `/agence/services`
- **THEN** les 4 cartes affichent des valeurs calculees depuis l'API
- **THEN** un nouvel utilisateur voit toutes les valeurs a 0 et une liste vide

#### Scenario: Chaque service affiche ses metriques
- **WHEN** la liste des services est affichee
- **THEN** chaque service montre : thumbnail, titre, badge statut (actif/en pause/en attente/refuse), categorie, prix EUR, tags, vues, commandes, CA, taux de conversion, membre assigne (si applicable)

### Requirement: Agency services page SHALL have functional filters
Les filtres MUST permettre de filtrer par statut : Tous, Actifs, En pause, En attente, Refuses. Le filtre MUST mettre a jour la liste instantanement.

#### Scenario: Filtre par statut
- **WHEN** un utilisateur selectionne le filtre "Actifs"
- **THEN** seuls les services avec le statut "actif" sont affiches

### Requirement: Agency services CRUD actions SHALL be fully functional
Chaque service MUST avoir les actions suivantes : Modifier (ouvre le wizard 7 etapes pre-rempli), Pauser (toggle statut via API), Dupliquer (cree une copie brouillon), Supprimer (dialogue de confirmation + suppression via API).

#### Scenario: Modifier un service
- **WHEN** un utilisateur clique sur "Modifier" sur un service
- **THEN** le wizard 7 etapes s'ouvre avec tous les champs pre-remplis avec les donnees actuelles du service

#### Scenario: Pauser un service
- **WHEN** un utilisateur clique sur "Pauser" sur un service actif
- **THEN** le statut du service passe a "en_pause" via l'API `/api/services/[id]/toggle`
- **THEN** le service disparait du feed public

#### Scenario: Dupliquer un service
- **WHEN** un utilisateur clique sur "Dupliquer"
- **THEN** une copie du service est creee en brouillon avec le prefixe "Copie de" dans le titre

#### Scenario: Supprimer un service
- **WHEN** un utilisateur clique sur "Supprimer" et confirme dans le dialogue
- **THEN** le service est supprime de la base de donnees via l'API
