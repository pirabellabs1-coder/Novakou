## ADDED Requirements

### Requirement: Admin orders list returns real data from Prisma
The `/api/admin/orders` GET endpoint SHALL return real orders from Prisma when `USE_PRISMA_FOR_DATA` is true, with all the same fields as the dev store version.

#### Scenario: Admin fetches orders in production
- **WHEN** an admin calls `GET /api/admin/orders` and `USE_PRISMA_FOR_DATA` is true
- **THEN** the API SHALL query `prisma.order.findMany()` with includes for service, client, freelance, and return orders with: id, serviceId, serviceTitle, clientId, clientName, freelanceId, freelanceName, status, amount, commission, packageType, deadline, progress, revisionsLeft, messagesCount, filesCount

#### Scenario: Admin fetches orders with status filter
- **WHEN** an admin calls `GET /api/admin/orders?status=en_attente`
- **THEN** the API SHALL filter orders by status (case-insensitive mapping to Prisma enum)

#### Scenario: Non-admin user attempts to fetch orders
- **WHEN** a non-admin user calls `GET /api/admin/orders`
- **THEN** the API SHALL return 403 "Acces refuse"

### Requirement: Admin order detail returns real data from Prisma
The `/api/admin/orders/[id]` GET endpoint SHALL return a single order with full details from Prisma.

#### Scenario: Admin fetches order detail
- **WHEN** an admin calls `GET /api/admin/orders/[id]`
- **THEN** the API SHALL return the order with all fields including messages, timeline, files, escrow status, and related service/client/freelance data

### Requirement: Admin order actions persist to database
The `/api/admin/orders/[id]` PATCH endpoint SHALL perform mutations via Prisma transactions for all admin actions.

#### Scenario: Admin forces delivery
- **WHEN** an admin calls `PATCH /api/admin/orders/[id]` with `{ action: "force_delivery" }`
- **THEN** the system SHALL update `order.status` to `LIVRE`, set `deliveredAt`, and create a notification for both client and freelance

#### Scenario: Admin releases escrow
- **WHEN** an admin calls `PATCH /api/admin/orders/[id]` with `{ action: "release_escrow" }`
- **THEN** the system SHALL in a single transaction:
  1. Update `order.status` to `TERMINE` and `escrowStatus` to `RELEASED`
  2. Update `escrow.status` to `RELEASED` with `releasedAt`
  3. Move `AdminWallet.totalFeesHeld` to `totalFeesReleased`
  4. Update `AdminTransaction.status` from `PENDING` to `CONFIRMED`
  5. Credit the freelancer's wallet with `freelancerPayout`
  6. Create notifications for both parties

#### Scenario: Admin issues refund
- **WHEN** an admin calls `PATCH /api/admin/orders/[id]` with `{ action: "refund" }`
- **THEN** the system SHALL in a single transaction:
  1. Update `order.status` to `ANNULE` and `escrowStatus` to `REFUNDED`
  2. Update `escrow.status` to `REFUNDED`
  3. Reverse `AdminWallet.totalFeesHeld` by the commission amount
  4. Create `AdminTransaction` of type `REFUND`
  5. Create notifications for both parties

#### Scenario: Admin cancels order
- **WHEN** an admin calls `PATCH /api/admin/orders/[id]` with `{ action: "force_cancel" }`
- **THEN** the system SHALL update `order.status` to `ANNULE` and create notifications

#### Scenario: Admin marks order as disputed
- **WHEN** an admin calls `PATCH /api/admin/orders/[id]` with `{ action: "mark_disputed" }`
- **THEN** the system SHALL update `order.escrowStatus` to `DISPUTED` and `escrow.status` to `DISPUTED`
