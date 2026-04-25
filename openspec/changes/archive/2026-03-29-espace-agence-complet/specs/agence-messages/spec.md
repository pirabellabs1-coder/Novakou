## ADDED Requirements

### Requirement: Messagerie avec canaux et conversations
La page messages SHALL afficher une interface de messagerie avec 2 sections : canaux internes (par projet) et conversations clients.

#### Scenario: Affichage de la messagerie
- **WHEN** l'utilisateur accède à `/agence/messages`
- **THEN** la liste des conversations est affichée à gauche et le chat actif à droite

### Requirement: Envoi de messages
L'utilisateur SHALL pouvoir envoyer des messages texte dans une conversation avec un champ de saisie et un bouton d'envoi.

#### Scenario: Envoi réussi
- **WHEN** l'utilisateur tape un message et appuie sur Entrée ou clique Envoyer
- **THEN** le message est ajouté à la conversation

### Requirement: Conversations liées aux projets
Chaque canal interne SHALL être lié à un projet agence avec le nom du projet comme titre.

#### Scenario: Ouverture d'un canal projet
- **WHEN** l'utilisateur clique sur un canal projet
- **THEN** les messages du canal sont affichés avec les participants
