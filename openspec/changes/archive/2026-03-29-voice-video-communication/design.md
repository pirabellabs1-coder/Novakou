## Context

FreelanceHigh dispose actuellement d'une messagerie texte basique (Zustand store local avec données démo). La messagerie supporte les types `text`, `file`, `image` et `system`. L'architecture prévoit Socket.io sur Fastify pour le temps réel (V2), mais les handlers de signaling WebRTC n'existent pas encore.

Le marché cible (Afrique francophone) utilise massivement les messages vocaux — c'est le mode de communication dominant sur WhatsApp et Telegram dans cette région. Les appels audio/vidéo sont essentiels pour les discussions projet, les entretiens freelance-client, et le support agence.

L'infrastructure existante (Socket.io sur Fastify + Cloudinary + Redis adapter) constitue une base solide pour construire ce système sans ajouter de services externes coûteux.

## Goals / Non-Goals

**Goals :**
- Permettre l'enregistrement et l'envoi de messages vocaux dans toutes les conversations
- Permettre les appels audio P2P entre deux utilisateurs connectés
- Permettre les appels vidéo P2P avec partage d'écran
- Intégrer les notifications d'appel entrant (popup in-app + notification navigateur)
- Afficher l'historique complet (vocaux, appels, appels manqués) dans le fil de conversation
- Fonctionner sur les 4 espaces (freelance, client, agence, admin)

**Non-Goals :**
- Appels de groupe / conférence (complexité WebRTC multi-peer — repoussé à V3+)
- Enregistrement côté serveur des appels (problématique RGPD)
- Serveur TURN auto-hébergé (utilisation de serveurs STUN gratuits Google pour le MVP V2, TURN payant si nécessaire en V3)
- Transcription temps réel pendant un appel (uniquement sur messages vocaux)
- Messages vocaux éphémères / auto-destructeurs

## Decisions

### 1. WebRTC natif (pas simple-peer)

**Choix :** Utiliser `RTCPeerConnection` natif du navigateur.
**Alternative rejetée :** `simple-peer` (wrapper WebRTC).
**Raison :** simple-peer n'est plus activement maintenu. RTCPeerConnection est stable dans tous les navigateurs modernes. Le signaling via Socket.io est simple à implémenter. Évite une dépendance supplémentaire.

### 2. Signaling via Socket.io existant

**Choix :** Ajouter des événements de signaling (`call:offer`, `call:answer`, `call:ice-candidate`, `call:hangup`, `call:reject`, `call:busy`) aux handlers Socket.io existants sur Fastify.
**Alternative rejetée :** Serveur de signaling dédié.
**Raison :** Socket.io est déjà déployé pour le chat. Les événements de signaling sont légers (SDP + ICE candidates). L'adaptateur Redis garantit le fonctionnement multi-serveur.

### 3. Stockage audio sur Cloudinary

**Choix :** Upload des messages vocaux sur Cloudinary (même pipeline que les images publiques).
**Alternative considérée :** Supabase Storage (buckets privés).
**Raison :** Les messages vocaux ne contiennent pas de données sensibles de type KYC. Cloudinary offre la transformation audio (compression, format) via URL. Le free tier couvre largement le volume MVP/V2. Si besoin de confidentialité renforcée plus tard, migration vers Supabase Storage possible sans changement d'architecture.

### 4. Format audio WebM Opus

**Choix :** Enregistrement en WebM (codec Opus) via MediaRecorder API, avec fallback MP3/AAC pour Safari.
**Raison :** Opus est le codec audio par défaut de WebRTC et MediaRecorder sur Chrome/Firefox. Excellente compression à faible bitrate (idéal pour les connexions africaines limitées). Safari supporte MediaRecorder depuis iOS 14.3 mais préfère MP3/AAC.

### 5. Transcription via Web Speech API (client-side)

**Choix :** Utiliser `SpeechRecognition` API du navigateur pour la transcription des messages vocaux.
**Alternative considérée :** OpenAI Whisper côté serveur.
**Raison :** Gratuit, pas de coût API. Fonctionne bien pour le français. La transcription est un "nice-to-have", pas critique. Si la qualité est insuffisante, migration vers Whisper via BullMQ job en V3 (coût contrôlé).

### 6. Architecture des composants

