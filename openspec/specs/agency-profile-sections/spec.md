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

### Requirement: Orders API filters correctly for agencies
The `/api/orders` GET endpoint SHALL filter orders by `agencyId` when the caller is an agency owner (role AGENCE), excluding personal freelance orders from the agency view.

#### Scenario: Agency fetches orders without side filter
- **WHEN** an agency owner (role=AGENCE) calls `GET /api/orders` without `?side` parameter
- **THEN** the API SHALL return orders where `agencyId = agencyProfileId` OR `clientId = userId`, NOT including orders where only `freelanceId = userId`

#### Scenario: Agency fetches seller orders
- **WHEN** an agency owner calls `GET /api/orders?side=seller`
- **THEN** the API SHALL return orders where `agencyId = agencyProfileId`, NOT including personal freelance orders

### Requirement: Agency commission rate is 8%
The agency finances page SHALL use the correct 8% commission rate for the Agence plan, not a hardcoded 10%.

#### Scenario: Agency views commission on finances page
- **WHEN** an agency admin views `/agence/finances`
- **THEN** the commission rate displayed and used for calculations SHALL be 8% (0.08), matching the Agence plan in the centralized plan rules

#### Scenario: Agency views commission in CSV export
- **WHEN** an agency admin exports their finances as CSV
- **THEN** the commission amounts SHALL be calculated at 8%

## MODIFIED Requirements

### Requirement: Agency profile UI displays real data
The agency profile page SHALL display real data from the Prisma API instead of dev store mock data for all sections: hero, stats, team, services, and reviews.

#### Scenario: Agency profile hero shows real info
- **WHEN** a visitor views an agency profile
- **THEN** the hero section SHALL display the real agency logo (from Cloudinary/Supabase), name, verified badge based on actual `verified` field, sector, country, and team member count from the API

#### Scenario: Stats grid shows real numbers
- **WHEN** the agency has 20 completed orders, 4.6 average rating, and 15 reviews
- **THEN** the stats grid SHALL display these real numbers, not hardcoded or mock values

#### Scenario: Team members section shows real team
- **WHEN** the agency has team members in the TeamMember table
- **THEN** the page SHALL display real avatars, names, roles, and skills for each member

#### Scenario: Services section shows real agency services
- **WHEN** the agency has active services
- **THEN** the services section SHALL display real service cards with titles, prices, ratings, and order counts from Prisma
