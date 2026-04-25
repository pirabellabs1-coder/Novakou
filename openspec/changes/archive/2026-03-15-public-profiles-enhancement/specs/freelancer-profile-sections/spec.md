## ADDED Requirements

### Requirement: Skills section SHALL display progress bars with levels
Le profil freelance DOIT afficher une section "Competences" dans la sidebar droite avec le nom de chaque competence, son niveau (Debutant / Intermediaire / Avance / Expert) et une barre de progression visuelle correspondante. La section DOIT etre conforme a la maquette de reference.

#### Scenario: Affichage des competences avec barres
- **WHEN** un visiteur consulte le profil public d'un freelance qui a renseigne ses competences
- **THEN** la sidebar droite affiche la section "Competences" avec chaque competence sur une ligne : nom a gauche, niveau a droite, et une barre de progression coloree en dessous (vert pour Expert, bleu pour Avance, jaune pour Intermediaire, gris pour Debutant)

#### Scenario: Aucune competence renseignee
- **WHEN** un visiteur consulte le profil d'un freelance sans competences
- **THEN** la section "Competences" n'est pas affichee

### Requirement: Languages section SHALL display with flags and levels
Le profil freelance DOIT afficher une section "Langues" dans la sidebar avec le nom de chaque langue, son drapeau emoji et son niveau (Natif / Courant / Intermediaire / Debutant).

#### Scenario: Affichage des langues
- **WHEN** un visiteur consulte le profil d'un freelance qui a renseigne ses langues
- **THEN** la sidebar affiche la section "Langues" avec chaque langue sur une ligne : drapeau + nom + badge de niveau

#### Scenario: Aucune langue renseignee
- **WHEN** un visiteur consulte le profil d'un freelance sans langues
- **THEN** la section "Langues" n'est pas affichee

### Requirement: Education section SHALL display diplomas and certifications
Le profil freelance DOIT afficher une section "Formation" dans l'onglet "A propos" avec les diplomes et certifications, incluant le titre, l'etablissement, l'annee et un badge de type (diplome / certification).

#### Scenario: Affichage de la formation
- **WHEN** un visiteur consulte le profil d'un freelance qui a renseigne sa formation
- **THEN** l'onglet "A propos" affiche la section "Formation & Certifications" avec chaque entree sur une carte : icone de type, titre, etablissement, annee

#### Scenario: Aucune formation renseignee
- **WHEN** un visiteur consulte le profil d'un freelance sans formation
- **THEN** la section "Formation" n'est pas affichee

### Requirement: Portfolio section SHALL display projects with images
Le profil freelance DOIT afficher une section "Portfolio" avec une grille de projets. Chaque projet DOIT afficher : image de couverture, titre, description courte, lien externe optionnel, et competences utilisees. Un maximum de 3 projets DOIT pouvoir etre marque "en vedette".

#### Scenario: Affichage du portfolio avec projets
- **WHEN** un visiteur consulte le profil d'un freelance qui a des projets portfolio
- **THEN** une section "Portfolio" s'affiche sous le contenu principal avec une grille de cartes projet (2 colonnes desktop, 1 colonne mobile), chaque carte montrant l'image, le titre et la description

#### Scenario: Projets en vedette mis en avant
- **WHEN** un freelance a marque des projets comme "en vedette"
- **THEN** ces projets apparaissent en premier dans la grille avec un badge "Coup de coeur" ou une etoile

#### Scenario: Clic sur un projet portfolio
- **WHEN** un visiteur clique sur un projet portfolio qui a un lien externe
- **THEN** le lien s'ouvre dans un nouvel onglet

#### Scenario: Aucun projet portfolio
- **WHEN** un visiteur consulte le profil d'un freelance sans projets portfolio
- **THEN** la section "Portfolio" n'est pas affichee
