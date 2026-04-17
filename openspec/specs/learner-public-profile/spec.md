## ADDED Requirements

### Requirement: Learner public profile page SHALL exist
Le systeme DOIT fournir une page de profil public pour les apprenants a l'URL `/apprenants/[id]`. Cette page DOIT utiliser le meme design system que les autres profils publics (banner, avatar, sidebar, onglets).

#### Scenario: Acces au profil apprenant
- **WHEN** un visiteur accede a `/apprenants/123`
- **THEN** la page affiche le profil public de l'apprenant avec son avatar, son nom, sa bio, et ses informations d'apprentissage

#### Scenario: Apprenant inexistant
- **WHEN** un visiteur accede a un ID d'apprenant inexistant
- **THEN** la page affiche un message "Profil introuvable" avec un lien pour retourner a l'accueil formations

### Requirement: Learner profile SHALL display completed courses
Le profil apprenant DOIT afficher une section "Formations completees" avec la liste des cours termines. Chaque cours DOIT afficher : image, titre, instructeur, date de completion, note obtenue si applicable.

#### Scenario: Formations completees affichees
- **WHEN** un visiteur consulte le profil d'un apprenant qui a complete des formations
- **THEN** une grille de cartes affiche les formations completees avec image, titre, instructeur, date de fin

#### Scenario: Aucune formation completee
- **WHEN** un apprenant n'a complete aucune formation
- **THEN** la section affiche "Aucune formation completee pour le moment"

### Requirement: Learner profile SHALL display certificates
Le profil apprenant DOIT afficher une section "Certificats" avec les certificats obtenus. Chaque certificat DOIT afficher : titre de la formation, date d'obtention, score, et un lien de verification.

#### Scenario: Certificats affiches
- **WHEN** un visiteur consulte le profil d'un apprenant qui a des certificats
- **THEN** une grille de cartes affiche les certificats avec titre, date, score et bouton "Verifier"

#### Scenario: Clic sur verifier un certificat
- **WHEN** un visiteur clique sur "Verifier" sur un certificat
- **THEN** il est redirige vers la page de verification du certificat (`/verification/[code]`)

### Requirement: Learner profile SHALL display learning statistics
Le profil apprenant DOIT afficher une grille de statistiques : formations completees, certificats obtenus, heures d'apprentissage, note moyenne.

#### Scenario: Statistiques affichees
- **WHEN** un visiteur consulte le profil d'un apprenant
- **THEN** une grille 4 colonnes affiche : Formations completees, Certificats, Heures d'apprentissage, Note moyenne

### Requirement: Learner profile SHALL display progression badges
Le profil apprenant DOIT afficher des badges de progression bases sur l'activite d'apprentissage : Premier Cours, 5 Cours Completes, 10 Cours Completes, Expert Certifie.

#### Scenario: Badges affiches
- **WHEN** un apprenant a debloque des badges de progression
- **THEN** les badges s'affichent en ligne sous l'avatar avec une icone et un label

### Requirement: Learner profile API SHALL provide data
Le systeme DOIT fournir un endpoint API `GET /api/formations/apprenants/[id]` qui retourne les donnees du profil public de l'apprenant : informations personnelles, formations completees, certificats, statistiques, badges.

#### Scenario: API retourne les donnees
- **WHEN** une requete GET est envoyee a `/api/formations/apprenants/123`
- **THEN** la reponse contient les informations publiques de l'apprenant en JSON

#### Scenario: Apprenant inexistant via API
- **WHEN** une requete GET est envoyee pour un ID inexistant
- **THEN** la reponse HTTP est 404 avec le message "Apprenant introuvable"
