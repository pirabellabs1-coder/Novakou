## ADDED Requirements

### Requirement: Agency disputes page SHALL display real disputes from API
La page litiges (`/agence/litiges`) MUST afficher la liste de tous les litiges de l'agence depuis l'API. Les filtres MUST inclure : ouverts, resolus, tous. Chaque litige MUST afficher une timeline complete des echanges.

#### Scenario: Liste des litiges depuis API
- **WHEN** un utilisateur agence accede a `/agence/litiges`
- **THEN** la liste affiche les litiges reels depuis l'API
- **THEN** un nouvel utilisateur voit une liste vide avec un message "Aucun litige"

#### Scenario: Filtres par statut
- **WHEN** un utilisateur filtre par "Ouverts"
- **THEN** seuls les litiges ouverts sont affiches

### Requirement: Agency disputes SHALL support evidence submission and messaging
Sur chaque litige, le systeme MUST afficher : messages echanges avec le client, fichiers soumis comme preuves (upload), decision admin (si rendue), statut (en cours / resolu / en faveur client / en faveur agence). Les actions de l'agence MUST inclure : soumettre des preuves (upload), envoyer un message, accepter la resolution, faire appel (si autorise).

#### Scenario: Soumettre des preuves
- **WHEN** un utilisateur upload des fichiers comme preuves dans un litige
- **THEN** les fichiers sont uploades via l'API et visibles par l'admin et le client

#### Scenario: Envoyer un message dans le litige
- **WHEN** un utilisateur envoie un message dans le litige
- **THEN** le message est sauvegarde et visible dans la timeline du litige

#### Scenario: Decision admin
- **WHEN** l'admin rend une decision sur le litige
- **THEN** la decision est visible sur la page du litige avec le verdict et les consequences
