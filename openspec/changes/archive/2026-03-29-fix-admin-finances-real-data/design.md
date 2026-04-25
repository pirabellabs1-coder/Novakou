## Context

La plateforme FreelanceHigh a deux pages financières admin :
- `/admin/finances` — tableau de bord temps réel avec transactions, wallet admin et versements
- `/admin/comptabilite` — vue comptable avec KPIs par période, opérations et exports CSV/PDF

Actuellement, les données financières proviennent de **deux systèmes parallèles non synchronisés** :
1. **Table `Payment`** — transactions génériques (type: paiement/commission/retrait/remboursement)
2. **Tables `AdminWallet` + `AdminTransaction`** — commissions plateforme spécifiques (SERVICE_FEE, BOOST_FEE)

Le résultat : `platformRevenue` calculé depuis `Payment` (type=commission) = 3,6€, alors que `AdminWallet.totalFeesReleased` = 139,53€. La page `/admin/comptabilite` retourne une erreur serveur.

### Fichiers concernés
- `apps/web/app/api/admin/finances/route.ts` — API finances
- `apps/web/app/api/admin/comptabilite/route.ts` — API comptabilité
- `apps/web/app/admin/finances/page.tsx` — Page finances
- `apps/web/app/admin/comptabilite/page.tsx` — Page comptabilité
- `apps/web/store/admin.ts` — Store Zustand

## Goals / Non-Goals

**Goals:**
- Les KPIs finances reflètent les vrais montants issus de la DB (pas de dev stores, pas de données inventées)
- Cohérence entre les métriques de `/admin/finances` et `/admin/comptabilite`
- La page comptabilité charge sans erreur et affiche les vraies opérations
- Le "payer" dans la comptabilité affiche un nom lisible (pas un ID Prisma)
- Source de vérité unique : `AdminWallet`/`AdminTransaction` pour les commissions, `Escrow` pour les fonds bloqués, `Order` pour les montants des ventes

**Non-Goals:**
- Modifier le schéma Prisma (pas de migration)
- Ajouter de nouvelles tables ou relations
- Changer le flux de paiement/escrow
- Modifier les dev stores (ils restent pour le dev local sans DB)
- Toucher aux pages non-admin

## Decisions

### 1. Source de vérité pour chaque KPI

| KPI | Source actuelle (bugguée) | Source corrigée |
|-----|--------------------------|-----------------|
| `platformRevenue` | `Payment.aggregate(type=commission, status=COMPLETE)` → 3,6€ | `AdminWallet.totalFeesReleased` → 139,53€ |
| `escrowFunds` | `Order.aggregate(status IN active)` → montant total client | `Escrow.aggregate(status=HELD)` → montant réellement en séquestre |
| `pendingWithdrawals` | `Payment.aggregate(type=retrait, status=EN_ATTENTE)` | Identique (OK) |
| `totalCommissions` | Non affiché distinctement | `AdminWallet.totalFeesHeld + totalFeesReleased` |
| `totalPayments` | `Payment.aggregate(type=paiement, status=COMPLETE)` | `Order.aggregate(status != CANCELLED)._sum.amount` → volume total des ventes |

**Rationale** : L'`AdminWallet` est mis à jour par le flux escrow lors de la création/libération des commandes. Il contient les vrais montants des commissions. La table `Payment` ne reçoit pas toujours une entrée type=commission quand une `AdminTransaction` est créée.

### 2. Comptabilité : requêtes Prisma corrigées

Le endpoint `/api/admin/comptabilite` en mode Prisma fait des queries correctes syntaxiquement mais les données sont incomplètes car :
- Il ne `include` pas le client/freelance pour afficher le nom du payeur
- Le `payer` field affiche `o.clientId` (un CUID) au lieu du nom
- Le statut d'enum Prisma (`TERMINE` vs `DELIVERED` vs `COMPLETE`) peut être mal mappé

**Correction** : Ajouter `include: { client: { select: { name: true } } }` sur les ordres, et résoudre le nom du user pour les boosts.

### 3. Pas de restructuration de la réponse API

On garde la même structure de réponse pour minimiser les changements frontend. Les champs `summary.platformRevenue`, `summary.escrowFunds`, etc. restent identiques — seul le calcul sous-jacent change.

**Alternative rejetée** : Créer un nouveau endpoint `/api/admin/finances/v2`. Inutile — on corrige in-place car il n'y a pas de consommateurs externes.

## Risks / Trade-offs

- **AdminWallet peut ne pas exister** → Le code le crée déjà s'il manque (upsert dans `/api/admin/wallet`). On réutilise ce pattern dans `/api/admin/finances`.
- **Escrow table vide** → Certaines commandes anciennes n'ont peut-être pas de row Escrow. Fallback: utiliser `Order.amount` pour les commandes en cours sans Escrow associé.
- **Performance de la comptabilité** → Les queries par période avec `include` sont plus lourdes. Acceptable car la page n'est consultée que par 1-2 admins.
- **Cohérence dev stores** → On ne touche pas les dev stores. En dev sans DB, les montants resteront approximatifs — c'est acceptable.
