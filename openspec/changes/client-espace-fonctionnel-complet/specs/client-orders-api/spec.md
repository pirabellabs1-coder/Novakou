## ADDED Requirements

### Requirement: Orders list SHALL fetch from API with status filters
La page `/client/commandes` SHALL charger les commandes depuis `GET /api/orders` avec filtres par statut (toutes, en cours, livrees, terminees, litige).

#### Scenario: Filtrer les commandes en cours
- **WHEN** le client selectionne le filtre "En cours"
- **THEN** seules les commandes avec statut "en_cours" sont affichees

#### Scenario: Empty state commandes
- **WHEN** le client n'a aucune commande
- **THEN** un message "Aucune commande" est affiche avec un CTA "Explorer les services"

### Requirement: Order detail page SHALL exist at /client/commandes/[id]
Le systeme SHALL fournir une page detail commande avec : en-tete (service, freelance, montant, statut), pipeline visuel des phases, chat integre, zone de livrables, boutons d'action.

#### Scenario: Affichage du pipeline de phases
- **WHEN** le client accede a `/client/commandes/[id]`
- **THEN** un pipeline visuel affiche les phases (commandee → en cours → livree → revision → terminee) avec la phase active mise en avant

#### Scenario: Valider une livraison
- **WHEN** le client clique "Valider la livraison"
- **THEN** l'API est appelee, les fonds escrow sont liberes, et le statut passe a "terminee"

#### Scenario: Demander une revision
- **WHEN** le client clique "Demander une revision" et ajoute un commentaire
- **THEN** l'API est appelee avec le commentaire, le statut passe a "revision", et le freelance est notifie

#### Scenario: Ouvrir un litige
- **WHEN** le client clique "Ouvrir un litige" et fournit une raison
- **THEN** l'API est appelee, le statut passe a "litige", et les fonds escrow sont geles

### Requirement: Order detail SHALL include integrated messaging
La page detail commande SHALL integrer un chat lie a la commande pour communiquer avec le freelance/agence.

#### Scenario: Envoyer un message dans la commande
- **WHEN** le client tape un message dans le chat et appuie sur Envoyer
- **THEN** le message est envoye via l'API et apparait dans la conversation
