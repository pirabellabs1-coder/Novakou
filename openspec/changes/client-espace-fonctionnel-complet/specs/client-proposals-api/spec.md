## ADDED Requirements

### Requirement: Proposals page SHALL display real proposals from API
La page `/client/propositions` SHALL charger les offres personnalisees recues depuis `GET /api/offres` avec filtres par statut.

#### Scenario: Affichage des propositions recues
- **WHEN** le client accede a `/client/propositions`
- **THEN** les offres personnalisees sont chargees avec : freelance/agence, description, montant, delai, statut

#### Scenario: Filtrer par statut
- **WHEN** le client selectionne le filtre "En attente"
- **THEN** seules les propositions avec statut "en_attente" sont affichees

### Requirement: Client SHALL be able to accept or reject proposals
Le client SHALL pouvoir accepter ou refuser une proposition recue.

#### Scenario: Accepter une proposition
- **WHEN** le client clique "Accepter" sur une proposition
- **THEN** l'API est appelee, le statut passe a "acceptee", et une commande est creee automatiquement

#### Scenario: Refuser une proposition
- **WHEN** le client clique "Refuser" sur une proposition
- **THEN** l'API est appelee et le statut passe a "refusee"

#### Scenario: Contacter le freelance avant decision
- **WHEN** le client clique "Contacter" sur une proposition
- **THEN** une conversation est ouverte ou redirigee vers la messagerie
