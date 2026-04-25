## ADDED Requirements

### Requirement: Admin accounting page displays financial KPIs
The system SHALL provide a page at `/admin/comptabilite` displaying key financial indicators filtered by period: total revenue (service sales), total commissions collected, boost revenue, subscription revenue, total refunds, and net result.

#### Scenario: Admin views accounting dashboard
- **WHEN** a super_admin or financier navigates to `/admin/comptabilite`
- **THEN** the page SHALL display KPI cards with: Recettes services, Commissions, Boosts, Abonnements, Remboursements, Résultat net
- **THEN** all values SHALL be filtered by the selected period (default: 1 month)

#### Scenario: Period filter changes KPIs
- **WHEN** the admin changes the period filter from "1 mois" to "1 an"
- **THEN** all KPI values and the invoice table SHALL update to reflect the selected 1-year period

### Requirement: Consolidated invoice table shows all platform transactions
The accounting page SHALL display a table listing all invoiced operations across the platform: client service purchases, freelance/agency subscription payments, and boost purchases.

#### Scenario: Table displays consolidated data
- **WHEN** the admin views the invoice table
- **THEN** each row SHALL show: invoice number, date, type (achat/abonnement/boost), payer name, amount, commission, status
- **THEN** the table SHALL support filtering by type and status
- **THEN** the table SHALL support pagination

### Requirement: CSV export of operations by period
The accounting page SHALL provide a "Télécharger CSV" button that generates and downloads a CSV file containing all operations for the selected period.

#### Scenario: Admin exports 3-month CSV
- **WHEN** the admin selects "3 mois" period and clicks "Télécharger CSV"
- **THEN** the browser SHALL download a CSV file named `comptabilite_FreelanceHigh_YYYY-MM-DD.csv`
- **THEN** the CSV SHALL contain columns: Date, Type, Référence, Payeur, Montant HT, TVA (20%), Montant TTC, Commission, Statut

### Requirement: PDF accounting summary report
The accounting page SHALL provide a "Télécharger PDF" button that generates a formatted PDF summary for the selected period.

#### Scenario: Admin exports annual PDF report
- **WHEN** the admin selects "1 an" and clicks "Télécharger PDF"
- **THEN** the browser SHALL download a branded PDF with: period header, totals by category (services, subscriptions, boosts, refunds), commission totals, and net result

### Requirement: RBAC protects accounting page
The accounting page SHALL only be accessible to admin roles with `comptabilite.view` permission. The permission SHALL be granted to `super_admin` and `financier` roles.

#### Scenario: Unauthorized admin tries to access
- **WHEN** a moderateur navigates to `/admin/comptabilite`
- **THEN** the page SHALL display "Accès non autorisé" with their role name

### Requirement: Sidebar includes accounting menu item
The admin sidebar SHALL include a "Comptabilité" menu item with icon `account_balance` linking to `/admin/comptabilite`, visible only to roles with `comptabilite.view` permission.

#### Scenario: Financier sees accounting in sidebar
- **WHEN** a financier views the admin sidebar
- **THEN** they SHALL see "Comptabilité" in the navigation
