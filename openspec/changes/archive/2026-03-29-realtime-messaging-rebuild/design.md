## Context

FreelanceHigh dispose d'un système de messagerie partiellement implémenté avec :
- Un store Zustand local-first (`store/messaging.ts`) qui contient des données de démo et des auto-replies
- Des API routes dual-mode (dev JSON store vs Prisma) dans `app/api/conversations/`
- Un schéma Prisma complet (`Conversation`, `ConversationUser`, `Message`) avec les bons champs
- Une UI riche (ChatPanel, MessageBubble, ConversationList) avec support fichiers, voix, appels
- **Aucun temps réel** — uniquement un polling 30s via `syncFromApi()` dans le store
- **Messages non délivrés** — le pipeline d'envoi a des race conditions et ne broadcast pas aux destinataires
- **IDs techniques visibles** dans l'UI (CUIDs bruts comme `cmn3oijdi0002...`)

L'architecture cible prévoit Socket.io sur Fastify (`apps/api`) avec adaptateur Redis. Le frontend est sur Vercel (Next.js). Les 4 rôles (Freelance, Client, Agence, Admin) partagent `MessagingLayout`.

## Goals / Non-Goals

**Goals :**
- Messages envoyés arrivent instantanément chez le destinataire (< 500ms)
- Statuts de livraison fiables : sending → sent → delivered → read
- UI stable : pas d'IDs techniques, input toujours visible, bulles correctes
- Fallback polling si WebSocket indisponible (dégradation gracieuse)
- Architecture scalable (Redis adapter Socket.io, rooms par conversation)
- Fonctionne sur les 4 espaces sans duplication de code

