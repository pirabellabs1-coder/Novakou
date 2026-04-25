## ADDED Requirements

### Requirement: Toutes les API formations SHALL utiliser exclusivement des requêtes Prisma
Toutes les API routes du module formations SHALL supprimer les branches `DEV_MODE` / `IS_DEV` qui retournent des données mock. Chaque route MUST interroger la base de données via Prisma, avec un comportement gracieux si la base est vide (retour de tableaux vides et compteurs à 0).

#### Scenario: API sans données en base
- **WHEN** une API formations est appelée et la base ne contient aucune donnée
- **THEN** l'API retourne un objet valide avec des valeurs par défaut (tableaux vides, compteurs à 0, graphiques sans points)

#### Scenario: Suppression du code DEV_MODE
- **WHEN** le code de chaque API route est analysé
- **THEN** toutes les conditions `if (DEV_MODE)`, `if (IS_DEV)`, `if (process.env.DEV_MODE === "true")` sont supprimées, ne gardant que le chemin Prisma

### Requirement: Commission SHALL être centralisée dans un fichier de configuration
La constante `INSTRUCTOR_COMMISSION` (0.70) et `PLATFORM_COMMISSION` (0.30) SHALL être définies dans un seul fichier `lib/formations/config.ts` et importées partout au lieu d'être redéfinies localement.

#### Scenario: Import centralisé
- **WHEN** une API ou un composant a besoin du taux de commission
- **THEN** il importe `FORMATIONS_CONFIG.INSTRUCTOR_COMMISSION` depuis `@/lib/formations/config`

#### Scenario: Aucune redéfinition locale
- **WHEN** le codebase est analysé
- **THEN** aucun fichier ne contient de définition locale de `INSTRUCTOR_COMMISSION = 0.70` ou `PLATFORM_COMMISSION = 0.30` en dehors de `config.ts`

### Requirement: Toutes les pages dynamiques SHALL utiliser TanStack Query avec auto-refresh
Toutes les pages de dashboard (admin, instructeur, apprenant) SHALL utiliser `refetchInterval: 30000` (30s). Toutes les pages de liste (formations, étudiants, certificats, etc.) SHALL utiliser `refetchInterval: 60000` (60s). Le refetch MUST être désactivé quand l'onglet n'est pas actif.

#### Scenario: Auto-refresh dashboard admin
- **WHEN** l'admin est sur le dashboard formations depuis plus de 30 secondes
- **THEN** les données sont automatiquement rechargées sans interaction utilisateur

#### Scenario: Pause quand onglet inactif
- **WHEN** l'utilisateur change d'onglet navigateur
- **THEN** le polling s'arrête et reprend quand l'onglet redevient actif

### Requirement: Pages utilisant useState pour les données serveur SHALL migrer vers TanStack Query
Les pages qui utilisent `useState` + `useEffect` + `fetch()` pour charger les données SHALL migrer vers `useQuery` de TanStack Query pour bénéficier du cache, du refetch, et de la gestion d'erreurs standardisée.

#### Scenario: Migration d'une page existante
- **WHEN** une page utilise le pattern `useState([]); useEffect(() => fetch(...), [])`
- **THEN** elle est refactorisée pour utiliser `useQuery({ queryKey: [...], queryFn: () => fetch(...), refetchInterval: ... })`

### Requirement: Script de seed Prisma SHALL fournir des données de test réalistes
Un script `packages/db/prisma/seed.ts` SHALL créer des données de test réalistes pour le développement : 3 instructeurs, 10 formations (variété de statuts), 20 apprenants, 50 inscriptions, 15 certificats, 5 produits numériques, 3 cohortes, 10 avis.

#### Scenario: Exécution du seed
- **WHEN** un développeur exécute `npx prisma db seed`
- **THEN** les données de test sont créées avec des relations cohérentes (les inscriptions correspondent à des formations existantes, les certificats à des inscriptions complétées, etc.)

#### Scenario: Seed idempotent
- **WHEN** le seed est exécuté deux fois
- **THEN** les données existantes sont nettoyées avant la recréation (upsert ou deleteMany + create)
