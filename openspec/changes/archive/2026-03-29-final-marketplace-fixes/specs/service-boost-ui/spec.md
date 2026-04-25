## MODIFIED Requirements

### Requirement: Select dropdowns use dark theme styling
All `<select>` elements on the boost and SEO pages SHALL use dark background (`bg-neutral-dark`) with white text (`text-white`), and `<option>` elements SHALL explicitly set `bg-neutral-dark text-white` to override browser defaults.

#### Scenario: Boost page service selector readable
- **WHEN** a freelance views the boost page and opens the service dropdown
- **THEN** all options SHALL be readable with white text on dark background

#### Scenario: SEO page service selector readable
- **WHEN** a freelance views the SEO optimization page and opens the service dropdown
- **THEN** all options SHALL be readable with white text on dark background

### Requirement: Boost page uses budget input instead of tier selection
The boost page SHALL replace the 3-tier selection (Starter/Premium/Ultime) with a single budget input field. Minimum 5€. Duration and estimated views SHALL be calculated and displayed in real-time.

#### Scenario: Budget input with live preview
- **WHEN** a freelance enters 20€ in the budget field
- **THEN** the page SHALL show estimated duration (e.g., "20 jours"), estimated views, and estimated clicks based on the daily rate

#### Scenario: Agency boost page
- **WHEN** an agency navigates to boost functionality
- **THEN** the same budget input model SHALL be available with the agency's services listed

## ADDED Requirements

### Requirement: Admin KYC displays correct submission data
The admin KYC page SHALL correctly display freelance and agency KYC submissions with consistent field names across dev and Prisma paths.

#### Scenario: KYC queue shows complete data
- **WHEN** the admin views the KYC queue
- **THEN** each submission SHALL display: user name, email, role, current level, requested level, document type, submission date

#### Scenario: KYC approval works for agencies
- **WHEN** the admin approves an agency's KYC Level 3 request
- **THEN** the agency's `kycLevel` SHALL be updated to 3 in the database
- **AND** the agency SHALL receive a notification confirming the upgrade
