## 1. Permission RBAC + sidebar

- [x] 1.1 Dans `lib/admin-permissions.ts`, ajouter la permission `comptabilite.view` au type `AdminPermission` et l'attribuer aux rôles `super_admin` et `financier`
- [x] 1.2 Dans `lib/admin-permissions.ts` → `ADMIN_NAV_PERMISSIONS`, ajouter `/admin/comptabilite: "comptabilite.view"`
- [x] 1.3 Dans `components/admin/AdminSidebar.tsx`, ajouter l'item "Comptabilité" avec icône `account_balance` et href `/admin/comptabilite` (après "Finances" dans la liste)

## 2. API endpoint `/api/admin/comptabilite`

- [x] 2.1 Créer `app/api/admin/comptabilite/route.ts` avec handler GET protégé par auth admin + `requireAdminPermission("comptabilite.view")`
- [x] 2.2 Accepter les query params `period` (1m, 3m, 6m, 1y, 5y) et optionnellement `startDate`/`endDate` pour personnalisé
- [x] 2.3 En mode dev (IS_DEV), agréger les données depuis orderStore, boostStore, transactionStore pour calculer : recettes services, commissions, boosts, abonnements, remboursements, résultat net + liste des opérations
- [x] 2.4 En mode Prisma, agréger depuis Order, AdminTransaction, Boost, Payment avec les filtres de période
- [x] 2.5 Retourner `{ kpis: {...}, operations: [...], period: string, startDate: string, endDate: string }`

## 3. Page `/admin/comptabilite`

- [x] 3.1 Créer `app/admin/comptabilite/page.tsx` — page "use client" avec `AdminPermissionGuard` permission `comptabilite.view`
- [x] 3.2 Ajouter un sélecteur de période (boutons : 1 mois, 3 mois, 6 mois, 1 an, 5 ans) avec état local
- [x] 3.3 Fetch les données depuis `/api/admin/comptabilite?period=...` au mount et quand la période change
- [x] 3.4 Afficher 6 cartes KPI : Recettes services, Commissions perçues, Revenus boosts, Revenus abonnements, Remboursements, Résultat net
- [x] 3.5 Afficher le tableau des opérations avec colonnes : N° facture, Date, Type, Payeur, Montant, Commission, Statut
- [x] 3.6 Ajouter filtres sur le tableau : type (achat/abonnement/boost/remboursement), statut (payé/en_attente/remboursé)
- [x] 3.7 Ajouter pagination (10 par page)

## 4. Export CSV

- [x] 4.1 Dans la page comptabilité, ajouter un bouton "Exporter CSV" qui génère un fichier CSV côté client
- [x] 4.2 Le CSV doit contenir les colonnes : Date, Type, Référence, Payeur, Montant HT, TVA 20%, Montant TTC, Commission, Statut
- [x] 4.3 Le fichier doit être nommé `comptabilite_FreelanceHigh_YYYY-MM-DD.csv` avec BOM UTF-8 pour Excel

## 5. Export PDF récapitulatif

- [x] 5.1 Créer `lib/pdf/accounting-report.ts` utilisant jsPDF pour générer un récapitulatif comptable
- [x] 5.2 Le PDF doit contenir : en-tête FreelanceHigh, période sélectionnée, tableau récapitulatif par catégorie (recettes services, abonnements, boosts, remboursements, commissions), total net, nombre d'opérations
- [x] 5.3 Dans la page comptabilité, ajouter un bouton "Exporter PDF" qui appelle le générateur et télécharge le fichier

## 6. Vérification

- [x] 6.1 Vérifier que le build passe : `pnpm build --filter=@freelancehigh/web`
- [x] 6.2 Tester que la page comptabilité s'affiche avec les KPI et le tableau
- [x] 6.3 Tester que les exports CSV et PDF se téléchargent correctement
