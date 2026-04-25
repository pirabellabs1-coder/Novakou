## ADDED Requirements

### Requirement: Orders auto-cancel after 72 hours in en_attente
The system SHALL automatically cancel orders that remain in `en_attente` status for more than 72 hours (3 days). The cancellation SHALL set the order status to `annule` with a reason indicating automatic cancellation.

#### Scenario: Order exceeds 72h in en_attente
- **WHEN** an order has been in `en_attente` status for more than 72 hours
- **THEN** the system sets the order status to `annule` and adds a timeline event "Commande annulee automatiquement — le freelance n'a pas accepte dans le delai de 3 jours."

#### Scenario: Order accepted within 72h
- **WHEN** a freelance accepts an order within 72 hours of creation
- **THEN** the order proceeds normally to `en_cours` status and is not auto-cancelled

### Requirement: Orders auto-validate after 7 days in livre
The system SHALL automatically validate orders that remain in `livre` status for more than 7 days without client response. The validation SHALL set the order status to `termine`, set `completedAt` to the current time, and release the escrow funds.

#### Scenario: Order exceeds 7 days in livre
- **WHEN** an order has been in `livre` status for more than 7 days (from `deliveredAt`)
- **THEN** the system sets status to `termine`, `completedAt` to now, `progress` to 100, adds a timeline event "Commande validee automatiquement", and releases escrow funds

#### Scenario: Client validates within 7 days
- **WHEN** a client validates delivery within 7 days
- **THEN** the order is validated normally and escrow funds are released immediately

### Requirement: Auto-cancel API endpoint
The system SHALL provide a `POST /api/orders/auto-cancel` endpoint that finds and cancels all stale `en_attente` orders (> 72h).

#### Scenario: Endpoint cancels stale orders
- **WHEN** `POST /api/orders/auto-cancel` is called
- **THEN** all orders in `en_attente` for more than 72h are cancelled and the response contains `{ cancelled: string[], count: number }`

### Requirement: Auto-validate API endpoint
The system SHALL provide a `POST /api/orders/auto-validate` endpoint that finds and validates all stale `livre` orders (> 7 days) and releases their escrow funds.

#### Scenario: Endpoint validates stale orders
- **WHEN** `POST /api/orders/auto-validate` is called
- **THEN** all orders in `livre` for more than 7 days are validated, escrow funds are released, and the response contains `{ validated: string[], count: number }`

### Requirement: Escrow release on validation
When an order transitions to `termine` (manual or auto), the system SHALL automatically release the escrow funds for the seller.

#### Scenario: Manual validation releases escrow
- **WHEN** client clicks "Valider la livraison" and order moves to `termine`
- **THEN** escrow transaction status changes to `released` and funds are available to the seller

#### Scenario: Auto-validation releases escrow
- **WHEN** order is auto-validated after 7 days
- **THEN** escrow transaction status changes to `released` and funds are available to the seller

### Requirement: Auto-cancel check on page load
When any user loads their order list or order detail page, the system SHALL trigger the auto-cancel and auto-validate endpoints in the background.

#### Scenario: Background check on page load
- **WHEN** a user loads any order-related page
- **THEN** the system calls both `POST /api/orders/auto-cancel` and `POST /api/orders/auto-validate` silently in the background without blocking the UI

### Requirement: Force sync from API on order pages
Order detail pages SHALL always fetch fresh data from the API on mount, not rely solely on cached localStorage data.

#### Scenario: Freelance opens order detail
- **WHEN** freelance navigates to `/dashboard/commandes/[id]`
- **THEN** the page calls `syncFromApi()` and shows a loading skeleton until data is ready, with a fallback direct API fetch for the specific order

#### Scenario: Stale localStorage data
- **WHEN** localStorage contains old order data and fresh API data has a different status
- **THEN** the page displays the fresh API data with correct action banners
