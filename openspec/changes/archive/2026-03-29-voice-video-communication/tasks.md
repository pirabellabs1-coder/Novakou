## 1. Types et Store — Extension du modèle de données

- [x] 1.1 Ajouter les types `voice`, `call_audio`, `call_video`, `call_missed` à `MessageContentType` dans `store/messaging.ts`
- [x] 1.2 Ajouter les champs `audioUrl`, `audioDuration`, `callDuration`, `transcription` à l'interface `UnifiedMessage`
- [x] 1.3 Créer le store Zustand `store/call.ts` pour l'état d'appel en cours (callState, remoteUser, isMuted, isCameraOn, callDuration, callType)
- [x] 1.4 Créer les types WebRTC partagés dans `lib/webrtc/types.ts` (CallOffer, CallAnswer, IceCandidate, CallType, CallState)

## 2. Messages vocaux — Enregistrement

- [x] 2.1 Créer le hook `useVoiceRecorder.ts` dans `components/messaging/voice/` (MediaRecorder API, gestion permissions, chronomètre, durée max 5 min)
- [x] 2.2 Créer le composant `VoiceRecorder.tsx` (3 états : repos, enregistrement avec waveform animée, aperçu avant envoi)
- [x] 2.3 Intégrer le bouton microphone dans la barre d'envoi de `ChatPanel.tsx` (entre la zone texte et le bouton envoyer)
- [x] 2.4 Implémenter l'upload audio vers Cloudinary (format WebM Opus, fallback MP3 Safari)
- [x] 2.5 Connecter l'envoi du message vocal au store messaging (`sendMessage` avec type `voice`, audioUrl, audioDuration)

## 3. Messages vocaux — Lecture

- [x] 3.1 Créer le composant `VoicePlayer.tsx` (bouton Play/Pause, barre de progression cliquable, durée, sélecteur vitesse 1x/1.5x/2x, waveform)
- [x] 3.2 Modifier `MessageBubble.tsx` pour rendre les messages de type `voice` avec le `VoicePlayer`
- [x] 3.3 Implémenter la transcription via Web Speech API (bouton "Voir la transcription" sous le lecteur, fallback si non supporté)
- [x] 3.4 Modifier `ConversationList.tsx` pour afficher "Message vocal" comme aperçu dans la liste des conversations

## 4. Signaling WebRTC — Infrastructure

- [x] 4.1 Créer `lib/webrtc/signaling.ts` — client Socket.io pour les événements call:offer, call:answer, call:ice-candidate, call:hangup, call:reject, call:busy
- [x] 4.2 Créer `lib/webrtc/media.ts` — fonctions utilitaires pour getUserMedia (audio/vidéo), getDisplayMedia (partage écran), gestion des tracks
- [x] 4.3 Créer le hook `useWebRTC.ts` dans `components/messaging/calls/` (RTCPeerConnection, SDP exchange, ICE candidates, reconnexion auto, serveurs STUN Google)

## 5. Appels audio

- [x] 5.1 Créer le composant `CallControls.tsx` (boutons Muet, Haut-parleur, Caméra, Chat, Raccrocher, indicateur qualité réseau)
- [x] 5.2 Créer le composant `AudioCallModal.tsx` (modal centré avec avatar distant, nom, rôle, chronomètre, contrôles audio)
- [x] 5.3 Ajouter les boutons appel audio et vidéo dans l'en-tête de `ChatPanel.tsx`
- [x] 5.4 Implémenter la logique d'initiation d'appel (demande micro, création offer SDP, envoi via Socket.io)
- [x] 5.5 Implémenter la logique de réception d'appel (answer SDP, établissement connexion P2P)
- [x] 5.6 Implémenter le raccrocher (fermeture RTCPeerConnection, signal call:hangup, insertion message call_audio dans la conversation)
- [x] 5.7 Gérer les cas d'erreur : destinataire hors ligne (timeout 5s), pas de réponse (timeout 30s → call_missed), utilisateur occupé (call:busy)

## 6. Appels vidéo

