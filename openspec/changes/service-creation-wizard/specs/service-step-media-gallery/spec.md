## ADDED Requirements

### Requirement: Image principale obligatoire
Le système SHALL exiger une image principale pour le service, uploadable par drag & drop ou via un bouton "Parcourir", en formats JPEG, PNG, GIF statique ou WebP, taille max 5 MB, dimensions recommandées 1260x708px (ratio 16:9).

#### Scenario: Upload par drag and drop
- **WHEN** l'utilisateur glisse un fichier JPEG de 3 MB sur la zone de dépôt
- **THEN** l'image est uploadée, croppée automatiquement au ratio 16:9 si nécessaire, et une prévisualisation est affichée

#### Scenario: Upload par bouton parcourir
- **WHEN** l'utilisateur clique sur "Parcourir" et sélectionne un fichier PNG
- **THEN** l'image est uploadée avec les mêmes règles de validation et de crop

#### Scenario: Fichier trop volumineux
- **WHEN** l'utilisateur tente d'uploader une image de 8 MB
- **THEN** un message d'erreur "La taille maximum est de 5 MB. Votre fichier fait 8 MB." est affiché et l'upload est refusé

#### Scenario: Format non supporté
- **WHEN** l'utilisateur tente d'uploader un fichier .bmp ou .svg
- **THEN** un message d'erreur "Format non supporté. Formats acceptés : JPEG, PNG, GIF, WebP" est affiché

#### Scenario: Crop automatique
- **WHEN** l'utilisateur uploade une image carrée (1:1)
- **THEN** un outil de crop s'affiche pour permettre de sélectionner la zone 16:9 souhaitée avant validation

### Requirement: Images supplémentaires
Le système SHALL permettre l'ajout de jusqu'à 5 images supplémentaires avec les mêmes règles que l'image principale.

#### Scenario: Ajout d'images supplémentaires
- **WHEN** l'utilisateur uploade 3 images supplémentaires
- **THEN** les 3 images sont affichées en miniatures avec un bouton de suppression chacune

#### Scenario: Limite d'images supplémentaires
- **WHEN** l'utilisateur a déjà 5 images supplémentaires et tente d'en ajouter une 6ème
- **THEN** un message "Maximum 5 images supplémentaires atteint" est affiché

#### Scenario: Réorganisation des images
- **WHEN** l'utilisateur glisse une miniature de la position 3 à la position 1
- **THEN** l'ordre des images est mis à jour

#### Scenario: Suppression d'une image supplémentaire
- **WHEN** l'utilisateur clique sur le bouton supprimer d'une miniature
- **THEN** l'image est retirée de la galerie

### Requirement: Vidéo optionnelle
Le système SHALL permettre d'ajouter une vidéo via une URL YouTube ou Vimeo, avec prévisualisation.

#### Scenario: Ajout d'une URL YouTube
- **WHEN** l'utilisateur colle une URL YouTube valide (ex: https://www.youtube.com/watch?v=xxx)
- **THEN** une prévisualisation de la vidéo est affichée en embed

#### Scenario: URL vidéo invalide
- **WHEN** l'utilisateur entre une URL qui n'est ni YouTube ni Vimeo
- **THEN** un message "URL non valide. Seuls YouTube et Vimeo sont supportés." est affiché

#### Scenario: Suppression de la vidéo
- **WHEN** l'utilisateur clique sur le bouton supprimer à côté de la vidéo
- **THEN** la vidéo est retirée et le champ URL redevient vide

### Requirement: Validation de l'étape 6
L'étape 6 SHALL exiger au minimum l'image principale pour être considérée comme complétée. Les images supplémentaires et la vidéo sont facultatives.

#### Scenario: Étape 6 sans image principale
- **WHEN** l'utilisateur n'a pas uploadé d'image principale et clique sur "Enregistrer et suivant"
- **THEN** un message "L'image principale est obligatoire" est affiché et la navigation est bloquée

#### Scenario: Étape 6 avec image principale seule
- **WHEN** l'utilisateur a uploadé uniquement l'image principale
- **THEN** l'étape 6 est considérée comme complétée et la navigation vers l'étape 7 est autorisée
