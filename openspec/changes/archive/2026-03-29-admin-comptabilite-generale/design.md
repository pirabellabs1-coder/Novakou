## Context

La page admin Finances (`/admin/finances`) affiche le wallet admin, les transactions de commission, et les payouts. Mais il n'y a pas de vue comptable globale montrant toutes les factures de la plateforme, ni d'export téléchargeable. Le bouton "Exporter" est un stub.

L'infrastructure existe : Orders (source des factures), AdminTransaction (commissions), Boosts, Payments. jsPDF est installé. Il faut assembler ces données dans une vue comptable.

## Goals / Non-Goals

**Goals:**
- Page `/admin/comptabilite` avec dashboard KPI + tableau factures + exports
- Export CSV des opérations par période (vraie implémentation, pas un stub)
- Export PDF récapitulatif comptable avec totaux par catégorie
- Filtrage par période (1m, 3m, 6m, 1y, 5y)
- Protection RBAC (super_admin + financier)

**Non-Goals:**
- Pas de double-entry bookkeeping (journal comptable formel)
- Pas de modèle Invoice dédié en DB (les factures restent dérivées des Orders)
- Pas de TVA configurable (hardcodé 20% comme dans le template PDF existant)
- Pas d'automatisation de rapports (export manuel uniquement)

## Decisions

### 1. Page séparée vs onglet dans Finances

**Choix** : Nouvelle page `/admin/comptabilite` séparée de `/admin/finances`.

**Rationale** : La page Finances est centrée sur le wallet admin et les payouts (opérations). La comptabilité est une vue agrégée et d'export. Séparer les deux garde chaque page focalisée.

### 2. Source de données : agrégation depuis les modèles existants

**Choix** : L'API `/api/admin/comptabilite` agrège depuis Order, AdminTransaction, et Boost sans nouveau modèle.

**Rationale** : Pas de migration Prisma nécessaire. Les données existent déjà. L'agrégation est faite côté serveur pour la performance.

### 3. Export CSV côté client vs serveur

**Choix** : Génération CSV côté client (même pattern que `/client/factures`). Les données sont déjà chargées dans le state.

**Rationale** : Simple, pas de nouveau endpoint. Le volume de données admin (quelques milliers de lignes max au MVP) est gérable côté client.

### 4. Export PDF : jsPDF existant

**Choix** : Réutiliser jsPDF (déjà en dépendance) avec un nouveau template `accounting-report.ts` inspiré de `invoice-template.ts`.

**Rationale** : Pas de nouvelle dépendance. Le template PDF produit un récapitulatif comptable formaté.

### 5. Permission RBAC

**Choix** : Nouvelle permission `comptabilite.view` dans `admin-permissions.ts`, attribuée à `super_admin` et `financier`.

## Risks / Trade-offs

- **Volume de données** : Si des milliers de factures, le CSV côté client peut être lent → Mitigation : pagination dans le tableau, export limité à la période sélectionnée.
- **TVA hardcodée** : 20% en France, pas configurable → Suffisant pour le MVP, configurable en V2 via admin config.
