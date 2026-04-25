## 1. Types & config backend

- [x] 1.1 Enrichir le type `PlanConfig` dans `lib/admin/config-service.ts` avec les champs manquants : `priceAnnual`, `scenarioLimit`, `certificationLimit`, `productiviteAccess`, `teamLimit` (renommer `maxMembers`), `crmAccess`, `cloudStorageGB` (renommer `storageGB`), `apiAccess`, `supportLevel`, `features` (string[])
- [x] 1.2 Mettre à jour `DEFAULT_CONFIG.plans` dans `config-service.ts` pour inclure les nouvelles valeurs par défaut alignées avec `PLAN_RULES`
- [x] 1.3 Ajouter le type `LivePlanConfig` dans `lib/plans.ts` qui représente un plan complet (tous les champs de `PLAN_RULES` + `features`)
- [x] 1.4 Enrichir le type `AdminConfig.plans` dans `store/admin.ts` pour refléter tous les champs éditables

## 2. API endpoint `/api/plans/live`

- [x] 2.1 Créer le fichier `apps/web/app/api/plans/live/route.ts` avec un handler GET public
- [x] 2.2 Implémenter la logique de merge : pour chaque plan, fusionner les valeurs admin config (depuis `getConfig()`) sur les defaults hardcodés de `PLAN_RULES`
- [x] 2.3 Ajouter le header `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- [x] 2.4 Retourner le format `{ plans: Record<PlanName, LivePlanConfig>, updatedAt: string }`

## 3. Hook React `useLivePlans()`

- [x] 3.1 Créer le hook `useLivePlans()` dans `lib/plans.ts` qui fetch `/api/plans/live`
- [x] 3.2 Implémenter le fallback : si le fetch échoue, retourner `PLAN_RULES` + `PLAN_FEATURES` comme valeurs par défaut
- [x] 3.3 Retourner `{ plans, features, isLoading, error }` avec les types corrects

## 4. Refonte admin `/admin/plans`

- [x] 4.1 Refaire la page `/admin/plans` avec des cartes expandables (accordéon) au lieu de la modal
- [x] 4.2 Ajouter TOUS les champs éditables dans le formulaire : prix mensuel, prix annuel, commission type/valeur, limites (services, candidatures, boosts, scénarios, certifications), toggles (productivité, CRM, API), membres équipe, stockage cloud, niveau support (select), features (textarea multi-ligne)
- [x] 4.3 Pré-remplir les valeurs depuis la config admin (fusionnée avec les defaults)
- [x] 4.4 Sauvegarder via `updateConfig()` existant du admin store et afficher toast de confirmation
- [x] 4.5 Afficher les cards avec un résumé riche : prix, commission, toutes les limites, features count

## 5. Mise à jour pages consommatrices

- [x] 5.1 Modifier `/tarifs` (`apps/web/app/(public)/tarifs/page.tsx`) pour utiliser `useLivePlans()` au lieu des constantes `PLAN_RULES` et `PLAN_FEATURES`
- [x] 5.2 Modifier `/dashboard/abonnement` (`apps/web/app/dashboard/abonnement/page.tsx`) pour utiliser `useLivePlans()`
- [x] 5.3 Modifier `/agence/abonnement` (`apps/web/app/agence/abonnement/page.tsx`) pour utiliser `useLivePlans()`
- [x] 5.4 Gérer l'état de chargement (skeleton/spinner) dans chaque page pendant le fetch initial

## 6. Vérification & tests manuels

- [x] 6.1 Vérifier que `/admin/plans` affiche correctement les 5 plans avec tous les champs
- [x] 6.2 Modifier un plan en admin et vérifier que `/tarifs` reflète la modification (après rafraîchissement)
- [x] 6.3 Vérifier le fallback : si l'API `/api/plans/live` est inaccessible, les pages affichent les valeurs hardcodées
- [x] 6.4 Vérifier que le build passe : `pnpm build --filter=@freelancehigh/web`
