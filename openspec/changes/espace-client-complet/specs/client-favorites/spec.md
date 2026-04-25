## ADDED Requirements

### Requirement: Favorites page SHALL display 3 sections with category tabs
La page `/client/favoris` SHALL afficher 3 sections verticales conformes à la maquette `services_et_freelances_favoris` : "Freelances Favoris" (grille 4 colonnes), "Services Sauvegardés" (grille 3 colonnes), "Vos Listes de Projets" (grille 4 colonnes dans section teintée verte). Des onglets de catégories en haut permettent de filtrer : Tous, Projet Logo, Développement Web, Rédaction Content.

#### Scenario: Affichage des 3 sections
- **WHEN** l'utilisateur accède à `/client/favoris`
- **THEN** les 3 sections s'affichent avec leurs grilles respectives et le bouton "Créer une nouvelle liste" en haut à droite

#### Scenario: Filtrage par catégorie
- **WHEN** l'utilisateur clique sur l'onglet "Développement Web"
- **THEN** seuls les favoris correspondant à cette catégorie sont affichés dans chaque section

### Requirement: Freelance favorite cards SHALL show avatar, rating, and profile button
Chaque card freelance SHALL afficher : avatar circulaire (96px) centré, badge vérifié (check vert), nom, spécialité en uppercase vert, note étoile (jaune), nombre d'avis, bouton "Profil". Un coeur vert rempli en position absolue top-right indique le favori.

#### Scenario: Affichage des freelances favoris
- **WHEN** la section "Freelances Favoris" se charge
- **THEN** 4 cards s'affichent : Jean D. (Expert React, 4.9/120), Marie L. (UI/UX Designer, 5.0/85), Dev Studio (Fullstack Agency, 4.8/210), Sophie Design (Illustratrice, 4.9/56)

#### Scenario: Clic sur Profil
- **WHEN** l'utilisateur clique sur "Profil" d'un freelance
- **THEN** il est redirigé vers la page profil public du freelance

### Requirement: Service favorite cards SHALL show image, title, rating, and price
Chaque card service SHALL afficher : image header (h-40) avec gradient overlay et avatar/nom du freelance en bas, titre, note étoile, prix "À partir de X €".

#### Scenario: Affichage des services sauvegardés
- **WHEN** la section "Services Sauvegardés" se charge
- **THEN** 3 cards s'affichent avec images, titres, notes et prix en EUR (250€, 800€, 150€)

### Requirement: Project lists section SHALL allow creating and viewing lists
La section "Vos Listes de Projets" SHALL afficher les listes existantes (Projet Logo: 12 éléments, Développement Web: 5 éléments, Montage Vidéo: 3 éléments) avec des cards à fond coloré et icônes. Une card dashed "+ Ajouter" permet de créer une nouvelle liste. Un bouton "Nouvelle liste" avec icône folder est disponible.

#### Scenario: Ajout d'une nouvelle liste
- **WHEN** l'utilisateur clique sur la card dashed "Ajouter" ou le bouton "Nouvelle liste"
- **THEN** un dialogue ou formulaire permet de nommer la nouvelle liste
