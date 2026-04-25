## ADDED Requirements

### Requirement: Projects list SHALL fetch from API with filters
La page `/client/projets` SHALL charger les projets depuis `GET /api/projects` avec filtres par statut (tous, actifs, termines, brouillons) et pagination.

#### Scenario: Affichage des projets filtres
- **WHEN** le client selectionne le filtre "Actifs"
- **THEN** seuls les projets avec statut "actif" sont affiches depuis l'API

#### Scenario: Empty state sans projets
- **WHEN** le client n'a aucun projet
- **THEN** un message "Aucun projet" est affiche avec un CTA "Publier votre premier projet"

### Requirement: Project creation wizard SHALL submit to API
Le wizard `/client/projets/nouveau` SHALL soumettre le projet via `POST /api/projects` avec validation Zod des champs obligatoires.

#### Scenario: Creation reussie d'un projet
- **WHEN** le client remplit les 4 etapes du wizard et clique "Publier"
- **THEN** le projet est envoye a l'API, une notification toast confirme la creation, et le client est redirige vers `/client/projets`

#### Scenario: Erreur de validation
- **WHEN** le client soumet un projet sans titre
- **THEN** un message d'erreur s'affiche sous le champ titre

### Requirement: Project detail SHALL show real candidatures
La page `/client/projets/[id]` SHALL charger le projet et ses candidatures depuis l'API et permettre d'accepter, refuser ou contacter un candidat.

#### Scenario: Accepter une candidature
- **WHEN** le client clique "Accepter" sur une candidature
- **THEN** l'API est appelee, le statut de la candidature passe a "acceptee", et le freelance est notifie

#### Scenario: Refuser une candidature
- **WHEN** le client clique "Refuser" sur une candidature
- **THEN** l'API est appelee et le statut passe a "refusee"

### Requirement: Client SHALL be able to delete or edit a project
Le client SHALL pouvoir supprimer un projet en brouillon ou modifier un projet actif.

#### Scenario: Suppression d'un projet brouillon
- **WHEN** le client clique "Supprimer" sur un projet en brouillon
- **THEN** une confirmation est demandee, puis le projet est supprime via l'API
