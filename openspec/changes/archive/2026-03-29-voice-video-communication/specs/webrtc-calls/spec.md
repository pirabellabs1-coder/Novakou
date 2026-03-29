## ADDED Requirements

### Requirement: L'utilisateur peut initier un appel audio
Le système SHALL afficher un bouton d'appel audio dans l'en-tête de chaque conversation. Lorsqu'un utilisateur clique sur ce bouton, le système SHALL créer une connexion RTCPeerConnection, générer une offre SDP, et l'envoyer au destinataire via Socket.io.

#### Scenario: Initiation d'un appel audio
- **WHEN** l'utilisateur clique sur le bouton appel audio dans l'en-tête de la conversation
- **THEN** le système demande l'accès au microphone, affiche un modal d'appel avec l'avatar et le nom du destinataire, le statut "Appel en cours..." et un chronomètre, puis envoie une offre SDP via Socket.io

#### Scenario: Destinataire hors ligne
- **WHEN** l'utilisateur initie un appel et que le destinataire n'est pas connecté
- **THEN** le système affiche "L'utilisateur est hors ligne" après 5 secondes et ferme le modal d'appel

#### Scenario: Destinataire ne répond pas
- **WHEN** le destinataire ne répond pas à l'appel dans les 30 secondes
- **THEN** le système affiche "Appel sans réponse", ferme le modal, et insère un message `call_missed` dans la conversation

### Requirement: L'utilisateur peut recevoir et répondre à un appel audio
Le système SHALL afficher un popup de notification d'appel entrant avec l'avatar, le nom et le rôle de l'appelant, un bouton Répondre et un bouton Refuser. Un son de sonnerie SHALL être joué en boucle pendant que l'appel sonne.

#### Scenario: Réception d'un appel audio
- **WHEN** un appel audio entrant est reçu via Socket.io
- **THEN** le système affiche un popup en haut à droite avec l'avatar de l'appelant, son nom, son rôle, un bouton Répondre et un bouton Refuser, et joue un son de sonnerie en boucle

#### Scenario: L'utilisateur répond à l'appel
- **WHEN** l'utilisateur clique sur Répondre
- **THEN** le système accepte l'offre SDP, crée une réponse SDP, établit la connexion WebRTC P2P, et affiche le modal d'appel avec les contrôles audio

#### Scenario: L'utilisateur refuse l'appel
- **WHEN** l'utilisateur clique sur Refuser
- **THEN** le système envoie un signal `call:reject` via Socket.io, ferme le popup, et arrête la sonnerie

### Requirement: L'utilisateur dispose de contrôles pendant un appel audio
Le système SHALL afficher pendant un appel audio actif : un bouton Muet (toggle microphone), un bouton Haut-parleur, un bouton Caméra (passer en vidéo), un indicateur de qualité réseau, la durée en temps réel, et un bouton Raccrocher.

#### Scenario: Mise en sourdine
- **WHEN** l'utilisateur clique sur le bouton Muet pendant un appel
- **THEN** le système désactive le flux audio sortant sans couper la connexion, et l'icône muet change d'état visuel

#### Scenario: Passage en appel vidéo
- **WHEN** l'utilisateur clique sur le bouton Caméra pendant un appel audio
- **THEN** le système demande l'accès à la caméra, ajoute un flux vidéo à la connexion WebRTC, et le modal passe en mode appel vidéo

#### Scenario: Raccrocher
- **WHEN** l'utilisateur clique sur le bouton Raccrocher
- **THEN** le système ferme la connexion WebRTC, envoie `call:hangup` via Socket.io, ferme le modal, et insère un message `call_audio` avec la durée dans la conversation

### Requirement: L'utilisateur peut initier un appel vidéo
Le système SHALL afficher un bouton d'appel vidéo à côté du bouton appel audio dans l'en-tête de conversation. L'appel vidéo SHALL utiliser une connexion WebRTC avec flux audio et vidéo. L'interface SHALL afficher la vidéo du distant en grand et sa propre vidéo en PiP (Picture-in-Picture).

#### Scenario: Initiation d'un appel vidéo
- **WHEN** l'utilisateur clique sur le bouton appel vidéo
- **THEN** le système demande l'accès au microphone et à la caméra, affiche un modal plein écran avec la vidéo du distant en grand et sa propre vidéo en miniature, et envoie une offre SDP incluant les flux audio et vidéo

