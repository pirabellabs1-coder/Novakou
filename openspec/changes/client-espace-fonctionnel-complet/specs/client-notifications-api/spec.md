## ADDED Requirements

### Requirement: Notifications page SHALL fetch from API
La page `/client/notifications` SHALL charger les notifications depuis `GET /api/notifications` avec filtres par type et mark-as-read.

#### Scenario: Affichage des notifications
- **WHEN** le client accede a `/client/notifications`
- **THEN** les notifications sont chargees et affichees par ordre chronologique avec type (message, paiement, projet, systeme)

#### Scenario: Marquer comme lu
- **WHEN** le client clique sur une notification non lue
- **THEN** l'API est appelee pour la marquer comme lue et le compteur de notifications non lues diminue

#### Scenario: Filtrer par type
- **WHEN** le client selectionne le filtre "Paiements"
- **THEN** seules les notifications de type "paiement" sont affichees

### Requirement: Notification preferences SHALL be saved via API
Les preferences de notification (email, push, par type d'evenement) SHALL etre chargees et sauvegardees via l'API.

#### Scenario: Modifier une preference
- **WHEN** le client desactive les notifications push pour les "projets"
- **THEN** la preference est sauvegardee via l'API et prise en compte immediatement
