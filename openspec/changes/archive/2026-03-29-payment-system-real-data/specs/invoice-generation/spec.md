## ADDED Requirements

### Requirement: Invoice list SHALL return real transaction data
The `/api/billing/invoices` endpoint SHALL reconstruct invoices from completed Orders, paid Boosts, and subscription Payments.

#### Scenario: Freelance views invoice history
- **WHEN** freelance calls GET `/api/billing/invoices`
- **THEN** the response SHALL include invoices for all orders where they are the freelance with status `TERMINE` or `LIVRE`
- **THEN** each invoice SHALL contain: id, reference, date, amount, commission, status, type

#### Scenario: Client views invoice history
- **WHEN** client calls GET `/api/billing/invoices`
- **THEN** the response SHALL include invoices for all orders where they are the client with status `TERMINE` or `LIVRE`

#### Scenario: Boost invoices included
- **WHEN** a user has paid boosts
- **THEN** the invoice list SHALL include entries for each boost with `paidAt` not null
- **THEN** boost invoices SHALL show `totalCost` as amount and type "boost"

#### Scenario: No transactions exist
- **WHEN** a user has no completed orders or paid boosts
- **THEN** the endpoint SHALL return an empty array (not an error)

### Requirement: Invoice PDF SHALL be downloadable
Users SHALL be able to download a PDF invoice for any transaction using the existing `invoice-template.ts`.

#### Scenario: Download invoice PDF
- **WHEN** user requests invoice PDF for a specific transaction
- **THEN** the system SHALL generate the PDF using `lib/pdf/invoice-template.ts`
- **THEN** the PDF SHALL contain: FreelanceHigh header, transaction details, amount HT/TTC, TVA 20%

### Requirement: Invoice SHALL be sent by email on transaction completion
When a transaction is completed (order delivered, boost paid, subscription charged), the system SHALL send the invoice PDF by email via Resend.

#### Scenario: Order completed triggers invoice email
- **WHEN** an order status changes to `TERMINE`
- **THEN** the system SHALL generate an invoice PDF
- **THEN** the system SHALL send the PDF to the client's email via Resend

#### Scenario: Boost payment triggers invoice email
- **WHEN** a boost is paid and activated
- **THEN** the system SHALL generate an invoice PDF
- **THEN** the system SHALL send the PDF to the freelance's email via Resend
