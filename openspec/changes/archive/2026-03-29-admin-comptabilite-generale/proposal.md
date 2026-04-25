## Why

L'admin a une page Finances basique (wallet, transactions, payouts) mais **aucune vue comptable globale**. Il manque :
- Une vue consolidée de toutes les factures de la plateforme (achats clients, abonnements, boosts)
- Un récapitulatif téléchargeable (CSV/PDF) des opérations par période (1 mois, 3 mois, 6 mois, 1 an, 5 ans)
- Un tableau de bord comptable avec recettes, dépenses, commissions, et résultat net
- L'export CSV existant est un stub (juste un toast, pas d'implémentation)

**Version cible : MVP** — La comptabilité est essentielle pour la gestion financière du fondateur.

## What Changes

### A. Nouvelle page `/admin/comptabilite`
- Menu dans le sidebar admin avec icône "account_balance"
- Dashboard comptable avec KPI : recettes totales, commissions perçues, boosts vendus, abonnements actifs, remboursements, résultat net
- Filtrage par période (1 mois, 3 mois, 6 mois, 1 an, 5 ans, personnalisé)

### B. Tableau des factures plateforme
- Liste consolidée de toutes les factures : achats de services (clients), abonnements (freelances/agences), boosts
- Colonnes : N° facture, date, type (achat/abonnement/boost), client/payeur, montant, commission, statut
- Filtrage par type, statut, période
- Pagination

### C. Export récapitulatif (CSV + PDF)
- Bouton "Télécharger le récapitulatif" avec choix de période
- **CSV** : toutes les opérations de la période avec colonnes (date, type, référence, payeur, montant HT, TVA, montant TTC, commission, statut)
- **PDF** : récapitulatif comptable formaté avec totaux par catégorie (recettes services, recettes abonnements, recettes boosts, remboursements, commissions, résultat net)
- Utilise jsPDF existant (`lib/pdf/invoice-template.ts`)

### D. API endpoint `/api/admin/comptabilite`
- GET avec paramètres `period` (1m, 3m, 6m, 1y, 5y, custom) et `startDate`/`endDate`
- Retourne : KPI agrégés + liste des opérations
- En mode dev : calcule depuis les stores existants (orderStore, boostStore, transactionStore)

### E. Ajout permission `comptabilite.view` dans RBAC
- Ajouter dans la matrice de permissions pour `super_admin` et `financier`
- Le guard RBAC protège la page

**Impact :** Admin uniquement
**Pas de migration Prisma** — utilise les modèles existants (Order, Payment, AdminTransaction, Boost)
**Pas de job BullMQ/Socket.io/email**

## Capabilities

### New Capabilities
- `admin-accounting-dashboard`: Page comptabilité admin avec KPI, tableau factures, et exports CSV/PDF par période

### Modified Capabilities
_(Aucune spec existante)_

## Impact

- `components/admin/AdminSidebar.tsx` — Ajout menu "Comptabilité"
- `lib/admin-permissions.ts` — Ajout permission `comptabilite.view`
- `app/admin/comptabilite/page.tsx` — Nouvelle page (à créer)
- `app/api/admin/comptabilite/route.ts` — Nouvel endpoint (à créer)
- `lib/pdf/accounting-report.ts` — Nouveau générateur PDF récapitulatif (à créer)
