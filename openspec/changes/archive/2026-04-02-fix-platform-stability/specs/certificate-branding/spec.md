## ADDED Requirements

### Requirement: Certificate uses FreelanceHigh brand colors
The certificate PDF and detail page SHALL use the FreelanceHigh brand palette: primary indigo (`#6366f1`), accent violet (`#8b5cf6`), deep text (`#1e1b4b`), with gold (`#d4a843`) reserved for prestige accents. Background SHALL be clean white/near-white (`#fafafa`).

#### Scenario: Certificate PDF is generated
- **WHEN** a certificate PDF is generated via `generateCertificatePDF()`
- **THEN** the PDF SHALL use indigo/violet for headers and borders, gold for seal accents, and near-white background
- **AND** the PDF SHALL NOT use the previous ivory/gold "Sovereign Gilt" palette

#### Scenario: Certificate detail page is displayed
- **WHEN** a user views `/certificats/[id]`
- **THEN** the page SHALL display the certificate with FreelanceHigh brand colors matching the PDF

### Requirement: Certificate displays dates and validity
The certificate SHALL display the start date (enrollment date), completion date, and a 5-year validity period. It SHALL NOT display the quiz score.

#### Scenario: Certificate shows correct dates
- **WHEN** a certificate is displayed (PDF or page)
- **THEN** it SHALL show the enrollment start date, completion date, and "Valid until [completion + 5 years]"
- **AND** it SHALL NOT show any numeric score

### Requirement: Certificate includes FreelanceHigh identity elements
The certificate SHALL include the FreelanceHigh logo or brand name prominently, a unique verification code, a QR code, and guilloche or decorative border elements consistent with the brand.

#### Scenario: Certificate brand elements are present
- **WHEN** a certificate is generated
- **THEN** it SHALL include "FreelanceHigh" brand name, the unique code (FH-XXXX-XXXX-XXXX), a QR code for verification, and decorative borders using brand colors
