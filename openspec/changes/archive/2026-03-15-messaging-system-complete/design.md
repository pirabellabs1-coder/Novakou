## Context

Le systeme de messagerie FreelanceHigh dispose actuellement de :
- **12 composants React** fonctionnels : `ChatPanel`, `ConversationList`, `MessageBubble`, `MessagingLayout`, `NewConversationDialog`, `AudioCallModal`, `VideoCallModal`, `CallControls`, `CommunicationSettings`, `IncomingCallPopup`, `VoiceRecorder`, `VoicePlayer`
- **Store Zustand** (`store/messaging.ts`) avec donnees demo et sync API partielle
- **API routes** : GET/POST conversations, GET/POST messages, POST read, POST signaling
- **WebRTC hook** (`useWebRTC`) pour appels audio/video
- **Pages messages** dans les 4 espaces : dashboard, client, agence, admin

Le code actuel fonctionne en mode demo (donnees en memoire) avec une couche API de base. Les fonctionnalites manquantes sont : edition/suppression de messages, upload de fichiers reel, apercu de liens, et notifications.

## Goals / Non-Goals

**Goals :**
- Permettre l'edition de messages dans les 15 minutes suivant l'envoi
- Permettre la suppression de messages dans les 10 minutes suivant l'envoi
- Implementer un upload de fichiers reel avec validation de type/taille et preview inline
- Lier automatiquement les fichiers partages aux ressources du projet/commande associe
- Ajouter des apercus automatiques pour les liens partages dans les messages
- Implementer les notifications in-app et email pour les evenements de messagerie
- Ameliorer les composants d'appels audio/video existants (stabilite, UX)
- Preparer l'architecture pour la migration vers Socket.io temps reel (V2)

**Non-Goals :**
- Messagerie temps reel via Socket.io (sera fait en V2 — actuellement HTTP polling)
- Traduction automatique des messages (V3)
- Chiffrement de bout en bout des messages (V3+)
- Messages ephemeres / disparaissants
- Reactions par emoji sur les messages (V2)
- Threads/reponses a un message specifique (V2)

## Decisions

### 1. Edition et suppression cote API (pas uniquement cote client)

**Choix :** Ajouter des endpoints `PUT /api/conversations/[id]/messages/[messageId]` (edition) et `DELETE /api/conversations/[id]/messages/[messageId]` (suppression) avec verification temporelle cote serveur.

**Pourquoi :** La verification temporelle doit etre faite cote serveur pour eviter la manipulation cote client. Le serveur compare `createdAt` avec `Date.now()` et rejette les requetes hors delai.

**Alternative rejetee :** Verification uniquement cote client — facilement contournable.

### 2. Upload de fichiers via Supabase Storage (pas Cloudinary)

**Choix :** Les fichiers partages dans les messages (documents, PDF, videos, archives) sont stockes dans un bucket Supabase Storage `message-attachments` (prive). Les images de preview (liens) sont stockees temporairement en cache Redis.

**Pourquoi :** Les fichiers de messagerie sont prives (echanges entre utilisateurs). Cloudinary est reserve aux images publiques (avatars, services). Supabase Storage avec RLS garantit que seuls les participants de la conversation peuvent acceder aux fichiers.

**Alternative rejetee :** Cloudinary pour tout — pas de RLS natif, pas adapte aux fichiers prives.

### 3. Apercu de liens via metadata extraction server-side

**Choix :** Quand un message contient un lien, une API route `/api/link-preview` extrait les tags OG (titre, description, image) et stocke le resultat en JSON dans le champ `linkPreviewData` du message. L'extraction est faite via un fetch server-side (pas de BullMQ au MVP pour simplifier).

**Pourquoi :** L'extraction OG cote client est bloquee par CORS. L'extraction server-side est fiable et permet de mettre en cache le resultat en DB.

**Alternative rejetee :** Job BullMQ asynchrone — ajoute de la complexite pour un cas simple. Le fetch OG prend <1s en general.

