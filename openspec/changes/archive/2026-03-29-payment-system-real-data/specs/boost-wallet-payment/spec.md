## ADDED Requirements

### Requirement: Boost payment SHALL validate wallet balance
Before creating a boost, the system SHALL verify that the freelance's wallet balance covers the boost price.

#### Scenario: Sufficient wallet balance
- **WHEN** freelance requests a boost and their `WalletFreelance.balance >= boostPrice`
- **THEN** the system SHALL debit the wallet by the boost price
- **THEN** the system SHALL create the boost with status ACTIVE
- **THEN** the system SHALL create a WalletTransaction recording the debit

#### Scenario: Insufficient wallet balance
- **WHEN** freelance requests a boost and their `WalletFreelance.balance < boostPrice`
- **THEN** the system SHALL return HTTP 400 with error message "Solde insuffisant"
- **THEN** the boost SHALL NOT be created
- **THEN** no wallet debit SHALL occur

#### Scenario: No wallet exists
- **WHEN** freelance has no WalletFreelance record
- **THEN** the system SHALL create one with balance 0
- **THEN** the system SHALL return HTTP 400 "Solde insuffisant"
