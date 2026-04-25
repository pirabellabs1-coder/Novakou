## Why

Les pages `/admin/finances` et `/admin/comptabilite` affichent des données incohérentes et parfois fausses. Trois problèmes racines :

1. **Double système de tracking financier** : les revenus plateforme sont calculés depuis la table `Payment` (type="commission") qui montre 3,6€, tandis que l'`AdminWallet`/`AdminTransaction` montre 139,53€ libérés — ces deux sources ne sont pas synchronisées.
2. **Calculs escrow incohérents** : l'escrow est calculé en sommant `Order.amount` des commandes en cours (qui donne le montant total client, pas la part plateforme), au lieu d'utiliser la table `Escrow` dédiée ou les champs `platformFee`/`freelancerPayout`.
3. **Comptabilité en erreur** : le endpoint `/api/admin/comptabilite` échoue probablement en production (erreur Prisma sur les queries ou le RBAC), et les KPIs ne reflètent pas les vraies opérations.

La page finances est le centre nerveux financier de la plateforme — des montants faux mettent en danger toute la visibilité fondateur.

## What Changes

- **Unifier la source de vérité financière** : utiliser `AdminWallet` + `AdminTransaction` + `Escrow` comme sources primaires pour les KPIs finances, au lieu des agrégations `Payment` qui sont incomplètes
- **Corriger le calcul escrow** : utiliser la table `Escrow` (status=HELD) au lieu de sommer `Order.amount` des commandes en cours
- **Corriger `/api/admin/comptabilite`** : s'assurer que les requêtes Prisma fonctionnent (gestion erreurs, champs corrects, noms d'enums Prisma)
- **Aligner les KPIs** : `platformRevenue` = `AdminWallet.totalFeesReleased`, `escrowFunds` = `sum(Escrow.amount WHERE status=HELD)`, `totalCommissions` = `AdminWallet.totalFeesHeld + totalFeesReleased`
- **Enrichir le payer dans comptabilité** : afficher le nom réel du client/freelance dans les opérations (via `include` Prisma), pas juste l'ID
- **Supprimer la dépendance aux dev stores** pour ces APIs critiques quand `USE_PRISMA_FOR_DATA=true` (ce qui est le cas sur Vercel)

## Capabilities

### New Capabilities
- `admin-finances-real-data`: Unification des sources de données financières admin (finances + comptabilité) pour refléter les vrais montants depuis Prisma (AdminWallet, AdminTransaction, Escrow, Order)

### Modified Capabilities
- `admin-data-persistence`: Les APIs admin finances/comptabilité doivent utiliser les bonnes tables Prisma comme source de vérité

## Impact

- **API routes modifiées** : `/api/admin/finances/route.ts`, `/api/admin/comptabilite/route.ts`
- **Frontend potentiellement ajusté** : `app/admin/finances/page.tsx` (si les champs de la réponse changent), `app/admin/comptabilite/page.tsx` (gestion erreur)
- **Store Zustand** : `store/admin.ts` — `syncFinances()` pourrait nécessiter un ajustement si la structure de réponse change
- **Pas de migration Prisma** : on utilise les tables existantes (AdminWallet, AdminTransaction, Escrow, Order, Payment) — pas de nouveau schéma
- **Pas d'impact sur les rôles non-admin** : seul l'espace admin est concerné
- **Version cible** : MVP (correction critique)