### 4. Notifications via le systeme existant (`/api/notifications`)

**Choix :** Les notifications de messagerie utilisent le meme endpoint `/api/notifications` que le reste de la plateforme. Le type de notification `new_message` est ajoute avec les metadonnees de la conversation.

**Pourquoi :** Eviter de creer un systeme de notification parallele. L'infrastructure existante gere deja le compteur dans la navbar et les preferences utilisateur.

### 5. Indicateur "modifie" stocke en DB (pas uniquement en store)

**Choix :** Ajouter un champ `editedAt: DateTime?` sur le modele `Message` Prisma. Si `editedAt` est non-null, l'UI affiche "modifie" a cote du timestamp.

**Pourquoi :** La persistance en DB garantit que l'indicateur est visible pour tous les participants, meme apres rechargement.

### 6. Suppression logique (soft delete)

**Choix :** La suppression remplace le contenu par "Ce message a ete supprime" et met `deletedAt: DateTime?` a la date actuelle. Le message reste dans la conversation mais son contenu est masque.

**Pourquoi :** La suppression physique creerait des trous dans l'historique de conversation et compliquerait le rendu des threads. Le soft delete preserve la timeline.

### 7. Fichiers messages lies aux ressources projet via `orderId`

**Choix :** Quand un fichier est envoye dans une conversation liee a une commande (`orderId` non null), le fichier est egalement reference dans la table `OrderResource` (ou equivalent) pour apparaitre dans la section ressources du projet.

**Pourquoi :** Les utilisateurs s'attendent a retrouver tous les fichiers d'un projet au meme endroit, que le fichier ait ete partage par chat ou uploade directement.

## Risks / Trade-offs

**[Upload de fichiers volumineux]** → Limitation a 25 MB par fichier. Les videos > 25 MB devront etre compressees avant upload. Message d'erreur clair cote client avec suggestion.

**[Apercu de liens lent]** → Si l'extraction OG prend > 3 secondes, le message est affiche sans apercu et l'apercu est ajoute en arriere-plan via un re-fetch. Timeout de 5 secondes sur le fetch server-side.

**[Suppression/edition apres envoi de notification]** → Si un utilisateur edite/supprime un message apres qu'une notification email a ete envoyee, le contenu de l'email ne sera pas mis a jour. Risque accepte — cas marginal.

**[Mode demo vs production]** → Le systeme actuel utilise `IS_DEV` pour switcher entre data-store en memoire et Prisma. Les nouveaux endpoints doivent supporter les deux modes pour ne pas casser le developpement local.

**[Performance des apercus de liens]** → L'extraction OG server-side ajoute de la latence a l'envoi du message. Mitigation : l'apercu est genere de maniere asynchrone apres l'envoi du message (le message apparait immediatement, l'apercu se charge ensuite).

## Migration Plan

1. Ajouter les champs `editedAt`, `deletedAt`, `fileUrl`, `fileType`, `fileSizeBytes`, `linkPreviewData` au modele `Message` dans `schema.prisma`
2. Executer `prisma migrate dev` pour generer la migration
3. Deployer les nouveaux endpoints API (PUT, DELETE messages, POST link-preview, POST upload)
4. Mettre a jour le store Zustand et les types partages
5. Mettre a jour les composants frontend (MessageBubble, ChatPanel)
6. Deployer en production

**Rollback :** Les nouveaux champs DB sont tous optionnels (nullable). Les nouveaux endpoints sont additifs. Le rollback consiste a deployer la version precedente du frontend — les donnees restent coherentes.

## Open Questions

- Faut-il limiter le nombre de fichiers par message (ex: max 5 fichiers) ou permettre un nombre illimite ?
- Faut-il ajouter un indicateur de saisie ("typing...") dans cette iteration ou le reporter a V2 (Socket.io) ?
- Faut-il supporter le drag-and-drop de fichiers dans le chat en plus du bouton d'upload ?