**Non-Goals :**
- Messagerie de groupe (V2 — l'infrastructure le supporte mais l'UI n'est pas dans le scope)
- Typing indicators temps réel (V2 — préparé côté événements mais pas implémenté UI)
- Notifications push navigateur (V4 — PWA service worker)
- Chiffrement end-to-end (hors scope)
- Appels audio/vidéo WebRTC (déjà implémentés séparément, non touchés)
- Migration des données de démo — le store JSON dev est abandonné

## Decisions

### D1 — Socket.io sur Fastify (apps/api) comme transport principal

**Choix :** Socket.io côté serveur sur le Fastify existant dans `apps/api/`, avec client Socket.io dans `apps/web`.

**Alternatives considérées :**
- **Supabase Realtime** : déjà utilisé pour les statuts commandes, mais ne supporte pas les events customs complexes (typing, delivery receipts) et impose le format Postgres changes. Trop limité pour le chat.
- **Polling seul** : simple mais latence 2-3s incompatible avec l'expérience "WhatsApp" demandée.
- **Server-Sent Events** : unidirectionnel, pas adapté au chat bidirectionnel.

**Rationale :** Socket.io est déjà dans l'architecture prévue (ARCHITECTURE.md), supporte les rooms (1 room = 1 conversation), la reconnexion automatique, et l'adaptateur Redis pour scaler horizontalement. Le serveur Fastify existe déjà dans `apps/api/`.

### D2 — API-first avec optimistic updates (pas local-first)

**Choix :** Le store Zustand ne fait que refléter l'état serveur. L'envoi d'un message fait un POST API, le serveur persiste et broadcast via Socket.io, le store reçoit l'événement et se met à jour. L'optimistic update affiche le message immédiatement côté expéditeur avec status "sending".

**Alternatives considérées :**
- **Local-first (état actuel)** : le store gère tout localement et sync en background. Cause des inconsistances (message visible chez A mais pas chez B), et le store contient des données de démo mélangées avec les vraies données.

**Rationale :** Pour une messagerie, la source de vérité doit être le serveur. L'optimistic update donne l'illusion d'instantanéité côté expéditeur, et Socket.io garantit la réception côté destinataire.

### D3 — Rooms Socket.io par conversation (pas par utilisateur)

**Choix :** Chaque conversation a une room Socket.io `conversation:{conversationId}`. Quand un utilisateur ouvre une conversation, il rejoint la room. Les messages sont broadcastés à la room.

**Alternatives considérées :**
- **Room par utilisateur** : `user:{userId}` — le serveur doit savoir quelle conversation est active chez chaque client pour router. Plus complexe, pas d'avantage.
- **Pas de rooms, broadcast global** : chaque client filtre les messages pertinents. Gaspillage de bande passante et problèmes de confidentialité.

**Rationale :** Le pattern room-per-conversation est le standard Socket.io pour le chat. Chaque participant rejoint les rooms de ses conversations au connect. Quand un message arrive, il est broadcasté à la room, et seuls les participants le reçoivent.

### D4 — Suppression du mode dev JSON, Prisma uniquement

**Choix :** Supprimer le flag `IS_DEV` et le `conversationStore` JSON. Toutes les API routes utilisent Prisma exclusivement. En développement, on utilise la base Supabase locale (ou dev) avec des seeds.

**Alternatives considérées :**
- **Garder le dual-mode** : maintenabilité impossible, source de bugs (le mode dev ne broadcast pas Socket.io).

**Rationale :** Le dual-mode est la cause principale des bugs actuels. Les messages sont sauvés en JSON mais pas broadcastés, les auto-replies polluent l'expérience, et la logique est dupliquée.

### D5 — Fallback polling côté client (pas côté serveur)

**Choix :** Le client Socket.io tente une connexion WebSocket. Si elle échoue ou se déconnecte, le client active un polling HTTP toutes les 3s sur `GET /api/conversations` et `GET /api/conversations/[id]/messages`.

**Rationale :** Le polling est une dégradation gracieuse gérée côté client. Le serveur ne change pas — il broadcast toujours via Socket.io ET persiste en DB. Le client peut toujours lire depuis l'API REST.

### D6 — Noms utilisateurs et références commandes au lieu des IDs

**Choix :** Le frontend affiche toujours `user.firstName + user.lastName` pour les participants, et `Commande #${order.orderNumber}` pour les conversations liées à une commande. Jamais d'ID CUID affiché.

**Rationale :** Les API retournent déjà les relations `user` et `order` — il suffit de s'assurer que le frontend les utilise au lieu de l'ID brut.

## Architecture technique

### Flux d'envoi d'un message

```
1. User A tape un message et clique Envoyer
2. Store Zustand : optimistic update (message avec status="sending")
3. POST /api/conversations/{id}/messages { content, type }
4. Serveur API :
   a. Valide l'input (Zod)
   b. Vérifie que l'utilisateur est participant (Prisma)
   c. Crée le Message en DB (Prisma)
   d. Émet Socket.io event `message:new` à la room `conversation:{id}`
   e. Retourne le message créé (HTTP 201)
5. Client A : reçoit la réponse HTTP → update status "sent"
6. Client B : reçoit l'event Socket.io `message:new` → ajoute au store → affiche
7. Client B ouvre la conversation → POST /api/conversations/{id}/read
8. Serveur émet `message:read` à la room → Client A update status "read"
```

### Événements Socket.io

| Event | Direction | Payload | Déclencheur |
|-------|-----------|---------|-------------|
| `message:new` | server → clients | `{ message, conversationId }` | Nouveau message persisté |
| `message:read` | server → clients | `{ conversationId, userId, readAt }` | Conversation marquée lue |
| `message:edited` | server → clients | `{ conversationId, messageId, content }` | Message modifié |
| `message:deleted` | server → clients | `{ conversationId, messageId }` | Message supprimé |
| `conversation:join` | client → server | `{ conversationIds[] }` | Connexion initiale |
| `user:online` | server → clients | `{ userId, online }` | Connexion/déconnexion |

### Structure des fichiers (nouveaux/modifiés)

```
apps/api/src/
├── socket/
│   ├── index.ts              # Setup Socket.io sur Fastify + auth middleware
│   ├── messaging.ts          # Handlers message:new, message:read, etc.
│   └── presence.ts           # Tracking online/offline
│
apps/web/
├── lib/
│   ├── socket-client.ts      # Client Socket.io singleton + reconnexion
│   └── socket-provider.tsx   # React Context pour distribuer la connexion
├── store/
│   └── messaging.ts          # REFONTE — API-first, écoute Socket.io events
├── components/messaging/
│   ├── MessagingLayout.tsx   # MODIFIÉ — intègre SocketProvider, sync API au mount
│   ├── ChatPanel.tsx         # MODIFIÉ — input fixed, noms au lieu des IDs
│   ├── MessageBubble.tsx     # MODIFIÉ — delivery status icons fiables
│   └── ConversationList.tsx  # MODIFIÉ — unread count basé sur lastReadAt
└── app/api/conversations/
    ├── route.ts              # MODIFIÉ — Prisma only, plus de mode dev
    └── [id]/messages/route.ts # MODIFIÉ — emit Socket.io après persistance
```

## Risks / Trade-offs

**[Socket.io cross-origin Vercel ↔ Railway]** → Le frontend (Vercel) doit se connecter au WebSocket sur Railway. Configurer CORS explicitement sur le serveur Socket.io. En production, utiliser un sous-domaine `api.freelancehigh.com` pour éviter les problèmes de mixed content.

**[Reconnexion après perte réseau]** → Socket.io gère la reconnexion automatique, mais les messages envoyés pendant la déconnexion sont perdus si pas de retry. → Le store implémente une queue de messages "pending" qui se vide à la reconnexion.

**[Consistance entre HTTP et Socket.io]** → Un message est persisté via HTTP mais broadcasté via Socket.io. Si Socket.io tombe, les messages sont quand même en DB et récupérables via polling. → Pas de perte de données, juste un délai de réception.

**[Performance avec beaucoup de rooms]** → Chaque utilisateur rejoint N rooms (1 par conversation). Pour un utilisateur avec 50 conversations, ça fait 50 rooms au connect. → Acceptable pour Socket.io avec Redis adapter. À monitorer à >10K utilisateurs simultanés.

**[Suppression du mode dev]** → Les développeurs devront avoir une DB Supabase locale ou de développement. → Créer un seed script Prisma pour les données de test.

## Migration Plan

1. **Phase 1 — Backend Socket.io** : Setup Socket.io sur Fastify, handlers basiques, auth JWT
2. **Phase 2 — API routes Prisma-only** : Supprimer le mode dev, normaliser les réponses, émettre events
3. **Phase 3 — Client Socket.io** : Provider React, connexion, écoute events
4. **Phase 4 — Store refonte** : API-first, optimistic updates, réception events Socket.io
5. **Phase 5 — UI fixes** : Noms au lieu des IDs, input fixed, delivery status icons
6. **Phase 6 — Fallback polling** : Détection déconnexion, polling 3s, réconciliation
7. **Phase 7 — Tests end-to-end** : User A envoie → User B reçoit → B répond → A reçoit

**Rollback :** Chaque phase est indépendante. Si Socket.io pose problème, le fallback polling fonctionne seul (phase 6 sans phases 1-3). L'API REST est toujours la source de vérité.

## Open Questions

- **Authentification Socket.io** : utiliser le JWT Supabase Auth directement dans le handshake, ou créer un token spécifique ? → Recommandation : JWT Supabase Auth, vérifié côté serveur Fastify.
- **Rate limiting Socket.io** : limiter les envois de messages par WebSocket pour éviter le spam ? → Recommandation : 1 message/s par utilisateur côté serveur, avec throttle visible côté UI.
- **Seed data** : créer un script `prisma db seed` pour remplacer le `conversations.json` de démo ? → Recommandation : oui, indispensable pour le développement local.
