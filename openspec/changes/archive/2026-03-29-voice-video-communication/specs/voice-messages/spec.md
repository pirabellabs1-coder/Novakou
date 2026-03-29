## ADDED Requirements

### Requirement: L'utilisateur peut enregistrer un message vocal
Le système SHALL afficher un bouton microphone dans la barre d'envoi de message de chaque conversation. Lorsqu'un utilisateur clique sur ce bouton, le système SHALL demander l'autorisation du microphone au navigateur, puis démarrer l'enregistrement audio via MediaRecorder API. L'enregistrement SHALL être limité à 5 minutes maximum. Pendant l'enregistrement, le système SHALL afficher un chronomètre, une animation de forme d'onde (waveform), et des boutons pour annuler ou valider.

#### Scenario: Démarrage de l'enregistrement vocal
- **WHEN** l'utilisateur clique sur le bouton microphone dans la barre d'envoi
- **THEN** le système demande l'autorisation du microphone au navigateur, affiche une icône micro rouge pulsante, un chronomètre démarrant à 0:00, une forme d'onde animée, un bouton annuler et un bouton valider

#### Scenario: Enregistrement atteint la durée maximale
- **WHEN** l'enregistrement vocal atteint 5 minutes
- **THEN** le système stoppe automatiquement l'enregistrement et passe en mode aperçu avant envoi

#### Scenario: Annulation de l'enregistrement
- **WHEN** l'utilisateur clique sur le bouton annuler pendant l'enregistrement
- **THEN** le système arrête l'enregistrement, supprime les données audio et revient à l'état repos (bouton micro gris)

#### Scenario: Microphone non disponible
- **WHEN** l'utilisateur clique sur le bouton microphone et que le navigateur refuse l'accès ou que MediaRecorder n'est pas supporté
- **THEN** le système affiche un message d'erreur expliquant que le microphone n'est pas accessible et le bouton micro reste inactif

### Requirement: L'utilisateur peut prévisualiser avant d'envoyer un message vocal
Le système SHALL afficher un aperçu du message vocal après la fin de l'enregistrement, incluant un lecteur audio avec forme d'onde, la durée totale, un bouton Réécouter, un bouton Annuler et un bouton Envoyer.

#### Scenario: Aperçu après enregistrement
- **WHEN** l'utilisateur clique sur le bouton valider pour terminer l'enregistrement
- **THEN** le système affiche un lecteur audio avec la forme d'onde du vocal enregistré, la durée totale, un bouton Réécouter, un bouton Annuler (recommencer) et un bouton Envoyer

#### Scenario: Réécoute avant envoi
- **WHEN** l'utilisateur clique sur le bouton Réécouter dans l'aperçu
- **THEN** le système joue l'enregistrement audio depuis le début

#### Scenario: Annulation depuis l'aperçu
- **WHEN** l'utilisateur clique sur Annuler dans l'aperçu
- **THEN** le système supprime l'enregistrement et revient à l'état repos

### Requirement: Le système envoie et stocke les messages vocaux
Le système SHALL uploader le fichier audio sur Cloudinary au format WebM (Opus) ou MP3 (fallback Safari), stocker l'URL et la durée dans la base de données, et afficher le message vocal dans la conversation des deux participants.

#### Scenario: Envoi réussi du message vocal
- **WHEN** l'utilisateur clique sur Envoyer dans l'aperçu
- **THEN** le système uploade l'audio sur Cloudinary, crée un message de type `voice` avec l'URL audio et la durée, l'affiche immédiatement dans la conversation de l'expéditeur, et le transmet en temps réel au destinataire

#### Scenario: Échec d'upload
- **WHEN** l'upload sur Cloudinary échoue (réseau, quota dépassé)
- **THEN** le système affiche un message d'erreur avec un bouton Réessayer, sans perdre l'enregistrement

### Requirement: L'utilisateur peut écouter un message vocal reçu
Le système SHALL afficher chaque message vocal dans la conversation avec un bouton Play/Pause, une barre de progression cliquable, la durée totale, et un sélecteur de vitesse de lecture (1x, 1.5x, 2x). Le système SHALL marquer le message comme lu lorsqu'il est écouté.

#### Scenario: Lecture d'un message vocal
- **WHEN** l'utilisateur clique sur le bouton Play d'un message vocal
- **THEN** le système joue l'audio, affiche la progression sur la barre, et le bouton devient Pause

#### Scenario: Changement de vitesse de lecture
- **WHEN** l'utilisateur clique sur le sélecteur de vitesse (1x → 1.5x → 2x)
- **THEN** le système modifie la vitesse de lecture de l'audio en cours sans interruption

#### Scenario: Navigation dans la barre de progression
- **WHEN** l'utilisateur clique à un endroit de la barre de progression
- **THEN** le système reprend la lecture à la position cliquée

### Requirement: Le système transcrit automatiquement les messages vocaux
Le système SHALL proposer une transcription automatique via Web Speech API pour chaque message vocal. La transcription SHALL être accessible via un bouton "Voir la transcription" sous le lecteur audio.

#### Scenario: Affichage de la transcription
- **WHEN** l'utilisateur clique sur "Voir la transcription" d'un message vocal
- **THEN** le système affiche le texte transcrit sous le lecteur audio

#### Scenario: Transcription non disponible
- **WHEN** le navigateur ne supporte pas Web Speech API ou que la transcription échoue
- **THEN** le bouton "Voir la transcription" affiche "Transcription non disponible"

### Requirement: Les messages vocaux sont supprimés automatiquement après 30 jours
Le système SHALL supprimer les fichiers audio de Cloudinary et les données de transcription 30 jours après l'envoi du message vocal. L'entrée du message dans la conversation SHALL rester visible avec la mention "Message vocal expiré".

#### Scenario: Expiration d'un message vocal
- **WHEN** un message vocal a plus de 30 jours
- **THEN** le système supprime le fichier audio de Cloudinary et affiche "Message vocal expiré" à la place du lecteur audio

### Requirement: L'utilisateur peut supprimer un message vocal envoyé
Le système SHALL permettre à l'expéditeur de supprimer un message vocal qu'il a envoyé. La suppression SHALL retirer le fichier de Cloudinary.

#### Scenario: Suppression manuelle d'un message vocal
- **WHEN** l'expéditeur clique sur "Supprimer" dans le menu contextuel d'un message vocal
- **THEN** le système supprime le fichier de Cloudinary et remplace le message par "Message vocal supprimé"
