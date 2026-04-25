## ADDED Requirements

### Requirement: Agency profile page generates proper meta tags
The agency profile page (`/agences/[slug]`) SHALL use Next.js `generateMetadata()` to produce real SEO meta tags from Prisma data.

#### Scenario: Agency with complete profile
- **WHEN** an agency has name "Studio Digital", description "Agence de creation web", and logo URL
- **THEN** the HTML SHALL include `<title>Studio Digital | FreelanceHigh</title>`, `<meta name="description">` with the agency description, and `og:image` with the logo

#### Scenario: Agency without description
- **WHEN** an agency has no description
- **THEN** the meta description SHALL fall back to "Decouvrez [agencyName] sur FreelanceHigh — [sector]"

### Requirement: JSON-LD Organization for agency profiles
The agency profile page SHALL include Schema.org JSON-LD structured data of type `Organization`.

#### Scenario: Agency with reviews and services
- **WHEN** an agency has a rating of 4.5, 12 reviews, and is in the "Developpement Web" sector
- **THEN** the page SHALL include JSON-LD with `@type: Organization`, `name`, `description`, `url`, `logo`, and `aggregateRating` if reviews exist
