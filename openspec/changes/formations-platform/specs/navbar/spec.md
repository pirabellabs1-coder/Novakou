## ADDED Requirements

### Requirement: Navbar displays a "Formations" link between "Services" and "À Propos"
La navbar principale de la landing page publique (`/`) ET les navbars des espaces connectés (freelance, client, agence) DOIVENT afficher un lien "Formations" (FR) / "Trainings" (EN) positionné entre les liens "Services" et "À Propos". Le lien DOIT avoir un badge coloré distinctif (couleur primaire FreelanceHigh `#6C2BD9`) et une icône de mortier de diplôme pour le différencier visuellement des autres liens de navigation. Un clic sur ce lien DOIT rediriger vers `/`.

#### Scenario: Lien "Formations" visible dans la navbar publique
- **WHEN** un visiteur non connecté accède à la landing page `/`
- **THEN** le lien "Formations" avec son badge coloré et son icône est visible entre "Services" et "À Propos" dans la barre de navigation

#### Scenario: Lien "Formations" visible dans la navbar freelance connectée
- **WHEN** un freelance connecté consulte son dashboard à `/dashboard`
- **THEN** le lien "Formations" est visible dans la navbar de l'espace freelance

#### Scenario: Navigation vers la section formations depuis la navbar
- **WHEN** un utilisateur clique sur le lien "Formations" dans la navbar
- **THEN** il est redirigé vers `/` (landing page de la section formations)

#### Scenario: Affichage du lien en anglais quand la langue EN est active
- **WHEN** un utilisateur a sélectionné l'anglais (EN) comme langue active
- **THEN** le lien affiche "Trainings" à la place de "Formations" dans la navbar

#### Scenario: Feature flag contrôle la visibilité du lien
- **WHEN** la variable d'environnement `NEXT_PUBLIC_FORMATIONS_ENABLED` est définie à `false`
- **THEN** le lien "Formations" n'est pas rendu dans la navbar, permettant un déploiement progressif
