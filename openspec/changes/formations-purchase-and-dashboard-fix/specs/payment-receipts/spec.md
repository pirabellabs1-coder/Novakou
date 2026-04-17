## ADDED Requirements

### Requirement: Receipt generated after successful purchase
The system SHALL generate a PDF receipt after every successful formation or product purchase and store it for later download.

#### Scenario: Formation purchased via Stripe
- **WHEN** the checkout callback verifies a successful Stripe payment
- **THEN** a PDF receipt is generated containing: buyer name, email, formation title, amount paid, date, transaction ID, and a "FreelanceHigh" header

#### Scenario: Free formation enrolled
- **WHEN** a user enrolls in a free formation (price = 0)
- **THEN** a PDF receipt is generated with amount "0,00 €" and label "Gratuit"

### Requirement: Receipt downloadable from dashboard
The system SHALL provide a `GET /api/apprenant/receipts/[enrollmentId]` endpoint that returns the receipt PDF.

#### Scenario: User downloads receipt
- **WHEN** an authenticated user requests their receipt via the API
- **THEN** the system returns a PDF file with content-type `application/pdf`

#### Scenario: User cannot download another user's receipt
- **WHEN** a user requests a receipt for an enrollment that belongs to another user
- **THEN** the API returns 403 Forbidden

### Requirement: Receipt link in mes-achats page
The "Mes achats" page SHALL display a download button next to each purchase entry.

#### Scenario: Achats page shows receipt button
- **WHEN** the user visits `/mes-achats`
- **THEN** each purchase entry has a "Télécharger le reçu" button that triggers the receipt download
