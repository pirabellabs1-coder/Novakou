## Why

La messagerie a deux bugs critiques qui rendent les messages vocaux et les appels audio/vidéo inutilisables :

1. **Messages vocaux impossibles à lire** — L'enregistrement audio produit un fichier `.webm`, mais l'endpoint d'upload rejette les fichiers WebM car leur signature binaire (EBML `0x1A 0x45 0xDF 0xA3`) n'est pas dans la liste `MAGIC_BYTES`. L'upload échoue silencieusement, le fallback stocke une URL `blob:` locale en DB — URL morte pour le destinataire et après rafraîchissement de page.

2. **Appels se coupent ~10 secondes après décrochage** — Le signaling WebRTC repose sur du polling HTTP (500ms). Les ICE candidates arrivent trop lentement, la connexion passe en état `"failed"`, et un timeout de 5s dans `onconnectionstatechange` déclenche `handleHangup()`. De plus, les credentials TURN metered.ca (gratuits) ont pu expirer, empêchant la traversée NAT.

Ces deux fonctionnalités sont essentielles pour la messagerie temps réel MVP.

## What Changes

### Bug 1 — Messages vocaux
- **Ajouter les magic bytes WebM/EBML** (`0x1A, 0x45, 0xDF, 0xA3`) dans la validation d'upload (`/api/upload/file/route.ts`)
- **Ajouter les magic bytes OGG** (`0x4F, 0x67, 0x67, 0x53`) et **MP4/M4A** (`ftyp` à offset 4) pour couvrir tous les formats audio possibles selon le navigateur
- **Ajouter `ogg`, `m4a`, `mp3` à ALLOWED_EXTENSIONS** dans l'endpoint d'upload
- **Adapter `handleVoiceSend`** pour utiliser le MIME type réellement enregistré (pas forcer `audio/webm`)
- **Supprimer le fallback blob: URL** — si l'upload échoue, afficher une erreur à l'utilisateur au lieu de stocker une URL morte

### Bug 2 — Appels audio/vidéo
- **Augmenter le timeout "failed"** de 5s à 15s pour laisser le temps aux ICE candidates d'arriver via polling
- **Réduire l'intervalle de polling actif** de 500ms à 200ms pendant la phase ICE
- **Ajouter un poll immédiat** après réception de l'answer (pas attendre le prochain interval)
- **Valider les TURN servers** au démarrage de l'appel — tester la connectivité avant de s'engager
- **Ajouter `iceConnectionState` monitoring** en plus de `connectionState` pour détecter les échecs ICE plus précisément
- **Ajouter des logs structurés** pour diagnostiquer les futures déconnexions (états ICE, nombre de candidates échangés, timing)

## Capabilities

### New Capabilities
- `audio-upload-validation`: Validation correcte des fichiers audio (WebM, OGG, MP4/M4A) dans l'endpoint d'upload, avec gestion d'erreur explicite côté client
- `webrtc-connection-reliability`: Fiabilité de la connexion WebRTC — polling rapide, timeouts adaptés, validation TURN, monitoring ICE complet

### Modified Capabilities
_(aucune spec existante n'est impactée au niveau requirements — il s'agit de bug fixes sur l'implémentation)_

## Impact

**Version cible :** MVP (bug fix critique)

**Fichiers impactés :**
- `apps/web/app/api/upload/file/route.ts` — magic bytes + extensions audio
- `apps/web/components/messaging/ChatPanel.tsx` — `handleVoiceSend` MIME type + error handling
- `apps/web/components/messaging/voice/useVoiceRecorder.ts` — exposer le vrai MIME type
- `apps/web/lib/webrtc/signaling.ts` — polling interval réduit + poll immédiat
- `apps/web/components/messaging/calls/useWebRTC.ts` — timeouts ICE + monitoring + TURN validation
- `apps/web/lib/webrtc/types.ts` — (optionnel) TURN credentials à vérifier/mettre à jour
- `apps/web/app/api/signaling/route.ts` — aucun changement structurel

**Impact sur les autres rôles :** Tous les rôles (Freelance, Client, Agence) utilisent la messagerie. L'admin n'est pas impacté directement.

**Pas de changement sur le schéma Prisma.** Pas de nouveau job BullMQ ni handler Socket.io nécessaire.
