## ADDED Requirements

### Requirement: Le système affiche une notification popup pour les appels entrants
Le système SHALL afficher un popup de notification en haut à droite de la page lorsqu'un appel entrant est reçu. Le popup SHALL contenir l'avatar, le nom et le rôle de l'appelant, et des boutons d'action (Répondre/Refuser pour audio, Répondre vidéo/Répondre audio/Refuser pour vidéo).

#### Scenario: Popup d'appel audio entrant
- **WHEN** un événement `call:offer` de type audio est reçu via Socket.io
- **THEN** le système affiche un popup en haut à droite avec l'avatar de l'appelant, son nom, son rôle, un bouton Répondre vert et un bouton Refuser rouge

#### Scenario: Popup d'appel vidéo entrant
- **WHEN** un événement `call:offer` de type vidéo est reçu via Socket.io
- **THEN** le système affiche un popup avec trois boutons : Répondre en vidéo, Répondre en audio seulement, et Refuser

#### Scenario: Fermeture automatique du popup
- **WHEN** l'appelant raccroche avant que l'appelé ne réponde
- **THEN** le popup se ferme automatiquement et la sonnerie s'arrête

### Requirement: Le système joue des sons pour les appels
Le système SHALL jouer un son de sonnerie en boucle lorsqu'un appel entrant est reçu, un son "bip bip" côté appelant pendant que l'appel sonne, un son de connexion établie lorsque l'appel démarre, et un son de fin d'appel. Les sons SHALL être désactivables dans les paramètres utilisateur.

#### Scenario: Sonnerie appel entrant
- **WHEN** un appel entrant est reçu et que l'utilisateur n'a pas désactivé les sons de notification
- **THEN** le système joue un son de sonnerie en boucle jusqu'à ce que l'utilisateur réponde, refuse, ou que l'appelant raccroche

#### Scenario: Son côté appelant
- **WHEN** l'appelant attend que le destinataire réponde
- **THEN** le système joue un son "bip bip" en boucle côté appelant

#### Scenario: Son de connexion
- **WHEN** la connexion WebRTC est établie avec succès
- **THEN** le système joue un court son de connexion pour les deux parties

#### Scenario: Sons désactivés
- **WHEN** l'utilisateur a désactivé les sons de notification dans ses paramètres
- **THEN** le système n'émet aucun son lors des appels entrants ou sortants

### Requirement: Le système envoie une notification navigateur pour les appels hors onglet
Le système SHALL envoyer une notification navigateur (Notification API) lorsqu'un appel entrant est reçu et que l'utilisateur est dans un autre onglet ou que le navigateur est en arrière-plan. La notification SHALL afficher le nom de l'appelant et le type d'appel.

#### Scenario: Notification navigateur pour appel entrant
- **WHEN** un appel entrant est reçu et que l'onglet FreelanceHigh n'est pas actif
- **THEN** le système envoie une notification navigateur avec le titre "Appel entrant" et le nom de l'appelant, en plus du popup in-app

#### Scenario: Clic sur la notification navigateur
- **WHEN** l'utilisateur clique sur la notification navigateur
- **THEN** le navigateur amène l'onglet FreelanceHigh au premier plan avec le popup d'appel visible

#### Scenario: Permission de notification non accordée
- **WHEN** l'utilisateur n'a pas accordé la permission de notifications navigateur
- **THEN** le système affiche uniquement le popup in-app (pas de notification navigateur)

### Requirement: Le système affiche un badge pour les appels manqués
Le système SHALL afficher un badge rouge dans la messagerie lorsqu'un appel est manqué. Le badge SHALL incrémenter le compteur de messages non lus de la conversation concernée.

#### Scenario: Badge appel manqué
- **WHEN** un appel est manqué (non répondu dans les 30 secondes)
- **THEN** le système incrémente le compteur de messages non lus de la conversation et affiche un badge rouge sur l'icône de messagerie

#### Scenario: Badge disparaît après lecture
- **WHEN** l'utilisateur ouvre la conversation contenant un appel manqué
- **THEN** le badge est supprimé et le compteur de non lus est remis à zéro

### Requirement: L'utilisateur peut filtrer l'historique de communication par type
Le système SHALL proposer des filtres dans la messagerie pour afficher : tous les messages, messages vocaux uniquement, appels uniquement (audio + vidéo + manqués), ou fichiers uniquement.

#### Scenario: Filtrage par messages vocaux
- **WHEN** l'utilisateur sélectionne le filtre "Messages vocaux"
- **THEN** le système affiche uniquement les messages de type `voice` dans la conversation

#### Scenario: Filtrage par appels
- **WHEN** l'utilisateur sélectionne le filtre "Appels"
- **THEN** le système affiche uniquement les messages de type `call_audio`, `call_video` et `call_missed`

#### Scenario: Retour à tous les messages
- **WHEN** l'utilisateur sélectionne le filtre "Tous"
- **THEN** le système affiche tous les types de messages dans l'ordre chronologique

### Requirement: L'utilisateur peut configurer ses paramètres audio et vidéo
Le système SHALL proposer une page de paramètres de communication permettant de : tester et sélectionner le microphone par défaut, tester et sélectionner les haut-parleurs par défaut, tester et sélectionner la caméra par défaut avec prévisualisation, choisir la qualité vidéo (Auto/HD/SD), désactiver les sons de notification, et désactiver les notifications d'appel.

#### Scenario: Test du microphone
- **WHEN** l'utilisateur accède aux paramètres de communication et clique sur "Tester le micro"
- **THEN** le système affiche un indicateur de niveau audio en temps réel reflétant le son capté par le microphone sélectionné

#### Scenario: Sélection de la caméra avec aperçu
- **WHEN** l'utilisateur sélectionne une caméra dans la liste des périphériques
- **THEN** le système affiche une prévisualisation vidéo en temps réel de la caméra sélectionnée

#### Scenario: Désactivation des notifications d'appel
- **WHEN** l'utilisateur désactive les notifications d'appel dans les paramètres
- **THEN** le système n'affiche plus de popup ni ne joue de sonnerie pour les appels entrants, mais continue d'enregistrer les appels manqués dans l'historique
