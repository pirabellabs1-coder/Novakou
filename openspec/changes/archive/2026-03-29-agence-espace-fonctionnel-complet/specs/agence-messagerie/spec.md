## ADDED Requirements

### Requirement: Agency messaging SHALL be identical to freelance messaging
La messagerie de l'espace agence (`/agence/messages`) MUST etre identique en fonctionnalites a la messagerie de l'espace freelance. Le layout MUST etre plein ecran sans titre de page. Les composants partages (`ChatPanel`, `ConversationList`, `MessageBubble`, `MessagingLayout`) MUST etre reutilises.

#### Scenario: Layout messagerie identique au freelance
- **WHEN** un utilisateur agence accede a `/agence/messages`
- **THEN** la messagerie s'affiche en plein ecran avec la liste des conversations a gauche et le chat a droite

#### Scenario: Etat vide pour nouvel utilisateur
- **WHEN** un nouvel utilisateur agence accede a la messagerie
- **THEN** un etat vide s'affiche avec le message "Aucun message pour le moment"

### Requirement: Agency messaging SHALL support text, files, voice messages, and calls
La messagerie MUST supporter : messages texte en temps reel (Socket.io), upload fichiers et images, messages vocaux (MediaRecorder), appels audio WebRTC, appels video WebRTC, partage d'ecran, statut lu/non lu, recherche dans les conversations, et conversations liees aux commandes.

#### Scenario: Envoi de message texte en temps reel
- **WHEN** un utilisateur agence envoie un message texte
- **THEN** le message est envoye via Socket.io et apparait immediatement chez le destinataire

#### Scenario: Upload de fichier dans le chat
- **WHEN** un utilisateur agence uploade un fichier dans le chat
- **THEN** le fichier est uploade via l'API et un lien de telechargement apparait dans la conversation

#### Scenario: Message vocal
- **WHEN** un utilisateur agence enregistre et envoie un message vocal
- **THEN** le message audio est enregistre via MediaRecorder, uploade, et le destinataire peut l'ecouter

#### Scenario: Appel audio/video WebRTC
- **WHEN** un utilisateur agence lance un appel audio ou video
- **THEN** une connexion WebRTC est etablie entre les deux parties
- **THEN** le partage d'ecran est disponible pendant l'appel video

#### Scenario: Statut lu/non lu
- **WHEN** un destinataire ouvre une conversation
- **THEN** les messages non lus sont marques comme lus via l'API `/api/conversations/[id]/read`

#### Scenario: Conversations liees aux commandes
- **WHEN** une conversation est liee a une commande
- **THEN** un lien vers la commande est affiche dans l'en-tete de la conversation
