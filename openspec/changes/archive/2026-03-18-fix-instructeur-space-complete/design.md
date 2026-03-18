## Context

L'espace instructeur du module formations (`/formations/(instructeur)/`) comprend ~30 pages, 10+ composants partagés, et 15+ routes API. Un audit exhaustif a révélé 6 bugs critiques, 12 bugs fonctionnels et 30+ problèmes de qualité. L'état actuel mélange des patterns incohérents : certaines pages utilisent React Query, d'autres des `fetch()` manuels sans gestion d'erreur ; des données mock (`Math.random()`, `MOCK_FORMATIONS`) sont en production ; des endpoints POST/DELETE manquent pour les produits numériques.

L'espace est construit sur :
- `lib/formations/hooks.ts` — hooks React Query (partiellement utilisés)
- `lib/dev/data-store.ts` + `services.json` — couche de données de développement
- Routes API sous `/api/instructeur/` et `/api/marketing/`
- Layout instructeur avec sidebar à sous-menus

## Goals / Non-Goals

**Goals:**
- Corriger les 6 bugs critiques (crashes, endpoints manquants, données fictives)
- Migrer les 14 pages restantes vers React Query pour une gestion d'état serveur cohérente
- Assurer que toutes les mutations (create, update, delete) appellent vraiment l'API ET invalident le cache
- Standardiser la gestion d'erreur et les états vides sur toutes les pages
- Harmoniser l'UI : utiliser les composants partagés (`StatCard`, `EmptyState`), corriger l'i18n du sidebar
- Créer la route API `POST/PUT/DELETE /api/instructeur/produits` manquante
- Supprimer toute donnée mock/random en production

**Non-Goals:**
- Réécriture de l'architecture (tRPC, WebSocket, etc.) — on corrige dans le cadre existant
- Mode sombre (hors périmètre MVP selon CLAUDE.md)
- Migration vers Meilisearch ou pgvector (V1/V3)
- Nouvelles fonctionnalités (le scope est strictement corrective + harmonisation)
- Internationalisation complète (on corrige le sidebar et `avis/page.tsx`, pas toutes les pages)

## Decisions

### 1. Pattern de migration React Query

**Choix** : Utiliser les hooks centralisés dans `lib/formations/hooks.ts` avec invalidation via `useQueryClient` après les mutations.

**Pourquoi** : Les hooks existent déjà pour la plupart des endpoints. Certaines pages les ignorent et font des `fetch()` manuels avec `useState`+`useEffect`. La migration consiste à remplacer le pattern :
```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { fetch(...).then(setData) }, []);
```
par :
```tsx
const { data, isLoading, error } = useHook(...);
```

Pour les mutations (POST/PUT/DELETE), on garde les `fetch()` inline mais on ajoute `queryClient.invalidateQueries()` après succès au lieu de recharger manuellement.

**Alternative rejetée** : Créer des hooks `useMutation` pour chaque opération — trop de hooks pour un gain marginal à ce stade.

### 2. Route API produits instructeur

**Choix** : Créer `app/api/instructeur/produits/route.ts` avec GET (existe) + POST + PUT + DELETE dans le même fichier.

**Pourquoi** : Cohérent avec le pattern des autres routes instructeur. Le modèle `DigitalProduct` existe dans le schéma Prisma. Le POST doit valider les données, associer l'instructeur via session, et gérer l'upload du fichier via Supabase Storage.

### 3. Suppression des données mock

**Choix** : Remplacer par des appels API réels ou des tableaux vides avec `EmptyState`.

- `Math.random()` dans dashboard → tableau vide + message "Pas encore de données"
- `MOCK_FORMATIONS/MOCK_PRODUCTS` dans flash → fetch `/api/instructeur/formations` + `/api/instructeur/produits`

### 4. Suppression de la double navigation

**Choix** : Supprimer le composant `INSTRUCTOR_NAV` inline dans `mes-formations`, `apprenants`, `avis`. Le layout fournit déjà la navigation complète via la sidebar.

### 5. Page modifier enrichie

**Choix** : Ajouter l'éditeur de sections/leçons dans `[id]/modifier/page.tsx` en réutilisant les composants du wizard `creer/page.tsx`. Remplacer l'input URL thumbnail par `ImageUpload`.

**Pourquoi** : Un instructeur ne peut actuellement pas modifier le contenu de sa formation après création. C'est un manque fonctionnel majeur.

## Risks / Trade-offs

- **[Risk] Migration React Query sur 14 pages** → Tester chaque page après migration pour vérifier que les mutations fonctionnent toujours. Les pages marketing ont déjà été migrées avec succès, le pattern est éprouvé.

- **[Risk] Route POST produits manquante en dev** → Le data-store de développement (`lib/dev/data-store.ts`) gère déjà les produits en mémoire. La nouvelle route POST doit s'intégrer avec ce système en mode dev.

- **[Risk] Suppression double-nav peut casser l'UX mobile** → Vérifier que le hamburger menu du layout est accessible sur mobile pour compenser la perte de la nav inline.

- **[Trade-off] On ne migre pas vers `useMutation` hooks** → Les mutations restent en `fetch()` inline, ce qui est moins clean mais évite de créer 30+ hooks mutation pour un bénéfice marginal au MVP.
