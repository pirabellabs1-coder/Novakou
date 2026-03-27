### Requirement: SEO editor UI in service management
The service management page (`/dashboard/services`) SHALL provide an SEO editor for each service. The freelancer MUST be able to select a service and edit its `metaTitle`, `metaDescription`, and `tags` via a dedicated SEO panel or modal.

#### Scenario: Freelancer edits SEO fields for a service
- **WHEN** a freelancer clicks "SEO" on a service in `/dashboard/services`
- **THEN** the system SHALL display an editor with current `metaTitle` (max 70 chars), `metaDescription` (max 160 chars), and `tags` (max 10) fields pre-filled from the service data

#### Scenario: SEO score updates in real time
- **WHEN** the freelancer modifies any SEO field in the editor
- **THEN** the system SHALL recalculate and display the SEO score (0-100) in real time, with specific recommendations for improvement

#### Scenario: SEO changes are saved via API
- **WHEN** the freelancer clicks "Enregistrer" in the SEO editor
- **THEN** the system SHALL call `PATCH /api/services/[id]/seo` with the updated fields and display a success confirmation

### Requirement: Service detail page generates proper meta tags
The service detail page (`/services/[slug]`) SHALL use Next.js `generateMetadata()` to produce real SEO meta tags from Prisma data, visible to search engine crawlers.

#### Scenario: Service with custom SEO fields
- **WHEN** a service has `metaTitle: "Creation site web pro"` and `metaDescription: "Je cree votre site..."` in the database
- **THEN** the HTML `<title>` SHALL be "Creation site web pro | FreelanceHigh" and `<meta name="description">` SHALL be "Je cree votre site..."

#### Scenario: Service without custom SEO fields (fallback)
- **WHEN** a service has null `metaTitle` and null `metaDescription`
- **THEN** the HTML `<title>` SHALL fall back to the service `title` and `<meta name="description">` SHALL fall back to the first 160 characters of the service `description`

#### Scenario: Open Graph tags for social sharing
- **WHEN** a service page is shared on social media
- **THEN** the page SHALL include `og:title`, `og:description`, `og:image` (first service image or default), and `og:type: website`

### Requirement: JSON-LD structured data for services
The service detail page SHALL include Schema.org JSON-LD structured data of type `Service` to improve search engine indexing.

#### Scenario: Service with reviews and pricing
- **WHEN** a service has a rating of 4.5, 12 reviews, and base price of 50 EUR
- **THEN** the page SHALL include a `<script type="application/ld+json">` with `@type: Service`, `aggregateRating` with `ratingValue: 4.5` and `reviewCount: 12`, and `offers` with `price: 50` and `priceCurrency: EUR`

### Requirement: Agency SEO editor
The agency service management page (`/agence/services`) SHALL provide the same SEO editor functionality as the freelancer dashboard.

#### Scenario: Agency member edits SEO for an agency service
- **WHEN** an agency admin clicks "SEO" on a service in `/agence/services`
- **THEN** the system SHALL display the same SEO editor as the freelancer dashboard, calling the same API endpoint
