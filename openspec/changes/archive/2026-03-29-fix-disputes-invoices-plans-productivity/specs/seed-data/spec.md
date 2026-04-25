## MODIFIED Requirements

### Requirement: Seed orders produce visible invoices

The `getDefaultOrders()` function in `data-store.ts` SHALL include orders with statuses that the factures page can display (`termine`, `en_cours`, `livre`). At least 3 of the default orders SHALL have `status: "termine"` with valid `completedAt` dates, ensuring the factures page shows meaningful invoice data.

Each seed order SHALL have:
- A unique `serviceTitle` matching a real seed service
- A `clientName` and `clientId` matching seed client profiles
- A realistic `amount` and `commission` (commission = 20% of amount for free tier, or matching the plan)
- A `createdAt` date that produces a chronological invoice history

#### Scenario: Freelance views factures page with seed data
- **WHEN** the dev freelance user loads `/dashboard/factures`
- **THEN** at least 3 invoices appear, each linked to a real order with correct client name, amount, and date

#### Scenario: Invoice amounts match order amounts
- **WHEN** an invoice is generated from a "termine" order with amount 450€
- **THEN** the invoice shows 450€ as the total amount and the correct client name from that order

#### Scenario: Invoice statuses reflect order statuses
- **WHEN** an order has status "termine"
- **THEN** the corresponding invoice shows status "payee"
- **WHEN** an order has status "en_cours" or "livre"
- **THEN** the corresponding invoice shows status "en_attente"

### Requirement: Seed dispute orders have dispute fields

The seed orders with `status: "litige"` (ORD-1004, ORD-1005) SHALL include the dispute fields (`disputeStatus: "ouvert"`, `disputeReason`) so that the admin disputes page can display them correctly without relying on runtime type casting.

#### Scenario: Admin loads disputes page with seed data
- **WHEN** admin visits `/admin/litiges` with fresh seed data
- **THEN** 2 disputes appear with status "Ouvert", showing correct service titles, client/freelance names, and amounts
