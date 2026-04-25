## Purpose

Pipeline complet d'envoi, réception et suivi des messages dans FreelanceHigh. Couvre la validation, la persistance Prisma, le broadcast Socket.io, les statuts de livraison (sending → sent → delivered → read), le retry automatique, et le marquage de lecture.

## ADDED Requirements

### Requirement: Send message via API with Socket.io broadcast
L'envoi d'un message SHALL passer par l'API REST `POST /api/conversations/{id}/messages`, persister en base Prisma, puis broadcaster via Socket.io à la room de la conversation.

#### Scenario: Successful message send
- **WHEN** un utilisateur envoie un message avec `{ content: "Bonjour", type: "text" }`
- **THEN** le message est créé en base Prisma avec `senderId`, `conversationId`, `content`, `type`, `createdAt`, puis l'événement `message:new` est émis à la room `conversation:{id}`

#### Scenario: Message with file attachment
- **WHEN** un utilisateur envoie un message avec `{ content: "Voir le fichier", type: "file", fileUrl, fileName, fileType, fileSizeBytes }`
- **THEN** le message est persisté avec toutes les métadonnées fichier et broadcasté avec le même payload

#### Scenario: Invalid message rejected
- **WHEN** un utilisateur envoie un message avec `content` vide ou sans `conversationId` valide
- **THEN** l'API retourne HTTP 400 avec un message d'erreur explicite

#### Scenario: Unauthorized sender rejected
- **WHEN** un utilisateur tente d'envoyer un message dans une conversation dont il n'est pas participant
- **THEN** l'API retourne HTTP 403

### Requirement: Optimistic update on message send
Le store Zustand côté client SHALL afficher le message immédiatement avec le statut "sending" avant la confirmation serveur.

#### Scenario: Message appears instantly for sender
- **WHEN** l'utilisateur clique "Envoyer"
- **THEN** le message apparaît dans la conversation avec un indicateur "sending" (icône horloge) avant que l'API ne réponde

#### Scenario: Status updates to "sent" after API response
- **WHEN** l'API retourne HTTP 201 avec le message créé
- **THEN** le statut du message passe de "sending" à "sent" (icône check simple)

#### Scenario: Message marked as failed on error
- **WHEN** l'API retourne une erreur (réseau, 500, timeout)
- **THEN** le message est marqué avec le statut "failed" et un bouton "Réessayer" apparaît

### Requirement: Real-time message reception
Les destinataires connectés via Socket.io SHALL recevoir les nouveaux messages instantanément sans polling.

#### Scenario: Recipient receives message via Socket.io
- **WHEN** un message est broadcasté via `message:new` à la room `conversation:{id}`
- **THEN** le store Zustand du destinataire ajoute le message à la conversation et l'affiche dans l'UI

#### Scenario: Recipient not on messaging page
- **WHEN** un message arrive via Socket.io et le destinataire n'est pas sur la page messagerie
- **THEN** le compteur de messages non lus dans la navbar est incrémenté et un toast notification apparaît

#### Scenario: Multiple recipients in group/order conversation
- **WHEN** un message est envoyé dans une conversation avec 3+ participants
- **THEN** tous les participants connectés reçoivent le message simultanément

### Requirement: Message delivery status tracking
Chaque message SHALL avoir un statut de livraison qui progresse : `sending` → `sent` → `delivered` → `read`.

#### Scenario: Status progression for sent message
- **WHEN** un message est envoyé par User A
- **THEN** le statut évolue : "sending" (POST en cours) → "sent" (API 201 reçu) → "delivered" (destinataire connecté reçoit l'event) → "read" (destinataire ouvre la conversation)

#### Scenario: Visual indicators for each status
- **WHEN** un message a le statut "sending"
- **THEN** une icône horloge grise est affichée
- **WHEN** un message a le statut "sent"
- **THEN** une icône check simple grise est affichée
- **WHEN** un message a le statut "delivered"
- **THEN** une icône double check grise est affichée
- **WHEN** un message a le statut "read"
- **THEN** une icône double check bleue est affichée

### Requirement: Mark conversation as read with broadcast
Marquer une conversation comme lue SHALL mettre à jour `ConversationUser.lastReadAt` et broadcaster l'événement aux autres participants.

#### Scenario: Auto-mark read when opening conversation
- **WHEN** un utilisateur ouvre (ou est déjà sur) une conversation
- **THEN** `POST /api/conversations/{id}/read` est appelé, `lastReadAt` est mis à jour, et l'événement `message:read` est broadcasté à la room

#### Scenario: Sender sees read receipt
- **WHEN** le destinataire ouvre la conversation et le `message:read` event arrive chez l'expéditeur
- **THEN** tous les messages de l'expéditeur dans cette conversation passent au statut "read" (double check bleu)

### Requirement: Automatic retry on send failure
Les messages en échec SHALL être réessayés automatiquement, avec possibilité de retry manuel.

#### Scenario: Automatic retry after network error
- **WHEN** l'envoi d'un message échoue à cause d'une erreur réseau
- **THEN** le client réessaie automatiquement après 2 secondes, puis 5 secondes, puis abandonne et affiche "Échec"

#### Scenario: Manual retry by user
- **WHEN** un message est au statut "failed" et l'utilisateur clique "Réessayer"
- **THEN** le message est renvoyé avec le même contenu et le statut repasse à "sending"

### Requirement: Unread count accuracy
Le compteur de messages non lus SHALL être basé sur `ConversationUser.lastReadAt` comparé aux `Message.createdAt` des messages non envoyés par l'utilisateur.

#### Scenario: Accurate unread count per conversation
- **WHEN** la liste des conversations est affichée
- **THEN** chaque conversation affiche le nombre de messages reçus après `lastReadAt` de l'utilisateur courant

#### Scenario: Navbar badge total
- **WHEN** l'utilisateur a des messages non lus dans 3 conversations (2 + 1 + 5)
- **THEN** le badge navbar affiche "8"

#### Scenario: Count updates in real-time
- **WHEN** un nouveau message arrive via Socket.io dans une conversation non ouverte
- **THEN** le compteur non lu de cette conversation et le badge navbar s'incrémentent immédiatement

### Requirement: Prisma-only persistence (no dev mode)
Toutes les opérations de messagerie SHALL utiliser Prisma exclusivement. Le mode dev JSON (`conversationStore` dans `data-store.ts`) MUST être supprimé.

#### Scenario: API routes use Prisma
- **WHEN** une requête est faite à `GET /api/conversations`
- **THEN** les données sont lues depuis Prisma/Postgres, jamais depuis le fichier JSON

#### Scenario: No IS_DEV branching
- **WHEN** le code API est inspecté
- **THEN** il n'y a aucun `if (IS_DEV)` ou équivalent dans les routes de messagerie
