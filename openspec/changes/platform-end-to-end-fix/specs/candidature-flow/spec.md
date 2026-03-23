## ADDED Requirements

### Requirement: Un freelance MUST pouvoir postuler à un projet ouvert
Le système SHALL permettre à un freelance authentifié de soumettre une candidature (`ProjectBid`) sur un projet avec status `ouvert`. La candidature MUST inclure un montant proposé, un délai, et une lettre de motivation.

#### Scenario: Freelance postule à un projet
- **WHEN** un freelance authentifié soumet une candidature sur un projet ouvert avec montant=1500, délai=14 jours, et une lettre de motivation
- **THEN** un `ProjectBid` est créé avec `status: "en_attente"`, `freelanceId` du freelance, `projectId` du projet, et les données soumises

#### Scenario: Freelance ne peut pas postuler deux fois
- **WHEN** un freelance tente de postuler à un projet sur lequel il a déjà une candidature
- **THEN** le système retourne une erreur 400 "Candidature déjà soumise"

#### Scenario: Freelance ne peut pas postuler à un projet fermé
- **WHEN** un freelance tente de postuler à un projet avec status différent de `ouvert`
- **THEN** le système retourne une erreur 400 "Projet non ouvert"

### Requirement: Le client MUST voir les candidatures reçues sur ses projets
Le système SHALL fournir un endpoint `GET /api/projects/[id]/bids` qui retourne les candidatures d'un projet avec les profils freelance enrichis. Seul le propriétaire du projet MUST pouvoir accéder à cet endpoint.

#### Scenario: Client consulte les candidatures d'un projet
- **WHEN** un client authentifié consulte les candidatures de son projet via `/client/projets/[id]`
- **THEN** le système affiche la liste des candidatures avec pour chacune : nom du freelance, avatar, note, montant proposé, délai, lettre de motivation, et statut

#### Scenario: Utilisateur non-propriétaire ne peut pas voir les candidatures
- **WHEN** un utilisateur qui n'est pas le propriétaire du projet tente d'accéder aux candidatures
- **THEN** le système retourne une erreur 403 "Accès refusé"

### Requirement: Le client MUST pouvoir accepter ou refuser une candidature
Le système SHALL fournir un endpoint `PATCH /api/candidatures/[id]` (ou `POST /api/candidatures/[id]/accept`) qui permet au client propriétaire du projet de changer le statut d'une candidature.

#### Scenario: Client accepte une candidature
- **WHEN** un client accepte une candidature
- **THEN** le statut de la candidature passe à `acceptee`, une commande est créée automatiquement, et le projet passe en status `pourvu`

#### Scenario: Client refuse une candidature
- **WHEN** un client refuse une candidature
- **THEN** le statut de la candidature passe à `refusee`, aucune commande n'est créée

### Requirement: Le freelance MUST voir ses candidatures et leur statut
Le système SHALL retourner la liste des candidatures d'un freelance via `GET /api/candidatures` avec le statut à jour de chacune.

#### Scenario: Freelance consulte ses candidatures
- **WHEN** un freelance authentifié accède à `/dashboard/candidatures`
- **THEN** le système affiche toutes ses candidatures avec pour chacune : titre du projet, montant proposé, délai, statut (en_attente/acceptee/refusee), et date de soumission
