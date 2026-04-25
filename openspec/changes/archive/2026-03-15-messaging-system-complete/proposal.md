## Why

Le systeme de messagerie actuel dispose d'une base fonctionnelle (envoi de messages texte, messages vocaux, appels audio/video, liste de conversations), mais il manque des fonctionnalites essentielles pour une utilisation professionnelle en production : edition et suppression de messages, partage de fichiers enrichi avec integration aux ressources projet, apercu de liens, notifications, et robustesse des appels. Ces lacunes empechent les utilisateurs (freelances, clients, agences) de collaborer efficacement sur la plateforme.

Version cible : **MVP/V1** (messagerie transactionnelle) avec preparation pour **V2** (messagerie temps reel Socket.io).

## What Changes

### Messages enrichis
- Edition de messages dans un delai de 15 minutes apres envoi, avec indicateur "modifie"
- Suppression de messages dans un delai de 10 minutes apres envoi
- Apercu automatique des liens partages (titre, description, image OG)
- Indicateurs de lecture/livraison visibles (envoye → livre → lu)

### Partage de fichiers ameliore
- Upload de fichiers avec validation de type et taille (images, documents, PDF, videos, archives — max 25 MB)
- Preview inline des images et videos dans le chat
- Fichiers partages en message automatiquement lies aux ressources du projet/commande associe
- Barre de progression d'upload visible

### Messages vocaux
- Verification et amelioration du VoiceRecorder et VoicePlayer existants
- Upload reel via API route (remplacement du `URL.createObjectURL` de demo)
- Transcription optionnelle affichee sous le message vocal

### Appels audio et video
- Verification et stabilisation du systeme WebRTC existant (useWebRTC hook, signaling API)
- Amelioration des indicateurs d'etat d'appel (sonnerie, connexion, reconnexion)
- Historique des appels dans la conversation (duree, type, manque)

### Notifications de messagerie
- Notification in-app temps reel pour nouveau message, fichier partage, appel recu
- Notification email optionnelle pour messages non lus (configurable par l'utilisateur)
- Badge de compteur de messages non lus dans la navigation

## Capabilities

### New Capabilities
- `message-editing`: Edition et suppression de messages avec contraintes temporelles (15 min edition, 10 min suppression) et indicateur "modifie"
- `file-sharing-enhanced`: Partage de fichiers enrichi avec validation, preview inline, barre de progression, et synchronisation avec les ressources projet
- `messaging-notifications`: Notifications in-app et email pour les evenements de messagerie (nouveau message, fichier, appel)
- `link-preview`: Apercu automatique des liens partages dans les messages (titre, description, image OG)

### Modified Capabilities
<!-- Pas de specs existantes a modifier — le systeme de messagerie n'a pas encore de specs formelles -->

## Impact

### Impact sur les autres roles
- **Freelance** (`/dashboard/messages`) : toutes les nouvelles fonctionnalites
- **Client** (`/client/messages`) : toutes les nouvelles fonctionnalites
- **Agence** (`/agence/messages`) : toutes les nouvelles fonctionnalites + messagerie interne equipe
- **Admin** (`/admin/messages`) : supervision des conversations, pas d'edition/suppression

### Code impacte
- **Composants messaging** : `ChatPanel.tsx`, `MessageBubble.tsx`, `MessagingLayout.tsx`, `ConversationList.tsx`
- **Store Zustand** : `store/messaging.ts` — ajout de champs `editedAt`, `deletedAt`, `fileUrl`, `linkPreview` sur `UnifiedMessage`
- **API routes** : `/api/conversations/[id]/messages` — ajout PUT (edition) et DELETE (suppression), `/api/upload/file` — validation renforcee
- **Composants appels** : `calls/AudioCallModal.tsx`, `calls/VideoCallModal.tsx` — amelioration UX
- **Composants vocaux** : `voice/VoiceRecorder.tsx`, `voice/VoicePlayer.tsx` — upload reel

### Impact sur le schema Prisma
- Table `Message` : ajout colonnes `editedAt`, `deletedAt`, `fileUrl`, `fileType`, `fileSizeBytes`, `linkPreviewData` (JSON)
- Aucune nouvelle table requise — les messages sont deja stockes via Prisma avec relation `Conversation`

### Jobs BullMQ necessaires
- Job `send-message-notification-email` : email pour messages non lus apres 5 minutes
- Job `generate-link-preview` : extraction metadata OG pour les liens dans les messages

### Handlers Socket.io necessaires (preparation V2)
- `message:new` — broadcast du nouveau message aux participants
- `message:edit` — broadcast de l'edition
- `message:delete` — broadcast de la suppression
- `typing:start` / `typing:stop` — indicateurs de saisie

### Templates email necessaires
- `new-message-notification` : notification de message non lu