#### Scenario: Réception d'un appel vidéo
- **WHEN** un appel vidéo entrant est reçu
- **THEN** le système affiche un popup avec trois options : Répondre en vidéo, Répondre en audio seulement, ou Refuser

### Requirement: L'utilisateur peut partager son écran pendant un appel vidéo
Le système SHALL afficher un bouton de partage d'écran pendant un appel vidéo. Le partage SHALL utiliser `getDisplayMedia` pour capturer l'écran, une fenêtre ou un onglet.

#### Scenario: Activation du partage d'écran
- **WHEN** l'utilisateur clique sur le bouton partage d'écran pendant un appel vidéo
- **THEN** le système ouvre le sélecteur natif du navigateur (écran/fenêtre/onglet), remplace le flux vidéo local par le flux d'écran partagé, et le distant voit l'écran partagé en grand

#### Scenario: Arrêt du partage d'écran
- **WHEN** l'utilisateur clique à nouveau sur le bouton partage d'écran ou clique sur "Arrêter le partage" du navigateur
- **THEN** le système remplace le flux d'écran par le flux caméra et le distant revoit la vidéo de l'utilisateur

### Requirement: L'utilisateur peut contrôler ses périphériques pendant un appel vidéo
Le système SHALL permettre à l'utilisateur d'activer/désactiver la caméra, d'activer/désactiver le microphone, de passer en plein écran, et de changer de caméra (front/back sur mobile).

#### Scenario: Désactivation de la caméra
- **WHEN** l'utilisateur clique sur le bouton caméra pendant un appel vidéo
- **THEN** le système arrête le flux vidéo sortant, affiche l'avatar de l'utilisateur à la place, et le distant voit un écran noir ou l'avatar

#### Scenario: Changement de caméra sur mobile
- **WHEN** l'utilisateur clique sur le bouton changer de caméra sur un appareil mobile
- **THEN** le système bascule entre la caméra frontale et la caméra arrière sans interrompre l'appel

### Requirement: Le signaling WebRTC utilise Socket.io
Le système SHALL utiliser les événements Socket.io suivants pour le signaling WebRTC : `call:offer` (envoi de l'offre SDP), `call:answer` (envoi de la réponse SDP), `call:ice-candidate` (échange de candidats ICE), `call:hangup` (raccrocher), `call:reject` (refuser), `call:busy` (occupé). Le système SHALL utiliser les serveurs STUN Google (`stun.l.google.com:19302`).

#### Scenario: Échange SDP réussi
- **WHEN** l'appelant envoie un `call:offer` et que l'appelé répond avec un `call:answer`
- **THEN** les deux parties échangent leurs candidats ICE via `call:ice-candidate` et la connexion P2P est établie

#### Scenario: Reconnexion après coupure réseau
- **WHEN** la connexion WebRTC est interrompue (ICE connection state = "disconnected")
- **THEN** le système tente une reconnexion automatique pendant 10 secondes, affiche "Reconnexion..." à l'utilisateur, et ferme l'appel si la reconnexion échoue

#### Scenario: Utilisateur déjà en appel
- **WHEN** un utilisateur reçoit un appel alors qu'il est déjà en communication
- **THEN** le système envoie automatiquement `call:busy` à l'appelant et affiche "L'utilisateur est en communication" à l'appelant

### Requirement: L'historique des appels est enregistré dans la conversation
Le système SHALL insérer un message système dans la conversation après chaque appel terminé. Le message SHALL indiquer le type d'appel (audio/vidéo), la durée, et l'heure. Les appels manqués SHALL être affichés en rouge avec une icône distincte.

#### Scenario: Appel audio terminé
- **WHEN** un appel audio se termine normalement
- **THEN** le système insère un message de type `call_audio` avec le texte "Appel audio - X min Y sec" dans la conversation des deux participants

#### Scenario: Appel vidéo terminé
- **WHEN** un appel vidéo se termine normalement
- **THEN** le système insère un message de type `call_video` avec le texte "Appel vidéo - X min Y sec" dans la conversation

#### Scenario: Appel manqué
- **WHEN** un appel n'est pas décroché dans les 30 secondes
- **THEN** le système insère un message de type `call_missed` en rouge avec le texte "Appel manqué" dans la conversation
