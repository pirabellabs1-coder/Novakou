## 1. Setup & Dépendances

- [x] 1.1 Installer `socket.io` dans `apps/api` et `socket.io-client` dans `apps/web`, et `@socket.io/redis-adapter` dans `apps/api`
- [x] 1.2 Ajouter les variables d'environnement nécessaires : `NEXT_PUBLIC_SOCKET_URL` (URL du serveur Fastify), vérifier `REDIS_URL` existant
- [x] 1.3 Vérifier que le schéma Prisma existant (`Conversation`, `ConversationUser`, `Message`) est complet — ajouter le champ `deliveredAt DateTime?` sur `Message` si absent

## 2. Backend Socket.io — Transport temps réel

- [x] 2.1 Créer `apps/api/src/socket/index.ts` : setup Socket.io sur le serveur Fastify avec CORS configuré (origins: localhost:3000 + domaine prod), adaptateur Redis via `@socket.io/redis-adapter`
- [x] 2.2 Créer le middleware d'authentification Socket.io : extraire le JWT du handshake `auth.token`, vérifier avec Supabase Auth, associer `userId` et `role` au socket
- [x] 2.3 Créer `apps/api/src/socket/messaging.ts` : handler `conversation:join` — à la connexion, récupérer toutes les conversations de l'utilisateur via Prisma et joindre les rooms `conversation:{id}`
- [x] 2.4 Implémenter l'émission d'événements dans les handlers : `message:new`, `message:read`, `message:edited`, `message:deleted` — chaque handler broadcast à la room appropriée
- [x] 2.5 Créer `apps/api/src/socket/presence.ts` : tracker les connexions/déconnexions, émettre `user:online` avec délai de 5s pour le offline (éviter les faux-offline sur reconnexion rapide)

## 3. API Routes — Prisma uniquement

- [x] 3.1 Refactorer `apps/web/app/api/conversations/route.ts` (GET) : supprimer le branchement `IS_DEV`, utiliser Prisma exclusivement, inclure les relations `users.user`, `messages` (dernier message), calculer `unreadCount` basé sur `ConversationUser.lastReadAt`
- [x] 3.2 Refactorer `apps/web/app/api/conversations/route.ts` (POST) : créer la conversation via Prisma avec les `ConversationUser` entries, déduplication des conversations directes existantes, supprimer le code JSON store
- [x] 3.3 Refactorer `apps/web/app/api/conversations/[id]/messages/route.ts` (GET) : Prisma uniquement, inclure `sender` (firstName, lastName, avatar), ordonner par `createdAt asc`, marquer `read=true` pour les messages non-envoyés par l'utilisateur courant
- [x] 3.4 Refactorer `apps/web/app/api/conversations/[id]/messages/route.ts` (POST) : Prisma create + validation Zod + vérifier que l'utilisateur est participant + après persistance, appeler le serveur Socket.io pour émettre `message:new` à la room (via appel HTTP interne ou import direct si même process)
- [x] 3.5 Refactorer `apps/web/app/api/conversations/[id]/read/route.ts` (POST) : mettre à jour `ConversationUser.lastReadAt`, mettre à jour `Message.read = true` pour les messages non-lus, émettre `message:read` via Socket.io
- [x] 3.6 Refactorer `apps/web/app/api/conversations/[id]/messages/[messageId]/route.ts` (PUT/DELETE) : Prisma uniquement, émettre `message:edited` / `message:deleted` via Socket.io après modification
- [x] 3.7 Supprimer les imports et le code du `conversationStore` (data-store.ts) des routes de messagerie, supprimer le flag `IS_DEV` dans ces routes

## 4. Client Socket.io — Connexion frontend

- [x] 4.1 Créer `apps/web/lib/socket-client.ts` : singleton Socket.io client, connexion avec JWT Supabase dans `auth.token`, reconnexion automatique avec backoff exponentiel, events `connect`, `disconnect`, `connect_error`
- [x] 4.2 Créer `apps/web/lib/socket-provider.tsx` : React Context `SocketProvider` qui wrap les pages messagerie, expose `socket` et `isConnected`, gère le lifecycle (connect au mount, disconnect au unmount)
- [x] 4.3 Intégrer le `SocketProvider` dans le `MessagingLayout.tsx` : wrapper le layout avec le provider, passer la connexion socket au store

