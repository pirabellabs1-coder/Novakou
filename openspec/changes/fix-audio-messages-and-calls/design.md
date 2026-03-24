## Context

La messagerie FreelanceHigh utilise Supabase Storage (bucket privé `message-attachments`) pour les fichiers audio et un système de signaling WebRTC basé sur du polling HTTP (`/api/signaling`) pour les appels. Deux bugs critiques empêchent l'utilisation de ces fonctionnalités :

1. **Audio** : L'endpoint d'upload valide les magic bytes des fichiers mais ne reconnaît pas le format WebM (EBML). L'upload échoue → le fallback stocke une URL `blob:` locale → l'audio est injouable.

2. **Appels** : Le signaling par polling HTTP à 500ms est trop lent pour l'échange d'ICE candidates. La connexion WebRTC passe en état `"failed"` avant que tous les candidates n'arrivent, et un timeout de 5s déclenche le hangup automatique (~10s après décrochage).

**Contraintes :**
- MVP — pas de refactoring massif du signaling (Socket.io signaling = V2)
- Pas de nouvelle dépendance
- Pas de changement DB/Prisma
- Compatible Vercel (serverless) + dev local

## Goals / Non-Goals

**Goals:**
- Les messages vocaux sont enregistrés, uploadés, stockés et lus correctement par les deux parties
- Les appels audio/vidéo restent connectés après décrochage (ICE negotiation aboutit)
- Meilleur diagnostic des échecs (logs structurés)

**Non-Goals:**
- Migrer le signaling vers Socket.io (V2)
- Support offline/PWA pour les audio
- Enregistrement d'appels
- Amélioration de la qualité audio/vidéo

## Decisions

### D1 — Ajouter les magic bytes manquants plutôt que désactiver la validation

**Choix :** Ajouter les signatures EBML (WebM), OGG, MP4/M4A dans `MAGIC_BYTES`.

**Alternatives considérées :**
- *Désactiver la validation pour les audio* — Risque de sécurité (upload de fichiers malveillants déguisés en audio)
- *Whitelist par MIME type* — Le MIME type est fourni par le client, facilement forgeable

**Rationale :** La validation par magic bytes est une bonne pratique de sécurité. Il suffit d'étendre la liste avec les signatures audio courantes.

### D2 — Utiliser le MIME type réel du MediaRecorder

**Choix :** `useVoiceRecorder` expose le `mimeType` effectivement utilisé par le MediaRecorder. `handleVoiceSend` crée le `File` avec ce type et l'extension correspondante.

**Rationale :** Chrome enregistre en `audio/webm;codecs=opus`, Safari en `audio/mp4`. Forcer `.webm` pour tous les navigateurs cause des incompatibilités.

### D3 — Supprimer le fallback blob: URL

**Choix :** Si l'upload échoue, afficher un toast d'erreur au lieu de stocker une URL `blob:` morte.

**Rationale :** Une URL `blob:` est locale au tab du navigateur. Elle ne fonctionne ni pour le destinataire, ni après refresh. Stocker une URL inutile donne une fausse impression de succès.

### D4 — Réduire le polling à 200ms + poll immédiat post-answer

**Choix :** Pendant un appel actif, réduire l'intervalle de polling de 500ms à 200ms. Ajouter un poll immédiat (`pollServer()`) après réception de l'answer.

**Alternatives considérées :**
- *Server-Sent Events (SSE)* — Plus fiable que le polling mais nécessite un refactoring du endpoint signaling. Reporté à V2.
- *Socket.io signaling* — Idéal mais nécessite que le serveur Fastify soit configuré avec le signaling. Reporté à V2.

**Rationale :** Réduire de 500ms à 200ms divise par 2.5 le temps d'échange ICE. Le poll immédiat après answer évite un délai inutile. Ces changements sont minimaux et localisés.

### D5 — Augmenter le timeout ICE failed à 15s + monitoring iceConnectionState

**Choix :** Porter le timeout de 5s à 15s pour `connectionState === "failed"`, et ajouter un handler `oniceconnectionstatechange` pour un diagnostic plus précis.

**Rationale :** Avec le polling, l'échange ICE peut prendre 5-10s. Un timeout de 5s est trop agressif. De plus, `iceConnectionState` fournit des transitions plus granulaires (`checking` → `connected`) que `connectionState`.

### D6 — Vérification TURN au démarrage de l'appel

**Choix :** Avant d'initier un appel, tester la connectivité TURN via un `RTCPeerConnection` éphémère avec `iceTransportPolicy: "relay"`. Si TURN ne répond pas en 3s, logger un warning (pas bloquer l'appel — STUN pourrait suffire).

**Rationale :** Les credentials TURN metered.ca gratuits peuvent expirer. Un check proactif permet de diagnostiquer les échecs.

## Risks / Trade-offs

- **Polling 200ms = plus de requêtes HTTP** → Impact minimal (polling actif uniquement pendant un appel, ~5 req/s par utilisateur). Acceptable au MVP.
- **TURN gratuit non fiable** → Le check D6 détecte le problème mais ne le résout pas. Solution long-terme : TURN payant ou signaling via Socket.io (V2).
- **In-memory signaling sur Vercel** → En production Vercel (serverless), chaque requête peut toucher une instance différente → les signaux se perdent. Ce bug existant n'est pas dans le scope de ce fix (nécessite Redis ou Socket.io, V2). En dev local, ça marche.
- **Le fallback `/uploads/bucket/path` (dev sans Supabase)** → Si Supabase n'est pas configuré, l'upload retourne un chemin local non résolvable. Pas de changement ici — on considère que Supabase est configuré pour les tests de messagerie.

## Open Questions

1. **Les credentials TURN metered.ca sont-ils encore valides ?** — À vérifier manuellement. Si expirés, il faudra les renouveler sur https://www.metered.ca/ ou passer à un TURN payant.
2. **Faut-il migrer le signaling vers Socket.io dès maintenant ?** — Non, reporté à V2. Le polling amélioré (200ms + poll immédiat) suffit pour le MVP.
