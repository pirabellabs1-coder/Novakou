## Context

Quatre bugs interconnectés cassent les flux core en mode dev :

1. **Litiges admin** : `POST /api/admin/disputes` échoue — soit 403 (session null en dev), soit crash sur `orderStore.update()` car `StoredOrder` ne définit pas les champs `disputeStatus/Verdict/etc.` et le code utilise `as Partial<typeof order>` pour contourner TypeScript.

2. **Factures freelance** : La page `/dashboard/factures` mappe `orders → invoices` via `useMemo`, mais les orders dans le store sont vides ou mal filtrées. Les seed orders dans `getDefaultOrders()` existent (ORD-1001 à ORD-1005) mais la page filtre sur `termine|livre|en_cours` — or certaines n'ont pas ces statuts ou le freelanceId ne matche pas le user dev.

3. **Plan actif ignoré** : Le store `dashboard.ts` initialise `currentPlan: "decouverte"` en dur. Aucun mécanisme ne lit `session.user.plan` pour mettre à jour ce champ. Toutes les pages qui checkent le plan (productivité, automatisation, certifications) voient toujours "decouverte".

4. **Plans admin** : La page `/admin/plans` utilise des clés `["decouverte","ascension","sommet","agence_starter","empire"]` tandis que `config-service.ts` stocke `{gratuit, pro, business, agence}`. Lecture = vide, sauvegarde = clés orphelines.

## Goals / Non-Goals

**Goals:**
- Les actions "Examiner" et "Résoudre" sur les litiges admin fonctionnent sans erreur en dev mode
- Les factures freelance/agence affichent des données liées aux vraies commandes du store
- Le plan actif de l'utilisateur est correctement lu depuis la session et utilisé partout
- La page admin plans affiche et édite les plans avec des données cohérentes

**Non-Goals:**
- Pas de refactoring global du système de plans (juste alignement des clés)
- Pas d'ajout de fonctionnalités nouvelles aux litiges (juste fix des actions existantes)
- Pas de migration Prisma (fixes dev mode uniquement pour litiges/factures)
- Pas de changement des prix ou commissions dans `lib/plans.ts` (source de vérité existante)

## Decisions

### D1 : Étendre StoredOrder plutôt que créer un DisputeStore séparé

**Choix** : Ajouter les 6 champs dispute directement à l'interface `StoredOrder`.

**Rationale** : En dev mode, un dispute = un order avec `status: "litige"`. L'API GET disputes lit déjà les orders et extrait les champs dispute avec `(extra as Record<string, unknown>).disputeStatus`. Créer un store séparé impliquerait de refactorer toute la logique GET/POST.

**Alternative rejetée** : Créer un `disputeStore` séparé dans `data-store.ts`. Trop de refactoring pour un fix de bug.

### D2 : Dev auth bypass cohérent avec les autres routes admin

**Choix** : Ajouter le même pattern `IS_DEV` bypass que les autres routes admin utilisent déjà (ex: `/api/admin/users`, `/api/admin/services`).

**Rationale** : En dev mode sans NextAuth configuré, `getServerSession()` retourne `null` → 403. Les autres routes admin ont un fallback dev. La route disputes est la seule sans.

### D3 : Sync plan depuis session dans le layout dashboard

**Choix** : Dans le layout `/dashboard/layout.tsx`, lire `session.user.plan` via `useSession()` et appeler `useDashboardStore.getState().setCurrentPlan(plan)` au mount.

**Rationale** : Le layout est le point d'entrée commun à toutes les pages dashboard. Un seul point de sync garantit la cohérence. L'alternative (chaque page lit la session) est redondante.

**Alternative rejetée** : Convertir chaque page pour utiliser `useSession()` directement. Incohérent et dupliqué.

### D4 : Aligner admin plans sur lib/plans.ts comme source de vérité

**Choix** : `lib/plans.ts` (PLAN_RULES avec clés DECOUVERTE/ASCENSION/SOMMET/etc.) est la source de vérité. Le config-service et la page admin s'alignent dessus.

**Rationale** : `lib/plans.ts` est déjà utilisé par la page publique `/tarifs`, les checks d'accès (`hasProductiviteAccess`), et le calcul des commissions. Tout le reste doit s'aligner.

### D5 : Factures générées depuis les orders réels du store

**Choix** : La page factures conserve sa logique `orders.filter().map()` mais on s'assure que :
1. Les seed orders ont des statuts variés (`termine`, `en_cours`, `livre`) pour le bon freelanceId
2. Le `syncFromApi()` charge bien les orders depuis l'API dev

**Rationale** : La logique de génération est correcte — c'est les données en entrée qui manquent.

## Risks / Trade-offs

- **Auth bypass en dev** → N'impacte que `IS_DEV=true`. En production, l'auth Supabase standard s'applique.
- **Champs dispute sur StoredOrder** → Ajoute de la complexité au type, mais reflète la réalité du modèle dev (dispute = order enrichie).
- **Sync plan dans layout** → Dépend de `useSession()` qui fait un appel réseau. Si session lente, le plan peut flasher "decouverte" brièvement. Mitigation : loading state.
- **Alignement plans** → Le config-service change de clés (`gratuit→decouverte`, etc.). Si du code lit les anciennes clés, il cassera. Mitigation : grep exhaustif avant le changement.
