### Requirement: Services actifs visibles dans la marketplace
Les services actifs (`status: ACTIF`) DOIVENT être visibles dans la marketplace. L'API `/api/public/services` DOIT retourner les données réelles depuis Prisma dans TOUS les environnements (dev et production), incluant : titre, prix, image principale, note moyenne réelle (calculée depuis les Reviews), nombre d'avis réel (`_count.reviews`), nombre de ventes réel (orders complétées `_count.orders` où `status IN (LIVRE, TERMINE)`), nom du freelancer, avatar, pays, badges vérification, et statut boost.

Le mode dual `IS_DEV` NE DOIT PLUS être utilisé pour les routes publiques de la marketplace. Les dev stores Zustand NE DOIVENT PAS être la source de données pour `/api/public/services` et `/api/public/top-services`.

#### Scenario: Service avec ventes et avis réels
- **WHEN** un service a 10 commandes complétées et 5 avis avec une moyenne de 4.3
- **THEN** la card dans `/explorer` SHALL afficher "10 ventes", 4.3 étoiles, et "(5 avis)"

#### Scenario: Données identiques sur toutes les pages
- **WHEN** un même service apparaît sur `/explorer`, la landing page, et `/agence/services`
- **THEN** les données affichées (ventes, avis, note) SHALL être identiques car elles viennent de la même source Prisma

#### Scenario: API retourne des données Prisma même en dev
- **WHEN** `IS_DEV=true` et l'API `/api/public/services` est appelée
- **THEN** la réponse SHALL contenir les données Prisma réelles, PAS les données des dev stores

### Requirement: Les projets ouverts DOIVENT être visibles dans l'explorateur de projets
Le système SHALL retourner tous les projets avec le status `ouvert` lorsque l'explorateur de projets publics est consulté via `/api/public/projects`.

#### Scenario: Consultation de la marketplace projets
- **WHEN** un utilisateur accède à `/offres-projets`
- **THEN** le système affiche tous les projets avec `status: "ouvert"` incluant titre, budget (min/max), deadline, compétences requises, et nombre de candidatures

#### Scenario: Projet fermé non visible
- **WHEN** un client marque un projet comme "pourvu" ou "fermé"
- **THEN** ce projet n'apparaît plus dans la marketplace publique

### Requirement: Le budget des projets MUST être affiché correctement
Le mapping entre les champs `budgetMin`/`budgetMax` de la base de données et l'affichage frontend MUST être cohérent. L'API SHALL retourner `budgetMin` et `budgetMax` comme champs séparés, et le frontend MUST les mapper correctement.

#### Scenario: Affichage du budget dans la liste des projets
- **WHEN** un projet est affiché dans la marketplace ou dans le dashboard client
- **THEN** le budget affiche les valeurs réelles `budgetMin` et `budgetMax` (pas €0 - €0)

#### Scenario: Création de projet avec budget
- **WHEN** un client crée un projet avec un budget min de 500€ et max de 2000€
- **THEN** les valeurs sont stockées dans `budgetMin: 500` et `budgetMax: 2000` et affichées correctement partout
