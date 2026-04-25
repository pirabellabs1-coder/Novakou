## ADDED Requirements

### Requirement: Player SHALL provide playback speed control
Le player vidéo DOIT offrir un sélecteur de vitesse de lecture pour les vidéos natives (non YouTube/Vimeo).

#### Scenario: Sélection de la vitesse
- **WHEN** l'apprenant clique sur le bouton de vitesse dans les contrôles du player
- **THEN** un menu popup affiche les options : 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x

#### Scenario: Changement de vitesse
- **WHEN** l'apprenant sélectionne une vitesse
- **THEN** la vitesse de lecture de la vidéo change immédiatement via `HTMLVideoElement.playbackRate`

#### Scenario: Persistance de la préférence
- **WHEN** l'apprenant change la vitesse
- **THEN** la préférence est sauvegardée en localStorage et appliquée automatiquement aux prochaines vidéos

#### Scenario: Vitesse par défaut
- **WHEN** l'apprenant n'a jamais changé la vitesse
- **THEN** la vitesse par défaut est 1x

#### Scenario: Vidéos YouTube/Vimeo
- **WHEN** la leçon est un embed YouTube ou Vimeo
- **THEN** les contrôles custom de vitesse ne sont pas affichés (ces plateformes ont leurs propres contrôles)

### Requirement: Player SHALL provide custom video controls
Le player DOIT avoir des contrôles custom superposés à la vidéo native incluant : play/pause, barre de progression, volume, vitesse, sous-titres (si disponibles) et plein écran.

#### Scenario: Affichage des contrôles
- **WHEN** l'apprenant survole la vidéo ou la met en pause
- **THEN** les contrôles custom apparaissent en overlay au bas de la vidéo

#### Scenario: Masquage automatique
- **WHEN** la vidéo joue et la souris ne bouge pas pendant 3 secondes
- **THEN** les contrôles se masquent automatiquement

#### Scenario: Play/pause
- **WHEN** l'apprenant clique sur la vidéo ou sur le bouton play/pause
- **THEN** la vidéo bascule entre lecture et pause

#### Scenario: Plein écran
- **WHEN** l'apprenant clique sur le bouton plein écran
- **THEN** la vidéo passe en mode plein écran via l'API Fullscreen du navigateur
