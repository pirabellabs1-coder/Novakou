## 1. Flux services — alignement des statuts

> **Approche révisée** : Au lieu d'aligner les statuts lowercase/uppercase, la cause racine est que `DEV_MODE=true` sur Vercel fait que les stores en mémoire (éphémères sur serverless) sont utilisés au lieu de Prisma. Solution : ajout de `USE_PRISMA_FOR_DATA` qui force Prisma sur Vercel.

- [x] 1.1 Créer `USE_PRISMA_FOR_DATA` dans `lib/env.ts` : `true` sur Vercel OU quand `!IS_DEV`
- [x] 1.2 Dans `apps/web/app/api/services/route.ts` : remplacer `IS_DEV` par `IS_DEV && !USE_PRISMA_FOR_DATA` pour GET et POST (3 occurrences)
- [x] 1.3 Dans `apps/web/app/api/public/services/route.ts` : forcer Prisma sur Vercel (`!IS_DEV || USE_PRISMA_FOR_DATA`)
- [x] 1.4 Dans `apps/web/app/api/admin/services/route.ts` : forcer Prisma sur Vercel
- [x] 1.5 Dans `apps/web/app/api/admin/services/[id]/route.ts` : forcer Prisma pour approve/refuse sur Vercel
- [ ] 1.6 Dans `apps/web/app/admin/services/page.tsx` : aligner les valeurs des tabs/filtres (`STATUS_MAP`, `stats`, `tab`) sur les statuts uppercase Prisma.
- [ ] 1.7 Dans `apps/web/store/dashboard.ts` : vérifier que `apiCreateService` et les comparaisons de statut utilisent uppercase.

## 2. Flux projets clients — statut "ouvert"

- [x] 2.1 Dans `apps/web/app/client/projets/nouveau/page.tsx` : changer `status: "actif"` → `status: "ouvert"` pour la publication
- [ ] 2.2 Dans `apps/web/store/client.ts` : mettre à jour le type `ClientProject.status` pour inclure `"ouvert" | "pourvu" | "ferme" | "brouillon"`.
- [x] 2.3 Dans `apps/web/app/api/projects/route.ts` : refactorisé pour utiliser Prisma sur Vercel + statut `"ouvert"`
- [x] 2.4 Créé le modèle `Project` + `ProjectBid` dans `packages/db/prisma/schema.prisma` et pushé la migration
- [x] 2.5 Dans `apps/web/app/api/public/projects/route.ts` : refactorisé pour utiliser Prisma sur Vercel + filtre `status === "ouvert"`

## 3. Responsive espace client

- [x] 3.1 Dans `apps/web/app/client/page.tsx` : ajout layout dual mobile cards (`md:hidden`) + desktop table (`hidden md:block`)
- [x] 3.2 Boutons audités et corrigés dans client/avis, client/litiges, client/notifications
- [x] 3.3 Ajout `flex-wrap gap-2` sur les rangées de boutons d'action dans 3 fichiers client
- [x] 3.4 Corrigé `min-w-[200px]` → `min-w-0 sm:min-w-[200px]` dans client/projets/nouveau

## 4. Page Explorer — filtres et grid

- [x] 4.1 Grid services : `xl:grid-cols-5` → `lg:grid-cols-4` (supprimé xl:5)
- [x] 4.2 Filtres : ajouté `flex-col sm:flex-row` + `w-full sm:w-auto`
- [x] 4.3 Dropdowns : `min-w-[240px]` → `min-w-0 w-full sm:w-auto sm:min-w-[200px]`
- [x] 4.4 Toggle vue : `hidden sm:flex` → `flex` (visible sur mobile avec padding compact)
- [ ] 4.5 Harmoniser le style des catégories Explorer avec le composant `CategoriesSection` de la page d'accueil (même icônes, même couleurs, même disposition en grille sur desktop).
- [x] 4.6 Gaps déjà corrects : `gap-3 sm:gap-4 lg:gap-5`

## 5. Tests de vérification

- [ ] 5.1 Créer un service en tant que freelance → vérifier qu'il apparaît dans `/admin/services` onglet "En attente"
- [ ] 5.2 Approuver le service en admin → vérifier qu'il apparaît dans `/explorer`
- [ ] 5.3 Publier un projet en tant que client → vérifier qu'il apparaît dans `/offres-projets`
- [ ] 5.4 Tester l'espace client sur 375px, 768px et 1280px — aucun overflow horizontal, boutons tous visibles
- [ ] 5.5 Tester la page Explorer sur 375px et 1280px — filtres lisibles, grid correct, toggle vue fonctionnel
