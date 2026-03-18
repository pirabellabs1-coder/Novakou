## ADDED Requirements

### Requirement: Admin SHALL pouvoir gérer toutes les cohortes de la plateforme
Une nouvelle page `/formations/admin/cohorts` SHALL lister toutes les cohortes avec : nom, formation associée, instructeur, nombre d'inscrits/max, date de début, statut (PLANNING/ACTIVE/CLOSED), taux de complétion.

#### Scenario: Affichage de la liste des cohortes
- **WHEN** l'admin accède à `/formations/admin/cohorts`
- **THEN** un tableau affiche toutes les cohortes triées par date de début (plus récente en premier)

#### Scenario: Filtrage par statut
- **WHEN** l'admin sélectionne un filtre de statut (Toutes, En planification, Active, Fermée)
- **THEN** le tableau n'affiche que les cohortes correspondant au statut sélectionné

#### Scenario: Recherche de cohorte
- **WHEN** l'admin tape dans le champ de recherche
- **THEN** les cohortes sont filtrées par nom, formation ou instructeur (recherche client-side)

### Requirement: Admin SHALL pouvoir voir les détails d'une cohorte
En cliquant sur une cohorte, l'admin SHALL voir la liste des participants avec leur progression, le chat de la cohorte en lecture seule, et les statistiques de la cohorte.

#### Scenario: Vue détail cohorte
- **WHEN** l'admin clique sur une cohorte dans la liste
- **THEN** une vue modale ou expandable affiche : liste des participants (nom, email, progression %), statistiques (taux complétion, messages échangés, dernière activité), et le nombre de messages dans le chat

### Requirement: Admin SHALL pouvoir fermer une cohorte
L'admin SHALL pouvoir fermer manuellement une cohorte active, ce qui empêche de nouvelles inscriptions mais permet aux participants existants de continuer.

#### Scenario: Fermeture de cohorte
- **WHEN** l'admin clique sur "Fermer la cohorte" et confirme
- **THEN** le statut de la cohorte passe à CLOSED, l'action est enregistrée dans le journal d'audit, et l'instructeur est notifié

### Requirement: API admin cohortes SHALL exposer les données
L'API `GET /api/admin/formations/cohorts` SHALL retourner la liste paginée des cohortes avec statistiques.

#### Scenario: Appel API cohortes
- **WHEN** un admin authentifié appelle `GET /api/admin/formations/cohorts?status=ACTIVE&page=1`
- **THEN** la réponse contient `{ cohorts[], total, totalPages }` avec les relations formation et instructeur incluses

#### Scenario: Fermeture API
- **WHEN** un admin authentifié appelle `PUT /api/admin/formations/cohorts/[id]` avec `{ status: "CLOSED" }`
- **THEN** la cohorte est mise à jour et un audit log est créé