```
apps/web/
├── components/messaging/
│   ├── ChatPanel.tsx              # Modifié : ajout bouton micro + header appels
│   ├── MessageBubble.tsx          # Modifié : rendu messages vocaux + entrées appels
│   ├── ConversationList.tsx       # Modifié : aperçu vocaux/appels
│   └── voice/
│       ├── VoiceRecorder.tsx      # Nouveau : enregistrement + aperçu + envoi
│       ├── VoicePlayer.tsx        # Nouveau : lecteur audio avec waveform
│       └── useVoiceRecorder.ts    # Nouveau : hook MediaRecorder
│   └── calls/
│       ├── AudioCallModal.tsx     # Nouveau : modal appel audio
│       ├── VideoCallModal.tsx     # Nouveau : modal appel vidéo
│       ├── IncomingCallPopup.tsx  # Nouveau : notification appel entrant
│       ├── CallControls.tsx       # Nouveau : boutons muet/HP/caméra/raccrocher
│       └── useWebRTC.ts          # Nouveau : hook WebRTC complet
├── lib/
│   └── webrtc/
│       ├── signaling.ts           # Nouveau : client signaling Socket.io
│       ├── media.ts               # Nouveau : gestion flux audio/vidéo
│       └── types.ts               # Nouveau : types WebRTC
├── store/
│   └── messaging.ts               # Modifié : types voice/call, actions
│   └── call.ts                    # Nouveau : état appel en cours (Zustand)
```

### 7. Extension du modèle de données

Nouveaux types de messages ajoutés au store Zustand (et futur schéma Prisma) :

```typescript
type MessageContentType = "text" | "file" | "image" | "system"
  | "voice"        // Message vocal
  | "call_audio"   // Entrée appel audio (terminé)
  | "call_video"   // Entrée appel vidéo (terminé)
  | "call_missed"; // Appel manqué

interface UnifiedMessage {
  // ... champs existants ...
  audioUrl?: string;        // URL Cloudinary du message vocal
  audioDuration?: number;   // Durée en secondes
  callDuration?: number;    // Durée appel en secondes
  transcription?: string;   // Transcription du vocal
}
```

### 8. Serveurs STUN/TURN

**Choix V2 :** Serveurs STUN gratuits Google (`stun.l.google.com:19302`).
**Upgrade V3 :** Service TURN managé (Twilio NTS ou Metered.ca ~$5-15/mois) si le taux de connexion P2P échoue au-delà de 15% (NAT symétrique courant en Afrique).

## Risks / Trade-offs

**[Connectivité P2P en Afrique]** → Les NAT symétriques et firewalls restrictifs en Afrique subsaharienne peuvent bloquer les connexions WebRTC sans serveur TURN. **Mitigation :** Monitoring du taux d'échec de connexion ICE. Si > 15%, intégration Twilio NTS (TURN managé) en urgence.

**[Bande passante limitée]** → Les connexions internet en Afrique francophone sont souvent lentes (3G/4G instable). **Mitigation :** Codec Opus à faible bitrate (16-32 kbps audio). Qualité vidéo adaptative (WebRTC le fait nativement via `RTCRtpSender.setParameters`). Messages vocaux compressés sur Cloudinary.

**[Compatibilité Safari/iOS]** → MediaRecorder API a un support partiel sur Safari < 14.3. **Mitigation :** Feature detection avec fallback gracieux (bouton micro masqué si non supporté, message informatif).

**[Coût Cloudinary à grande échelle]** → Chaque message vocal est un fichier uploadé. **Mitigation :** Limite de 5 minutes par vocal. Suppression automatique après 30 jours via BullMQ cron job. Compression agressive (Opus 32kbps = ~240KB/minute).

**[Abus d'appels]** → Spam d'appels ou harcèlement. **Mitigation :** Rate limiting (max 10 appels/heure par utilisateur). Blocage d'utilisateur. Signalement d'abus lié à une conversation.

## Open Questions

1. **Serveur TURN :** Faut-il intégrer un TURN dès V2 ou attendre les métriques de connexion ? (Recommandation : attendre, mais préparer l'intégration)
2. **Appels hors-ligne :** Notifier par email/SMS en cas d'appel manqué quand l'utilisateur est hors ligne ? (Recommandation : email uniquement, SMS coûteux)
3. **Durée maximale d'appel :** Faut-il limiter la durée des appels gratuits ? (Recommandation : pas de limite pour V2, évaluer en V3 si abus)
