## ADDED Requirements

### Requirement: Prisma schema includes all formations models with proper relations
Le schéma Prisma `packages/db/schema.prisma` DOIT inclure les 12 nouveaux modèles de la section formations (`Formation`, `FormationCategory`, `Section`, `Lesson`, `Resource`, `Quiz`, `Question`, `Enrollment`, `LessonProgress`, `Certificate`, `FormationReview`, `InstructeurProfile`, `CartItem`, `PromoCode`) ainsi que les 5 enums (`Level`, `LessonType`, `QuestionType`, `FormationStatus`, `InstructeurStatus`). Une migration Prisma DOIT être générée et appliquée. Tous les modèles DOIT avoir des relations correctement définies avec le modèle `User` existant.

#### Scenario: Migration Prisma appliquée sans erreur
- **WHEN** `pnpm --filter=db migrate:deploy` est exécuté sur un environnement avec la base Supabase cible
- **THEN** toutes les nouvelles tables sont créées sans erreur et les tables existantes ne sont pas modifiées

#### Scenario: Contrainte unicité enrollment
- **WHEN** une tentative d'insertion d'un second `Enrollment` avec le même `(userId, formationId)` est effectuée
- **THEN** la contrainte unique `@@unique([userId, formationId])` lève une erreur et l'insertion est rejetée

#### Scenario: Cascade delete sections et leçons
- **WHEN** une `Formation` est supprimée via Prisma
- **THEN** toutes les `Section`, `Lesson`, `Quiz`, `Question`, `LessonProgress` et `Certificate` associées sont supprimées en cascade (via `onDelete: Cascade`)

#### Scenario: Modèle Certificate avec code unique
- **WHEN** un `Certificate` est créé
- **THEN** le champ `code` DOIT être unique dans la table (`@unique`) et respecte le format `FH-YYYY-XXXXXX`

### Requirement: Supabase RLS policies protect formations data by role
Des policies Row Level Security DOIT être définies sur toutes les nouvelles tables Supabase pour contrôler l'accès. Les formations ACTIVES DOIVENT être lisibles publiquement. Les enrollments, progressions et certificats DOIVENT être accessibles uniquement par le propriétaire (userId = auth.uid()). Les instructeurs DOIVENT accéder uniquement à leurs propres formations.

#### Scenario: Lecture publique des formations actives
- **WHEN** une requête SELECT est effectuée sur la table `Formation` sans authentification Supabase
- **THEN** seules les formations avec `status = 'ACTIF'` sont retournées

#### Scenario: Accès en écriture aux formations limité à l'instructeur propriétaire
- **WHEN** un instructeur authentifié tente de modifier une formation dont il n'est pas l'`instructeurId`
- **THEN** la policy RLS rejette l'opération UPDATE et retourne une erreur d'autorisation

#### Scenario: Accès aux enrollments limité au propriétaire
- **WHEN** un utilisateur authentifié effectue un SELECT sur la table `Enrollment`
- **THEN** seuls les enrollments dont `userId = auth.uid()` sont retournés, sans possibilité de voir les inscriptions des autres utilisateurs

### Requirement: Full-text search index is created on Formation table
Un index GIN DOIT être créé sur un champ `search_vector` calculé de type `tsvector` dans la table `Formation`. L'index DOIT couvrir `titleFr`, `titleEn`, `descriptionFr`, `descriptionEn` pour permettre la recherche bilingue via Postgres FTS.

#### Scenario: Recherche FTS bilingue sur les formations
- **WHEN** une requête `to_tsquery('french', 'react')` est exécutée sur la table `Formation`
- **THEN** les formations dont le titre ou la description en français contient le mot "react" ou ses dérivés sont retournées par l'index GIN en moins de 100ms pour un catalogue de 1000 formations

#### Scenario: Recherche FTS anglaise
- **WHEN** une requête `to_tsquery('english', 'development')` est exécutée
- **THEN** les formations dont le titre ou la description en anglais contient des mots dérivés de "development" sont retournées

### Requirement: Initial categories seed data is populated on migration
Un script de seed DOIT insérer les 12 catégories initiales de formations dans la table `FormationCategory` lors de la première migration ou via `prisma db seed`. Chaque catégorie DOIT avoir un nom FR, un nom EN, un slug unique, une icône Lucide (ou emoji), une couleur hexadécimale et un ordre d'affichage.

#### Scenario: Exécution du script de seed catégories
- **WHEN** `pnpm --filter=db db:seed` est exécuté sur une base vide
- **THEN** 12 catégories sont insérées : Design & Créativité, Développement Web, App Mobile, Marketing Digital, Intelligence Artificielle, Data & Business, Vidéo & Animation, Rédaction, Cybersécurité, Freelancing & Business, Langues, Développement Personnel

#### Scenario: Re-exécution du seed sans duplication
- **WHEN** le script de seed est exécuté une seconde fois (ex: `prisma db seed` en CI)
- **THEN** les catégories existantes ne sont pas dupliquées (utilisation de `upsert` sur le champ `slug`)
