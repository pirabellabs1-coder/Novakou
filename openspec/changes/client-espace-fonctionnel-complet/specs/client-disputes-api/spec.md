## ADDED Requirements

### Requirement: Disputes page SHALL display real disputes from API
La page `/client/litiges` SHALL charger les litiges depuis l'API avec filtres par statut (en cours, resolu, en attente).

#### Scenario: Affichage des litiges
- **WHEN** le client accede a `/client/litiges`
- **THEN** les litiges sont charges avec : commande concernee, categorie, statut, date d'ouverture, description

#### Scenario: Empty state litiges
- **WHEN** le client n'a aucun litige
- **THEN** un message "Aucun litige en cours" est affiche

### Requirement: Client SHALL be able to create a dispute
Le client SHALL pouvoir ouvrir un nouveau litige sur une commande en cours avec categorie, description et upload de preuves.

#### Scenario: Creer un litige
- **WHEN** le client remplit le formulaire (commande, categorie, description, fichiers) et clique "Ouvrir le litige"
- **THEN** le litige est cree via l'API, les fonds escrow sont geles, et le litige apparait dans la liste

### Requirement: Dispute detail SHALL show resolution timeline
Le detail d'un litige SHALL afficher une timeline des evenements (ouverture, reponses, verdict admin).

#### Scenario: Timeline de resolution
- **WHEN** le client consulte le detail d'un litige
- **THEN** une timeline chronologique affiche tous les evenements et echanges lies au litige
