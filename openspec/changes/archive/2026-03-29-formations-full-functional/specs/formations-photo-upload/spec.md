## ADDED Requirements

### Requirement: L'instructeur DOIT pouvoir uploader une image de couverture lors de la création de formation
Le wizard de création de formation DOIT utiliser le composant `ImageUpload` existant au lieu d'un champ texte URL pour le thumbnail de la formation.

#### Scenario: Upload d'image de couverture dans le wizard
- **WHEN** l'instructeur est à l'étape de sélection d'image dans le wizard de création
- **THEN** le système DOIT afficher le composant `ImageUpload` avec un ratio 16:9, permettant de sélectionner une image depuis la galerie, afficher un preview, et uploader via `POST /api/upload/image`

#### Scenario: Image uploadée avec succès
- **WHEN** l'instructeur sélectionne une image et l'upload réussit
- **THEN** l'URL retournée DOIT être stockée dans le champ `thumbnailUrl` du formulaire et le preview DOIT s'afficher dans le wizard

### Requirement: L'apprenant et l'instructeur DOIVENT pouvoir uploader une photo de profil
Les pages de paramètres/profil de l'apprenant et de l'instructeur DOIVENT inclure un widget d'upload de photo de profil utilisant le composant `ImageUpload` existant avec un ratio carré et coins arrondis.

#### Scenario: Upload de photo de profil apprenant
- **WHEN** l'apprenant accède à sa page de paramètres et clique sur sa photo de profil
- **THEN** le système DOIT ouvrir le sélecteur de fichiers, permettre de choisir une image JPEG/PNG/WebP (max 5MB), l'uploader via l'API, et afficher le preview arrondi

#### Scenario: Upload de photo de profil instructeur
- **WHEN** l'instructeur accède à sa page de paramètres et clique sur sa photo de profil
- **THEN** le système DOIT fonctionner de manière identique à l'upload de photo apprenant, avec l'URL stockée dans le profil utilisateur

### Requirement: Les images uploadées DOIVENT être validées côté serveur
L'API d'upload DOIT valider le type MIME (JPEG, PNG, WebP, GIF uniquement), la taille maximale (5MB), et retourner une URL utilisable.

#### Scenario: Rejet d'un fichier trop volumineux
- **WHEN** un utilisateur tente d'uploader un fichier de plus de 5MB
- **THEN** l'API DOIT retourner une erreur 400 avec un message explicatif et le composant DOIT afficher l'erreur à l'utilisateur
