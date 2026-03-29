## Why

La messagerie actuelle de FreelanceHigh est cassée en profondeur : les messages envoyés ne sont pas reçus par l'autre utilisateur, il n'y a aucun temps réel (seulement un polling 30s), l'UI est instable (IDs techniques visibles, input parfois invisible), et le système repose sur un data-store JSON en mode dev sans transition fiable vers Prisma. Pour une plateforme de freelancing où la communication vendeur-client est critique (suivi commandes, négociation, livraison), une messagerie non fonctionnelle bloque toute la chaîne de valeur. Ce rebuild est nécessaire **maintenant** car c'est un prérequis MVP — aucun utilisateur ne peut collaborer sans messagerie fiable.

**Version cible : MVP** (avec architecture extensible pour V2 — Socket.io complet)

## What Changes

- **Refonte complète du backend messagerie** : remplacement du data-store JSON par des API routes Prisma fiables avec validation, accès contrôlé, et gestion d'erreurs
- **Ajout du temps réel** : implémentation Socket.io sur le serveur Fastify existant (`apps/api`) avec fallback polling 3s côté frontend
- **Refonte du store Zustand** : remplacement de la logique locale par une synchronisation API-first avec optimistic updates et réconciliation
- **Correction de l'UI chat** : suppression des IDs techniques affichés, input toujours visible (fixed bottom), bulles gauche/droite correctes, header avec avatar/nom/statut
- **Statuts de livraison des messages** : envoyé → reçu → lu avec indicateurs visuels (checks simples/doubles)
- **Notifications et badges** : compteur non-lu fiable dans la navbar, notification toast sur nouveau message
- **Gestion d'erreurs et retry** : messages non envoyés détectés avec retry automatique, état "échec" visible
- **Mark as read** : marquage automatique à l'ouverture d'une conversation + événement temps réel pour mettre à jour les checks

**Impact sur les autres rôles :** Les 4 espaces (Freelance, Client, Agence, Admin) utilisent la même `MessagingLayout` — tous bénéficient du fix. L'admin conserve sa vue "toutes les conversations".

**Infrastructure requise :**
- Handler Socket.io dans `apps/api/src/socket/` pour les événements messagerie
- Adaptateur Redis Socket.io pour la scalabilité horizontale (déjà prévu dans l'architecture)
- Pas de nouveau job BullMQ nécessaire au MVP (les notifications push sont V4)
- Pas de nouveau template email nécessaire (le template "Nouveau message reçu" existe déjà)

## Capabilities

### New Capabilities
- `realtime-transport`: Couche de transport temps réel Socket.io avec authentification JWT, rooms par conversation, et fallback polling. Gère la connexion/déconnexion, la reconnexion automatique, et le broadcast d'événements (message.new, message.read, typing).
- `message-delivery`: Pipeline complet d'envoi/réception de messages : validation, persistance Prisma, broadcast Socket.io, statuts de livraison (sending → sent → delivered → read), retry automatique en cas d'échec.
- `chat-ui`: Interface chat moderne type WhatsApp : header conversation (avatar, nom, statut), bulles messages gauche/droite, input fixé en bas toujours visible, suppression des IDs techniques, affichage des noms utilisateurs et références commandes.

### Modified Capabilities
<!-- Aucune capability existante modifiée au niveau des requirements — c'est une refonte complète des capabilities messaging qui n'avaient pas de specs formelles -->

## Impact

**Code affecté :**
- `apps/web/store/messaging.ts` — refonte complète du store (API-first au lieu de local-first)
- `apps/web/components/messaging/*` — corrections UI (ChatPanel, MessageBubble, ConversationList, MessagingLayout)
- `apps/web/app/api/conversations/**` — refonte des API routes (suppression mode dev, Prisma only)
- `apps/api/src/socket/` — nouveau handler Socket.io pour la messagerie
- `apps/web/lib/socket-client.ts` — nouveau client Socket.io côté frontend

**Schéma Prisma :**
- Table `Message` : pas de changement structurel, les champs `read`, `type`, `content` existent déjà
- Table `ConversationUser` : le champ `lastReadAt` existe déjà pour le tracking de lecture
- Potentiel ajout d'un champ `deliveredAt` sur `Message` pour distinguer "reçu" de "lu"

**APIs modifiées :**
- `GET /api/conversations` — réponse normalisée, plus de mode dev
- `POST /api/conversations/[id]/messages` — émission événement Socket.io après persistance
- `POST /api/conversations/[id]/read` — émission événement Socket.io pour mettre à jour les checks chez l'expéditeur

**Dépendances :**
- `socket.io-client` (frontend) — à ajouter dans `apps/web`
- `socket.io` (backend) — déjà dans l'architecture prévue pour `apps/api`
- `@socket.io/redis-adapter` — pour la scalabilité horizontale
