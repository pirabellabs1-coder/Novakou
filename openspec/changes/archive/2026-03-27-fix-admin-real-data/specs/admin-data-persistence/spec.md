## MODIFIED Requirements

### Requirement: Admin user list shows real revenue and spending
The `/api/admin/users` GET endpoint SHALL calculate real revenue and totalSpent from Prisma order data instead of returning hardcoded zeros.

Revenue is the sum of `freelancerPayout` from completed orders where the user is the freelance. TotalSpent is the sum of `amount` from orders where the user is the client.

#### Scenario: Freelancer with completed orders
- **WHEN** an admin views the users list and a freelancer has 5 completed orders totaling €2,500 in freelancerPayout
- **THEN** the user row SHALL display `revenue: 2500` instead of `revenue: 0`

#### Scenario: Client with purchases
- **WHEN** an admin views the users list and a client has spent €1,200 across 3 orders
- **THEN** the user row SHALL display `totalSpent: 1200` instead of `totalSpent: 0`

#### Scenario: User with no orders
- **WHEN** a user has no orders
- **THEN** both `revenue` and `totalSpent` SHALL be `0` (correctly, not hardcoded)

### Requirement: Admin wallet shows real data in all environments
The `/api/admin/wallet` GET endpoint SHALL always return real wallet data from Prisma, not empty mock data in dev mode.

#### Scenario: Admin views wallet in any environment
- **WHEN** an admin calls `GET /api/admin/wallet`
- **THEN** the API SHALL query Prisma for the AdminWallet with real `totalFeesHeld`, `totalFeesReleased`, transactions, and payouts — NOT return hardcoded zeros

#### Scenario: No admin wallet exists yet
- **WHEN** no AdminWallet record exists in the database
- **THEN** the API SHALL create one with default zero values and return it
