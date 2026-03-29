## Why

La messagerie FreelanceHigh est actuellement limitée au texte et aux fichiers. Les freelances et clients africains communiquent majoritairement par messages vocaux (WhatsApp, Telegram) et ont besoin d'appels directs pour discuter des projets en temps réel. Sans communication vocale et vidéo, la plateforme oblige les utilisateurs à sortir vers des outils externes, brisant le flux de travail et réduisant l'engagement. Cette fonctionnalité est ciblée pour la **V2** (confiance et collaboration).

## What Changes

- **Messages vocaux** : enregistrement audio via MediaRecorder API, upload Cloudinary, lecteur custom avec waveform, transcription via Web Speech API, vitesse de lecture variable (1x/1.5x/2x)
- **Appels audio WebRTC** : appels P2P via RTCPeerConnection avec signaling Socket.io, interface appelant/appelé, muet, haut-parleur, durée en temps réel, possibilité de passer en vidéo
- **Appels vidéo WebRTC** : flux vidéo bidirectionnel, PiP (Picture-in-Picture) pour sa propre vidéo, partage d'écran via getDisplayMedia, changement de caméra (front/back mobile)
- **Notifications d'appel** : sonnerie, popup d'appel entrant, notifications navigateur si onglet inactif, appels manqués avec badge rouge
- **Historique des communications** : messages vocaux, appels audio/vidéo et appels manqués intégrés dans le fil de conversation avec filtres dédiés
- **Paramètres audio/vidéo** : sélection micro/haut-parleur/caméra par défaut, test audio, qualité vidéo (Auto/HD/SD), désactivation sons

### Impact sur les rôles

La fonctionnalité est **transversale** et disponible dans les 4 espaces :
- **Freelance** (`/dashboard/messages`) : appeler un client, envoyer des vocaux
- **Client** (`/client/messages`) : appeler un freelance/agence
- **Agence** (`/agence/messages`) : appels internes équipe + appels clients
- **Admin** (`/admin/messages`) : support vocal avec n'importe quel utilisateur

### Infrastructure requise

- **Handler Socket.io** : événements de signaling WebRTC (`call:offer`, `call:answer`, `call:ice-candidate`, `call:hangup`, `call:reject`)
- **Schéma Prisma** : extension du type de message (`voice`, `call_audio`, `call_video`, `call_missed`), champs `audioUrl`, `audioDuration`, `callDuration`, `transcription`
- **BullMQ** : job de nettoyage des messages vocaux après 30 jours, job de transcription asynchrone
- **Template email** : notification d'appel manqué

## Capabilities

### New Capabilities

- `voice-messages`: Enregistrement, envoi, lecture et transcription de messages vocaux dans la messagerie
- `webrtc-calls`: Appels audio et vidéo P2P via WebRTC avec signaling Socket.io, partage d'écran
- `call-notifications`: Notifications d'appel entrant (popup, sonnerie, navigateur), gestion des appels manqués

### Modified Capabilities

_(Aucune spec existante à modifier — le système de messagerie n'a pas encore de spec formelle)_

## Impact

### Code affecté
- `apps/web/store/messaging.ts` — extension types (`voice`, `call_audio`, `call_video`, `call_missed`), nouvelles actions
- `apps/web/components/messaging/ChatPanel.tsx` — bouton micro, boutons appel audio/vidéo dans le header
- `apps/web/components/messaging/MessageBubble.tsx` — rendu des messages vocaux et entrées d'appel
- `apps/web/components/messaging/ConversationList.tsx` — aperçu des vocaux/appels dans la liste
- Nouveaux composants : `VoiceRecorder`, `VoicePlayer`, `AudioCallModal`, `VideoCallModal`, `IncomingCallPopup`
- `apps/web/lib/webrtc/` — module signaling WebRTC + gestion médias

### APIs
- Socket.io : nouveaux événements de signaling (`call:*`)
- API REST/tRPC : upload audio Cloudinary, transcription

### Dépendances
- `socket.io-client` (déjà dans les dépendances prévues)
- APIs navigateur natives : `MediaRecorder`, `RTCPeerConnection`, `getDisplayMedia`, `SpeechRecognition`
- Cloudinary SDK (déjà utilisé) pour upload audio
- Serveurs STUN Google gratuits (`stun.l.google.com:19302`)

### Sécurité
- WebRTC chiffré nativement (DTLS/SRTP)
- Messages vocaux accessibles uniquement aux participants de la conversation
- Suppression automatique des vocaux après 30 jours
- Aucun enregistrement des appels côté serveur
