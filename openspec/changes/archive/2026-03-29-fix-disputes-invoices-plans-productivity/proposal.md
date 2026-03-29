## Why

Quatre bugs critiques cassent l'expérience admin et freelance en mode dev :

1. **Litiges admin** — Les actions "Examiner" et "Résoudre" échouent systématiquement (erreur 403 ou crash `orderStore.update()` avec des champs non-typés `disputeStatus`, `disputeVerdict`, etc.)
2. **Factures freelance/agence** — La page `/dashboard/factures` affiche des factures fictives non liées aux vraies commandes (données vides ou mal générées)
3. **Productivité** — La page `/dashboard/productivite` affiche toujours "Passez en Pro" même avec un plan Pro actif, car le store Zustand garde `currentPlan: "decouverte"` au lieu de lire la session
4. **Plans admin** — La page `/admin/plans` utilise des clés (`decouverte`, `ascension`, `sommet`) qui ne matchent pas le config-service (`gratuit`, `pro`, `business`), rendant l'édition des plans non-fonctionnelle

**Version cible :** MVP (ces bugs bloquent la démo et le test des flux core)

## What Changes

### Bug 1 — Litiges admin
- Ajouter les champs dispute (`disputeStatus`, `disputeVerdict`, `disputeVerdictNote`, `disputePartialPercent`, `disputeResolvedAt`, `disputeReason`) à l'interface `StoredOrder` dans `data-store.ts`
- Retirer les casts `as Partial<typeof order>` dans l'API route des disputes
- Ajouter un bypass session dev dans l'API route POST (comme d'autres routes admin le font déjà)
- Vérifier que `createNotification` et `createAuditLog` ne crashent pas en dev mode

### Bug 2 — Factures freelance/agence
- Générer les factures à partir des vraies commandes (store orders) avec des données réalistes
- S'assurer que les seed orders dans `getDefaultOrders()` produisent des factures visibles (statuts `termine`, `livre`, `en_cours`)
- Lier chaque facture à son orderId et afficher client, montant, date de la commande réelle

### Bug 3 — Productivité & plan actif
- Syncer `currentPlan` du store dashboard depuis `session.user.plan` au chargement du layout dashboard
- Mettre à jour la page productivité pour utiliser le plan réel de l'utilisateur
- Même fix pour l'espace agence si applicable

### Bug 4 — Plans admin
- Aligner les clés de plans dans la page `/admin/plans` sur la source de vérité `lib/plans.ts` (clés `decouverte`, `ascension`, `sommet`, `agence_starter`, `empire`)
- Mettre à jour le config-service pour utiliser les mêmes clés
- S'assurer que les commissions et limites affichées correspondent à `lib/plans.ts`

## Capabilities

### New Capabilities
_(aucune — ce sont des fixes de bugs existants)_

### Modified Capabilities
- `dispute-flow`: Fix des actions examine/resolve en dev mode — typage `StoredOrder`, bypass auth dev, suppression des casts dangereux
- `pricing-plans-elevation`: Alignement des clés de plans entre admin UI, config-service et `lib/plans.ts`
- `dashboard-sync`: Sync du plan utilisateur depuis la session JWT vers le store Zustand
- `seed-data`: Enrichissement des données seed pour que les factures soient liées aux commandes réelles

## Impact

**Impact sur les rôles :**
- **Admin** : litiges fonctionnels (examiner + résoudre), plans éditables et cohérents
- **Freelance** : factures liées aux vraies commandes, productivité accessible selon le plan réel
- **Agence** : mêmes fixes factures et plan si applicable

**Fichiers impactés :**
- `apps/web/lib/dev/data-store.ts` — interface `StoredOrder` + seed data
- `apps/web/app/api/admin/disputes/route.ts` — auth dev bypass + typage
- `apps/web/app/dashboard/factures/page.tsx` — logique de génération factures
- `apps/web/app/dashboard/productivite/page.tsx` — check plan réel
- `apps/web/store/dashboard.ts` — sync plan depuis session
- `apps/web/app/admin/plans/page.tsx` — alignement clés plans
- `apps/web/lib/admin/config-service.ts` — clés plans alignées

**Pas d'impact Prisma** (fixes dev mode uniquement pour litiges/factures)
**Pas de job BullMQ, Socket.io ou template email nécessaire**
