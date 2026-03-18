## ADDED Requirements

### Requirement: Team section SHALL display member cards
Le profil agence DOIT afficher une section "Notre Equipe" avec les cartes des membres visibles de l'equipe. Chaque carte DOIT afficher : photo/avatar, nom, role dans l'agence, et competences principales (max 3 tags).

#### Scenario: Affichage de l'equipe
- **WHEN** un visiteur consulte le profil d'une agence qui a des membres visibles
- **THEN** une section "Notre Equipe" s'affiche avec une grille de cartes (3 colonnes desktop, 2 tablette, 1 mobile), chaque carte montrant l'avatar, le nom, le role et les competences

#### Scenario: Membre avec profil freelance
- **WHEN** un membre de l'equipe a aussi un profil freelance sur la plateforme
- **THEN** sa carte est cliquable et renvoie vers son profil public freelance

#### Scenario: Aucun membre visible
- **WHEN** une agence n'a aucun membre visible (ou les membres ont refuse la visibilite)
- **THEN** la section "Notre Equipe" affiche uniquement le nombre de membres ("Equipe de X membres") sans cartes individuelles

### Requirement: Portfolio section SHALL display case studies
Le profil agence DOIT afficher une section "Nos Realisations" avec des etudes de cas / projets passes. Chaque realisation DOIT afficher : image de couverture, titre du projet, description courte, categorie, et resultat cle.

#### Scenario: Affichage des realisations
- **WHEN** un visiteur consulte le profil d'une agence qui a des realisations
- **THEN** une section "Nos Realisations" s'affiche avec une grille de cartes projet (2 colonnes), chaque carte montrant l'image, le titre, la categorie et la description

#### Scenario: Aucune realisation
- **WHEN** une agence n'a aucune realisation renseignee
- **THEN** la section "Nos Realisations" n'est pas affichee

### Requirement: Work process section SHALL describe agency methodology
Le profil agence DOIT afficher une section "Notre Processus" dans l'onglet "A propos" avec les etapes de travail de l'agence (ex: Discovery → Design → Developpement → Livraison). Chaque etape DOIT avoir un numero, un titre et une description courte.

#### Scenario: Affichage du processus
- **WHEN** un visiteur consulte le profil d'une agence qui a defini son processus
- **THEN** l'onglet "A propos" affiche les etapes en timeline horizontale avec numeros, titres et descriptions

#### Scenario: Pas de processus defini
- **WHEN** une agence n'a pas defini son processus
- **THEN** la section "Notre Processus" n'est pas affichee
