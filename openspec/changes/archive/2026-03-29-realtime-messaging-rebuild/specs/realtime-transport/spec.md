## Purpose

Couche de transport temps réel pour la messagerie FreelanceHigh. Gère la connexion WebSocket (Socket.io) entre le frontend (Next.js/Vercel) et le backend (Fastify/Railway), avec authentification JWT, rooms par conversation, reconnexion automatique, et fallback polling HTTP.

## ADDED Requirements

### Requirement: Socket.io server setup on Fastify
Le serveur Fastify (`apps/api`) SHALL exposer un endpoint Socket.io avec CORS configuré pour le domaine frontend. Le serveur SHALL utiliser l'adaptateur Redis (`@socket.io/redis-adapter`) pour supporter le scaling horizontal multi-instances.

#### Scenario: Server starts with Socket.io
- **WHEN** le serveur Fastify démarre
- **THEN** Socket.io est attaché au serveur HTTP et écoute les connexions WebSocket

#### Scenario: CORS configured for frontend origin
- **WHEN** un client Socket.io tente de se connecter depuis le domaine frontend (localhost:3000 en dev, freelancehigh.com en prod)
- **THEN** la connexion est acceptée avec les headers CORS appropriés

### Requirement: JWT authentication on WebSocket handshake
Chaque connexion Socket.io SHALL être authentifiée via un JWT Supabase Auth envoyé dans le handshake `auth.token`. Le serveur MUST vérifier le JWT et extraire `userId` et `role` avant d'accepter la connexion.

#### Scenario: Valid JWT connection
- **WHEN** un client se connecte avec un JWT valide dans `auth.token`
- **THEN** la connexion est acceptée et le socket est associé à `userId` et `role`

#### Scenario: Invalid or expired JWT
- **WHEN** un client se connecte avec un JWT invalide, expiré, ou absent
- **THEN** la connexion est refusée avec l'erreur `authentication_error`

#### Scenario: Token refresh during session
- **WHEN** le JWT expire pendant une session Socket.io active
- **THEN** le client se déconnecte et se reconnecte avec un nouveau JWT sans perte de messages (les messages non reçus sont récupérés via API REST au reconnect)

### Requirement: Room management per conversation
Chaque conversation SHALL avoir une room Socket.io nommée `conversation:{conversationId}`. Les participants d'une conversation MUST être joints à la room correspondante.

#### Scenario: User joins conversation rooms on connect
- **WHEN** un utilisateur se connecte via Socket.io
- **THEN** le serveur récupère toutes ses conversations (via Prisma `ConversationUser`) et joint le socket à chaque room `conversation:{id}`

#### Scenario: User joins new conversation room
- **WHEN** une nouvelle conversation est créée impliquant l'utilisateur
- **THEN** le socket de l'utilisateur est automatiquement joint à la room `conversation:{newId}`

#### Scenario: Messages broadcast to room only
- **WHEN** un message est envoyé dans une conversation
- **THEN** l'événement `message:new` est broadcasté uniquement aux sockets dans la room `conversation:{id}`, pas à tous les clients connectés

### Requirement: Automatic reconnection with state recovery
Le client Socket.io SHALL gérer la reconnexion automatique en cas de perte de connexion. Après reconnexion, le client MUST récupérer les messages manqués via l'API REST.

#### Scenario: Network disconnection and reconnection
- **WHEN** la connexion WebSocket est interrompue (perte réseau, serveur restart)
- **THEN** le client tente de se reconnecter automatiquement avec backoff exponentiel (1s, 2s, 4s, max 30s)

#### Scenario: State recovery after reconnection
- **WHEN** le client se reconnecte après une déconnexion
- **THEN** le client appelle `GET /api/conversations` pour synchroniser l'état et récupérer les messages reçus pendant la déconnexion

### Requirement: Fallback polling when WebSocket unavailable
Le frontend SHALL détecter l'échec de la connexion WebSocket et activer un polling HTTP automatique comme fallback.

#### Scenario: WebSocket connection fails
- **WHEN** la connexion Socket.io échoue après 3 tentatives
- **THEN** le client active un polling HTTP toutes les 3 secondes sur les API REST conversations et messages

#### Scenario: WebSocket restored after polling
- **WHEN** la connexion Socket.io est rétablie après une période de polling
- **THEN** le polling est désactivé et le client revient au mode temps réel WebSocket

### Requirement: Online presence tracking
Le serveur SHALL tracker les utilisateurs connectés via Socket.io et broadcaster les changements de statut online/offline.

#### Scenario: User goes online
- **WHEN** un utilisateur se connecte via Socket.io
- **THEN** l'événement `user:online` avec `{ userId, online: true }` est émis aux rooms des conversations de cet utilisateur

#### Scenario: User goes offline
- **WHEN** un utilisateur se déconnecte (déconnexion explicite ou timeout)
- **THEN** l'événement `user:online` avec `{ userId, online: false }` est émis après un délai de 5 secondes (pour éviter les faux offline lors de reconnexions rapides)
