## Why

La page admin `/admin/plans` affiche les 5 plans (Découverte, Ascension, Sommet, Agence Starter, Empire) mais avec un éditeur limité à 6 champs (prix, commission, services, candidatures, boosts). Les 10+ autres paramètres (prix annuel, membres équipe, stockage, certifications, scénarios, productivité, API, support, features) sont absents.

Plus critique : les modifications admin ne se propagent nulle part. La page `/tarifs`, l'espace freelance (`/dashboard/abonnement`) et l'espace agence (`/agence/abonnement`) lisent tous depuis `lib/plans.ts` qui est **hardcodé**. L'admin n'a donc aucun contrôle réel sur les plans affichés sur la plateforme.

**Version cible : MVP** — Les plans et tarifs sont fondamentaux pour la monétisation.

## What Changes

- **Refonte complète de `/admin/plans`** : éditeur riche avec TOUS les champs de chaque plan (prix mensuel/annuel, commission type+valeur, limites services/candidatures/boosts/scénarios/certifications, accès productivité/API/CRM, membres équipe, stockage cloud, niveau support, liste de features affichées)
- **Nouveau endpoint API `/api/plans/live`** (public, GET) : retourne la config des plans fusionnée (admin overrides + defaults de `lib/plans.ts`), mise en cache 60s
- **Refactoring de `lib/plans.ts`** : ajout d'un hook `useLivePlans()` qui fetch la config live depuis l'API et fallback sur les constantes hardcodées
- **Mise à jour de `/tarifs`** : consomme `useLivePlans()` au lieu des constantes hardcodées
- **Mise à jour de `/dashboard/abonnement`** : consomme `useLivePlans()`
- **Mise à jour de `/agence/abonnement`** : consomme `useLivePlans()`
- **AdminConfig enrichie** dans `config-service.ts` : ajout des champs manquants (priceAnnual, scenarioLimit, certificationLimit, productiviteAccess, teamLimit, crmAccess, cloudStorageGB, apiAccess, supportLevel, features[])

**Impact sur les autres rôles** :
- **Admin** : contrôle total sur les plans, propagation immédiate
- **Freelance** : voit les tarifs à jour dans son espace abonnement
- **Agence** : voit les tarifs à jour dans son espace abonnement
- **Public** : page /tarifs reflète les modifications admin en temps réel

**Pas de job BullMQ, Socket.io ou template email nécessaire.**
**Pas d'impact sur le schéma Prisma** — la table `PlatformConfig` stocke déjà les plans en JSON (key-value).

## Capabilities

### New Capabilities
- `live-plans-api`: Endpoint public GET `/api/plans/live` qui retourne la config fusionnée des plans (admin config + defaults), avec cache 60s. Hook React `useLivePlans()` pour consommer cette API côté client.

### Modified Capabilities
_(Aucune spec existante modifiée — il n'y a pas encore de specs dans `openspec/specs/`)_

## Impact

- **`apps/web/app/admin/plans/page.tsx`** : refonte complète de l'UI d'édition
- **`apps/web/lib/plans.ts`** : ajout hook `useLivePlans()`, fonctions de merge
- **`apps/web/lib/admin/config-service.ts`** : enrichissement du type `PlanConfig` et `DEFAULT_CONFIG`
- **`apps/web/store/admin.ts`** : type `AdminConfig.plans` enrichi avec tous les champs
- **`apps/web/app/api/plans/live/route.ts`** : nouvel endpoint public
- **`apps/web/app/(public)/tarifs/page.tsx`** : consomme live plans
- **`apps/web/app/dashboard/abonnement/page.tsx`** : consomme live plans
- **`apps/web/app/agence/abonnement/page.tsx`** : consomme live plans
