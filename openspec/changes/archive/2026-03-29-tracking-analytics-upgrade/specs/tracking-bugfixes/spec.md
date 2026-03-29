## ADDED Requirements

### Requirement: Heartbeat SHALL NOT increment pageViews
Le heartbeat de session (30s) MUST mettre a jour `lastActiveAt` et `exitPath` mais NE DOIT PAS incrementer `pageViews`. Le compteur `pageViews` MUST etre incremente uniquement quand un event `page_view` est recu.

#### Scenario: Heartbeat does not inflate pageViews
- **WHEN** un utilisateur reste 5 minutes sur une seule page (10 heartbeats)
- **THEN** la session affiche `pageViews: 1` (pas 11)

### Requirement: Events SHALL be deduplicated by ID
Le serveur MUST verifier l'unicite de l'event ID avant de l'enregistrer. Si un event avec le meme ID existe deja, il est ignore silencieusement.

#### Scenario: Duplicate event ignored
- **WHEN** le meme batch d'events est envoye deux fois (probleme reseau)
- **THEN** les events deja enregistres ne sont pas dupliques

### Requirement: Tracking events SHALL have basic validation
Le serveur MUST valider que chaque event a au minimum : `id`, `type`, `sessionId`, `path`, `timestamp`, `deviceType`. Les events invalides sont rejetes.

#### Scenario: Invalid event rejected
- **WHEN** un event sans `sessionId` est envoye
- **THEN** il est rejete et non enregistre
