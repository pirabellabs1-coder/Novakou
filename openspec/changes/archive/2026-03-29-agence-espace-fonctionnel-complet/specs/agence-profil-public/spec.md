## ADDED Requirements

### Requirement: Agency public profile SHALL display complete information with cover photo
La page profil public de l'agence MUST afficher : photo de couverture (uploadable, 1200x300px, JPG/PNG/WebP), logo agence (uploadable), nom + slogan, localisation + site web, badge verifie, note + nombre avis, "Membre depuis [date]", boutons "Contacter" et "Commander".

#### Scenario: En-tete du profil public
- **WHEN** un visiteur accede au profil public de l'agence
- **THEN** l'en-tete affiche la photo de couverture, le logo, le nom, le slogan, la localisation, le site web, le badge verifie, la note et le nombre d'avis

#### Scenario: Photo de couverture uploadable
- **WHEN** un proprietaire de l'agence uploade une photo de couverture dans les parametres
- **THEN** la photo est uploadee via l'API, stockee (Cloudinary ou Supabase Storage), et visible sur le profil public

### Requirement: Agency public profile SHALL display sections with real data
Le profil public MUST afficher les sections suivantes avec des donnees reelles : A propos (description complete), Services (6 visibles sans connexion), Portfolio projets, Equipe (si active dans les parametres), Statistiques (si activees dans les parametres), Avis clients complets.

#### Scenario: Section services
- **WHEN** un visiteur consulte le profil public
- **THEN** les 6 premiers services actifs de l'agence sont affiches

#### Scenario: Section equipe conditionnelle
- **WHEN** l'agence a active l'affichage de l'equipe dans ses parametres
- **THEN** les membres de l'equipe sont affiches sur le profil public

#### Scenario: Section equipe desactivee
- **WHEN** l'agence a desactive l'affichage de l'equipe
- **THEN** la section equipe n'apparait pas sur le profil public

#### Scenario: Section avis
- **WHEN** l'agence a recu des avis
- **THEN** les avis sont affiches avec les notes, commentaires, et reponses de l'agence
