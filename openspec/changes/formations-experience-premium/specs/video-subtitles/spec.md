## ADDED Requirements

### Requirement: Instructor SHALL upload subtitle files for video lessons
L'instructeur DOIT pouvoir uploader un fichier de sous-titres (.vtt ou .srt) pour chaque leçon de type VIDEO.

#### Scenario: Upload d'un fichier VTT
- **WHEN** l'instructeur sélectionne un fichier .vtt dans le champ sous-titres du wizard de leçon
- **THEN** le fichier est uploadé vers Supabase Storage et les champs subtitleUrl/subtitleStoragePath/subtitleLabel sont sauvegardés

#### Scenario: Upload d'un fichier SRT
- **WHEN** l'instructeur sélectionne un fichier .srt
- **THEN** le système convertit le SRT en VTT avant upload (remplacement des virgules par des points dans les timestamps, ajout de l'en-tête WEBVTT)

#### Scenario: Suppression des sous-titres
- **WHEN** l'instructeur clique sur "Supprimer les sous-titres"
- **THEN** le fichier est supprimé de Supabase Storage et les champs sont remis à null

### Requirement: Player SHALL display subtitles when available
Le player vidéo DOIT afficher les sous-titres via un élément `<track>` HTML5 quand un fichier de sous-titres est disponible.

#### Scenario: Sous-titres disponibles
- **WHEN** une leçon vidéo a un fichier de sous-titres
- **THEN** un bouton CC (closed captions) apparaît dans les contrôles du player

#### Scenario: Activation/désactivation des sous-titres
- **WHEN** l'apprenant clique sur le bouton CC
- **THEN** les sous-titres s'affichent/se masquent sur la vidéo

#### Scenario: Vidéos YouTube/Vimeo
- **WHEN** la leçon est un embed YouTube ou Vimeo
- **THEN** le bouton CC n'est pas affiché (ces plateformes ont leurs propres sous-titres)

### Requirement: System SHALL store subtitle metadata on Lesson model
Le modèle Lesson DOIT avoir les champs `subtitleUrl String?`, `subtitleStoragePath String?`, `subtitleLabel String?` pour stocker les métadonnées des sous-titres.

#### Scenario: Sauvegarde des sous-titres
- **WHEN** l'instructeur sauvegarde une leçon avec un fichier de sous-titres uploadé
- **THEN** les champs subtitleUrl, subtitleStoragePath et subtitleLabel sont persistés en base
