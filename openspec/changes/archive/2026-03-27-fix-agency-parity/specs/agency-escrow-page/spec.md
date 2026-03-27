## ADDED Requirements

### Requirement: Agency escrow page shows fund status per order
The agency space SHALL have an escrow page (`/agence/escrow`) that displays the escrow status of all agency orders, mirroring the freelance escrow page.

#### Scenario: Agency views escrow for active orders
- **WHEN** an agency admin navigates to `/agence/escrow`
- **THEN** the system SHALL display all agency orders with their escrow status: "Fonds en depot" (en_attente), "Escrow actif" (en_cours), "En validation" (livre), "Fonds liberes" (termine), "Rembourse" (annule), "Fonds geles" (litige)

#### Scenario: Agency filters escrow by status
- **WHEN** the agency admin clicks on a status filter (Tous, Escrow, Validation, Libere, Litige)
- **THEN** the list SHALL show only orders matching that escrow category

#### Scenario: Agency sees escrow details per order
- **WHEN** the agency admin views an order's escrow row
- **THEN** the system SHALL display: service title, client name, amount, escrow status badge, commission amount, net payout, and a link to the order detail

### Requirement: Agency escrow data comes from agency orders only
The escrow page SHALL only display orders linked to the agency (via `agencyId`), not the agency owner's personal freelance orders.

#### Scenario: Agency owner with personal freelance orders
- **WHEN** an agency owner also has personal freelance orders
- **THEN** the escrow page SHALL only show orders where `agencyId` matches the agency profile, excluding personal freelance orders
