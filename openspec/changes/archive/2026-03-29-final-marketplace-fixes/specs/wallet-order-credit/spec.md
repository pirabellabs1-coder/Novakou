## ADDED Requirements

### Requirement: Wallet is credited when order completes normally
The system SHALL credit the freelance (or agency) wallet when an order transitions to `TERMINE` status through normal completion (not just dispute resolution).

#### Scenario: Order completed by client validation
- **WHEN** a client validates delivery and the order status changes to `TERMINE`
- **THEN** the system SHALL upsert `WalletFreelance` with `balance += freelancerPayout` and `totalEarned += freelancerPayout`
- **AND** the system SHALL create a `WalletTransaction` with type `ORDER_PAYOUT` and status `WALLET_COMPLETED`
- **AND** the escrow status SHALL change to `RELEASED`

#### Scenario: Agency order completed
- **WHEN** an order belonging to an agency completes
- **THEN** the system SHALL credit `WalletAgency` instead of `WalletFreelance`

#### Scenario: Wallet already has balance
- **WHEN** the freelance wallet already has a non-zero balance from previous orders
- **THEN** the new payout SHALL be added (incremented) to the existing balance, not overwrite it

#### Scenario: Idempotent wallet credit
- **WHEN** the order completion handler runs but a `WalletTransaction` with the same `orderId` and type `ORDER_PAYOUT` already exists
- **THEN** the system SHALL skip the wallet credit to prevent double-payment

### Requirement: Wallet balance reflects real earnings
The `/api/wallet` GET endpoint SHALL return the actual `WalletFreelance.balance` value without needing to fall back to Order aggregates.

#### Scenario: Wallet shows accumulated balance
- **WHEN** a freelance has completed 3 orders with payouts of 100€, 200€, 150€
- **THEN** the wallet balance SHALL show 450€ (from the wallet table, not from Order aggregation)

#### Scenario: Pending orders show as pending balance
- **WHEN** a freelance has orders in progress (EN_COURS, EN_ATTENTE)
- **THEN** the pending balance SHALL reflect the sum of those order amounts in `WalletFreelance.pending`

### Requirement: Admin wallet receives commission on order completion
When an order completes normally, the admin wallet SHALL receive the platform commission fee.

#### Scenario: Commission credited to admin wallet
- **WHEN** an order with amount 500€ and platformFee 100€ completes
- **THEN** the `AdminWallet.totalFeesReleased` SHALL increment by 100€
- **AND** an `AdminTransaction` SHALL be created or confirmed for this order
