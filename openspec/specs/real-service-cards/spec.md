### Requirement: Service cards display real sales count
The service card component SHALL display the real number of completed orders (`orderCount`) from Prisma instead of hardcoded values. This applies to all locations where service cards appear: explorer page, landing page popular services, agency services page, and search results.

#### Scenario: Service with 10 completed orders
- **WHEN** a service has 10 orders with `status: LIVRE` or `status: TERMINE` in the database
- **THEN** the service card SHALL display "10 ventes" on the card

#### Scenario: Service with zero orders
- **WHEN** a service has no completed orders
- **THEN** the service card SHALL display "0 vente" (not hidden, not a fake number)

#### Scenario: Cards on explorer page match cards on landing page
- **WHEN** the same service appears on both `/explorer` and the landing page
- **THEN** both cards SHALL display identical `orderCount`, `rating`, and `ratingCount` values

### Requirement: Service cards display real reviews
The service card SHALL display the real average rating and review count from Prisma. Reviews MUST come from the `Review` model linked to completed orders for that service.

#### Scenario: Service with 5 reviews averaging 4.2 stars
- **WHEN** a service has 5 reviews with an average rating of 4.2
- **THEN** the card SHALL display 4.2 stars and "(5 avis)"

#### Scenario: Service with no reviews
- **WHEN** a service has zero reviews
- **THEN** the card SHALL display "Nouveau" badge instead of stars, and "(0 avis)"

### Requirement: Seller info on service cards shows real data
The vendor section of each service card SHALL display real seller data: avatar from Cloudinary/Supabase, verified badge based on actual `kycLevel >= 3`, real country, and real subscription plan badge.

#### Scenario: Verified freelancer with Pro plan
- **WHEN** the service belongs to a freelancer with `kycLevel: 3` and `subscriptionTier: PRO`
- **THEN** the card SHALL show a "Verifie" badge and a "Pro" badge next to the seller name

#### Scenario: Agency service card
- **WHEN** a service belongs to an agency (has `agencyId`)
- **THEN** the card SHALL display the agency name, agency logo, and "Agence" badge instead of individual freelancer info

### Requirement: API returns real aggregated data for service cards
The `/api/public/services` and `/api/public/top-services` endpoints SHALL return real data from Prisma with `_count` relations for orders and reviews, NOT from dev stores.

#### Scenario: API response includes real counts
- **WHEN** the API is called (in any environment, dev or production)
- **THEN** the response SHALL include `orderCount` from `_count.orders` (where order status is completed), `rating` as average of reviews, and `ratingCount` from `_count.reviews`

#### Scenario: Dev stores are not used for public service data
- **WHEN** `IS_DEV` environment flag is true
- **THEN** the `/api/public/services` and `/api/public/top-services` routes SHALL still query Prisma (not fall back to Zustand dev stores)
