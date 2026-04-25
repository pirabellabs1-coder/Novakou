## ADDED Requirements

### Requirement: Page d'accueil formations SHALL afficher des statistiques live
La page `/` SHALL afficher des statistiques dynamiques récupérées depuis l'API : nombre total de formations actives, nombre total d'apprenants, nombre total de certificats délivrés, et note moyenne de la plateforme. Ces statistiques MUST être récupérées depuis `/api/formations/stats` et non hardcodées.

#### Scenario: Affichage des stats live
- **WHEN** un visiteur accède à `/`
- **THEN** les compteurs affichent les vraies valeurs de la base de données avec animation au chargement

#### Scenario: Données vides
- **WHEN** la base ne contient aucune formation
- **THEN** les compteurs affichent 0 sans erreur et un CTA encourage les instructeurs à créer leur première formation

### Requirement: Page d'accueil formations SHALL afficher les formations populaires et récentes depuis l'API
Les sections "Formations populaires" et "Dernières formations" SHALL utiliser les données de `/api/formations?sort=populaire&limit=8` et `/api/formations?sort=recent&limit=8` respectivement, sans aucune donnée statique.

#### Scenario: Formations populaires
- **WHEN** la page d'accueil charge
- **THEN** les 8 formations avec le plus d'inscriptions (status=ACTIF) sont affichées avec FormationCard

#### Scenario: Formations récentes
- **WHEN** la page d'accueil charge
- **THEN** les 8 dernières formations publiées (status=ACTIF) sont affichées

### Requirement: Explorer SHALL refléter les données en temps réel
La page `/explorer` SHALL afficher des résultats de recherche et filtres basés exclusivement sur les données Prisma, avec les compteurs de vues, étudiants et notes à jour.

#### Scenario: Résultats à jour
- **WHEN** un visiteur recherche des formations
- **THEN** les résultats incluent les formations actives avec `studentsCount`, `rating`, `reviewsCount` à jour depuis la base

#### Scenario: Filtrage fonctionnel
- **WHEN** un visiteur applique des filtres (catégorie, niveau, prix, durée, langue)
- **THEN** l'API `/api/formations` filtre correctement via Prisma WHERE clauses et retourne les résultats paginés

### Requirement: API formations stats SHALL retourner des données consolidées
`GET /api/formations/stats` SHALL retourner les statistiques globales de la plateforme calculées dynamiquement depuis Prisma : `totalFormations` (ACTIF), `totalStudents` (inscriptions uniques), `totalCertificates`, `averageRating`, `totalInstructors` (APPROUVE), `categoriesCount`.

#### Scenario: Appel API stats
- **WHEN** un visiteur appelle `GET /api/formations/stats`
- **THEN** la réponse contient les compteurs calculés en temps réel depuis la base de données, pas des valeurs hardcodées

### Requirement: Les statistiques cross-space SHALL être cohérentes
Les compteurs affichés dans les différents espaces MUST être cohérents : le nombre d'étudiants affiché dans le dashboard admin MUST correspondre à la somme des étudiants de chaque instructeur, et au nombre total d'inscriptions vues côté apprenant.

#### Scenario: Cohérence admin ↔ instructeur
- **WHEN** l'admin voit "120 étudiants" sur son dashboard
- **THEN** la somme des étudiants affichés dans les dashboards de tous les instructeurs doit être 120

#### Scenario: Cohérence admin ↔ explorer
- **WHEN** l'admin voit "50 formations actives"
- **THEN** l'explorer affiche au maximum 50 formations (toutes avec status=ACTIF)

### Requirement: Catégories de la page d'accueil SHALL provenir de l'API
Les catégories affichées sur la page d'accueil formations et la page `/categories` SHALL provenir de `/api/formations/categories` avec le compteur de formations par catégorie.

#### Scenario: Catégories avec compteurs
- **WHEN** la page d'accueil charge les catégories
- **THEN** chaque catégorie affiche son nom (FR/EN selon locale), son icône, et le nombre de formations actives dans cette catégorie

#### Scenario: Catégorie sans formations
- **WHEN** une catégorie n'a aucune formation active
- **THEN** elle est masquée de la page d'accueil mais reste visible dans `/categories`
