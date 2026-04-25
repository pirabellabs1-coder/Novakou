## Context

La plateforme FreelanceHigh utilise 5 plans d'abonnement (Découverte, Ascension, Sommet, Agence Starter, Empire) définis dans deux endroits :

1. **`lib/plans.ts`** — constantes hardcodées, source de vérité actuelle pour TOUTES les pages UI (tarifs, freelance, agence)
2. **`lib/admin/config-service.ts`** — config dynamique stockée en DB (`PlatformConfig` table), éditable par l'admin

Le problème : ces deux sources ne communiquent pas. L'admin modifie les plans dans `/admin/plans`, la config est sauvegardée en DB, mais aucune page ne la lit. Toutes les pages consomment les constantes hardcodées.

De plus, la page admin `/admin/plans` n'affiche que 6 champs par plan alors qu'il y en a 15+.

## Goals / Non-Goals

**Goals:**
- L'admin peut éditer TOUS les paramètres de chaque plan (prix mensuel/annuel, commission, limites, accès features, support, features list)
- Les modifications admin se propagent en temps réel sur `/tarifs`, `/dashboard/abonnement`, `/agence/abonnement`
- Les constantes hardcodées de `lib/plans.ts` servent de valeurs par défaut (fallback si la config DB est indisponible)
- Cache de 60s sur l'endpoint public pour limiter les requêtes DB

**Non-Goals:**
- Pas de modification du schéma Prisma (la table `PlatformConfig` key-value suffit)
- Pas de WebSocket/Realtime pour les mises à jour de plans (le cache 60s est suffisant)
- Pas de versioning des plans (historique des modifications — l'audit log existant suffit)
- Pas de modification des helpers `calculateCommission()`, `canCreateService()`, etc. — ils continueront à utiliser les constantes de `PLAN_RULES` pour les vérifications côté serveur

## Decisions

### 1. Architecture : API publique + hook React (plutôt que SSR props)

**Choix** : Endpoint `GET /api/plans/live` public + hook `useLivePlans()` côté client.

**Alternatives considérées** :
- **Server Components avec fetch direct** : Plus performant (pas de loading state), mais les pages tarifs/abonnement sont déjà `"use client"` avec beaucoup d'interactivité (toggles, modales). Refactorer en RSC serait disproportionné.
- **getServerSideProps / generateStaticParams** : App Router n'utilise pas getSSP. ISR avec revalidation serait possible mais ajoute de la complexité.

**Rationale** : Le hook client avec SWR/fetch est cohérent avec le pattern existant (Zustand stores + fetch). Le cache HTTP 60s + `stale-while-revalidate` donne un bon compromis performance/fraîcheur.

### 2. Merge strategy : admin config override sur defaults hardcodés

**Choix** : L'endpoint `/api/plans/live` lit la config admin depuis `getConfig()`, puis merge chaque plan sur les defaults de `PLAN_RULES`.

```
Pour chaque plan:
  livePlan = { ...PLAN_RULES[plan], ...adminConfig.plans[plan.lowercase] }
```

**Rationale** : Si l'admin n'a jamais modifié un champ, la valeur hardcodée s'applique. Cela garantit que les nouveaux champs ajoutés dans le code sont immédiatement disponibles sans migration DB.

### 3. Admin UI : formulaire en accordéon (plutôt que modal)

**Choix** : Remplacer la modal d'édition par un formulaire en accordéon/expandable inline pour chaque plan.

**Rationale** : La modal actuelle est trop étroite pour 15+ champs. Un accordéon permet de voir les valeurs actuelles et d'éditer en contexte. L'admin peut aussi comparer les plans visuellement.

### 4. Type `LivePlanConfig` partagé

**Choix** : Créer un type `LivePlanConfig` dans `lib/plans.ts` qui représente un plan avec tous ses champs (union de `PLAN_RULES` et `PlanConfig` admin).

**Rationale** : Un seul type partagé entre l'API et le hook évite les désynchronisations.

### 5. Features list éditable par l'admin

**Choix** : Ajouter un champ `features: string[]` dans la config admin de chaque plan. L'admin peut modifier les bullet points affichés dans les cartes de plan.

**Rationale** : Permet à l'admin de mettre à jour les descriptions marketing sans déploiement. Les `PLAN_FEATURES` hardcodées servent de fallback.

## Risks / Trade-offs

- **Cache stale** : Les modifications admin prennent jusqu'à 60s pour être visibles publiquement → Acceptable pour des changements de tarifs qui sont rares. L'admin voit les changements immédiatement dans son espace.

- **Incohérence server-side / client-side** : Les helpers comme `calculateCommission()` utilisent les constantes hardcodées. Si l'admin change la commission, le calcul côté serveur (escrow, payout) restera sur l'ancienne valeur → **Mitigation** : Pour le MVP, on ne modifie PAS les helpers serveur. Les commissions réelles sont gérées par Stripe. En V2, on pourra faire lire les helpers depuis la config DB.

- **Fallback dégradé** : Si l'API `/api/plans/live` échoue, le hook retourne les constantes hardcodées → L'utilisateur voit toujours des plans cohérents, même si pas à jour.

## Open Questions

- Faut-il permettre à l'admin de désactiver un plan temporairement (visible/caché) ? → **Décision** : Hors scope pour cette itération. À ajouter en V2.
