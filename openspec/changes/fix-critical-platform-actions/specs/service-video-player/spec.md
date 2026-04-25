## ADDED Requirements

### Requirement: Service detail page SHALL display video content
Le systeme SHALL afficher la video du service sur la page detail si `videoUrl` est present. Le lecteur SHALL supporter les URLs YouTube, Vimeo, et les videos directes (MP4/WebM).

#### Scenario: Video YouTube
- **WHEN** le service a un `videoUrl` contenant "youtube.com" ou "youtu.be"
- **THEN** un iframe YouTube embed est affiche avec le bon video ID
- **THEN** l'iframe est responsive (aspect-ratio 16:9)

#### Scenario: Video Vimeo
- **WHEN** le service a un `videoUrl` contenant "vimeo.com"
- **THEN** un iframe Vimeo player est affiche avec le bon video ID
- **THEN** l'iframe est responsive (aspect-ratio 16:9)

#### Scenario: Video directe (MP4/WebM)
- **WHEN** le service a un `videoUrl` qui ne contient ni YouTube ni Vimeo
- **THEN** un element `<video>` natif est affiche avec controles
- **THEN** la video est responsive (aspect-ratio 16:9)

#### Scenario: Pas de video
- **WHEN** le service n'a pas de `videoUrl` ou le champ est vide
- **THEN** aucune section video n'est affichee