## 5. Store Zustand — Refonte API-first

- [x] 5.1 Refondre `apps/web/store/messaging.ts` : supprimer les données de démo, supprimer les auto-replies, rendre le store purement réactif (pas de logique métier, juste de l'état)
- [x] 5.2 Implémenter `syncFromApi()` : appel `GET /api/conversations`, mapper la réponse vers le format du store, mettre à jour `conversations[]` avec unread counts calculés
- [x] 5.3 Implémenter `sendMessage()` avec optimistic update : ajouter le message localement avec status "sending", appeler `POST /api/conversations/{id}/messages`, mettre à jour le status à "sent" sur succès, "failed" sur erreur
- [x] 5.4 Implémenter les listeners Socket.io dans le store : `message:new` (ajouter le message à la conversation), `message:read` (mettre à jour les statuts des messages envoyés), `message:edited`, `message:deleted`, `user:online`
- [x] 5.5 Implémenter le retry automatique : queue de messages "pending" qui se vide à la reconnexion, retry après 2s puis 5s en cas d'erreur, état "failed" après 2 tentatives
- [x] 5.6 Implémenter le fallback polling : détecter quand Socket.io est déconnecté, activer un `setInterval` 3s pour appeler `syncFromApi()`, désactiver quand Socket.io se reconnecte

## 6. UI Chat — Corrections

- [x] 6.1 Corriger `ChatPanel.tsx` : s'assurer que l'input est `fixed` en bas (position sticky ou fixed dans le container flex), toujours visible quel que soit le scroll, placeholder "Écrire un message..."
- [x] 6.2 Corriger `ConversationList.tsx` : afficher `participant.firstName + " " + participant.lastName` au lieu de l'ID, afficher `Commande #${order.orderNumber || order.id.slice(-6)}` pour les conversations de commande, afficher le vrai `unreadCount`
- [x] 6.3 Corriger `MessageBubble.tsx` : implémenter les icônes de statut de livraison (horloge pour sending, check simple pour sent, double check gris pour delivered, double check bleu pour read), afficher le nom de l'expéditeur dans les conversations de groupe
- [x] 6.4 Corriger le header de conversation dans `ChatPanel.tsx` : afficher avatar + nom complet + rôle + indicateur online (point vert), pas d'ID technique visible
- [x] 6.5 Ajouter l'état "failed" sur les messages : bouton "Réessayer" (icône ↻) à côté du message, icône d'erreur rouge, handler `onClick` qui appelle `retryMessage()`
- [x] 6.6 Ajouter les toasts de notification : quand un `message:new` arrive et que l'utilisateur n'est pas dans cette conversation, afficher un toast avec le nom de l'expéditeur et un extrait du message
- [x] 6.7 Corriger `MessagingLayout.tsx` : intégrer `SocketProvider`, appeler `syncFromApi()` au mount, écouter les events Socket.io, gérer la transition mobile (liste ↔ chat)
- [x] 6.8 Ajouter les états de chargement : skeletons dans la liste des conversations pendant le chargement, spinner dans le chat pendant le chargement des messages, état vide "Aucune conversation" avec illustration

## 7. Badges & Notifications navbar

- [x] 7.1 Corriger `MessagesBadge.tsx` dans la navbar : calculer le total non lu depuis le store Zustand (somme des `unreadCount` de toutes les conversations), mettre à jour en temps réel quand le store change
- [x] 7.2 S'assurer que le badge se met à jour instantanément quand un `message:new` arrive via Socket.io (pas d'attente de polling)

## 8. Tests & Validation

- [x] 8.1 Tester le flux complet en mode Prisma : User A envoie → message en DB → broadcast Socket.io → User B reçoit → B répond → A reçoit
- [x] 8.2 Tester le fallback polling : couper Socket.io → vérifier que le polling 3s récupère les messages → reconnecter → vérifier que le polling s'arrête
- [x] 8.3 Tester la responsivité mobile : vérifier le layout à 375px (conversation list full width → chat full width avec bouton retour), input toujours visible, pas de scroll caché
- [x] 8.4 Tester les cas d'erreur : envoyer un message avec réseau coupé → vérifier que le statut "failed" apparaît → reconnecter → vérifier que le retry fonctionne
- [x] 8.5 Vérifier qu'aucun ID technique n'est visible dans l'UI (conversation list, chat header, message bubbles, toasts)