- [x] 6.1 Créer le composant `VideoCallModal.tsx` (modal plein écran, vidéo distante en grand, vidéo locale en PiP, contrôles)
- [x] 6.2 Implémenter le flux vidéo bidirectionnel (ajout track vidéo à RTCPeerConnection, rendu via `<video>` elements)
- [x] 6.3 Implémenter le passage audio → vidéo en cours d'appel (ajout track vidéo, renegotiation SDP)
- [x] 6.4 Implémenter le partage d'écran (getDisplayMedia, remplacement track vidéo, arrêt partage)
- [x] 6.5 Implémenter le changement de caméra front/back sur mobile (enumerateDevices, remplacement track)
- [x] 6.6 Implémenter l'activation/désactivation caméra et micro pendant l'appel (toggle track.enabled)

## 7. Notifications d'appel

- [x] 7.1 Créer le composant `IncomingCallPopup.tsx` (popup en haut à droite, avatar appelant, boutons Répondre/Refuser, animation d'entrée)
- [x] 7.2 Variante vidéo : 3 boutons (Répondre vidéo, Répondre audio seulement, Refuser)
- [x] 7.3 Ajouter les fichiers audio de sonnerie (sonnerie entrante, bip sortant, connexion, fin d'appel) dans `public/sounds/`
- [x] 7.4 Implémenter la lecture des sons (sonnerie loop, bip sortant loop, sons ponctuels connexion/fin)
- [x] 7.5 Implémenter les notifications navigateur (Notification API) pour les appels reçus hors onglet actif
- [x] 7.6 Implémenter le badge appel manqué (incrémenter unreadCount de la conversation, icône rouge dans ConversationList)

## 8. Historique et filtres

- [x] 8.1 Modifier `MessageBubble.tsx` pour rendre les types `call_audio`, `call_video`, `call_missed` avec icônes et durée
- [x] 8.2 Ajouter les filtres de conversation dans `ChatPanel.tsx` ou `MessagingLayout.tsx` (Tous, Vocaux, Appels, Fichiers)
- [x] 8.3 Implémenter la logique de filtrage des messages par type dans le store

## 9. Paramètres audio/vidéo

- [x] 9.1 Créer la page de paramètres communication (accessible depuis les paramètres de chaque espace)
- [x] 9.2 Implémenter le sélecteur de micro avec test de niveau audio (enumerateDevices + AudioContext analyser)
- [x] 9.3 Implémenter le sélecteur de haut-parleurs avec test audio
- [x] 9.4 Implémenter le sélecteur de caméra avec prévisualisation vidéo
- [x] 9.5 Implémenter les toggles : qualité vidéo (Auto/HD/SD), sons de notification, notifications d'appel
- [x] 9.6 Persister les préférences dans le store Zustand (et future API profil)

## 10. Données démo et intégration cross-espaces

- [x] 10.1 Ajouter des messages vocaux et entrées d'appels démo dans les conversations existantes du store
- [x] 10.2 Vérifier le fonctionnement sur les 4 pages messagerie : `/dashboard/messages`, `/client/messages`, `/agence/messages`, `/admin/messages`
- [x] 10.3 Ajouter la suppression manuelle d'un message vocal (menu contextuel, suppression Cloudinary)
- [x] 10.4 Ajouter le message "Message vocal expiré" pour les vocaux de plus de 30 jours (logique front)

## 11. Tests et validation

- [x] 11.1 Tester l'enregistrement et l'envoi d'un message vocal (Chrome, Firefox, Safari)
- [x] 11.2 Tester la lecture d'un message vocal (play/pause, barre de progression, vitesse)
- [x] 11.3 Tester l'initiation et la réception d'un appel audio (modal, contrôles, raccrocher)
- [x] 11.4 Tester l'initiation et la réception d'un appel vidéo (vidéo bidirectionnelle, PiP)
- [x] 11.5 Tester le partage d'écran pendant un appel vidéo
- [x] 11.6 Tester les notifications d'appel entrant (popup, sonnerie, notification navigateur)
- [x] 11.7 Tester les appels manqués (timeout, badge, message dans conversation)
- [x] 11.8 Tester le responsive (mobile 375px, tablette 768px, desktop 1280px)
- [x] 11.9 Vérifier l'accessibilité de base (labels, navigation clavier, contrastes)
