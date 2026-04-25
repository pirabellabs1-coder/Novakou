### Requirement: Agency profile API returns real data from Prisma
The `/api/public/agences/[slug]` GET endpoint SHALL return real agency data from Prisma in production, including profile info, stats, team members, services, and reviews.

#### Scenario: Visitor fetches existing agency profile
- **WHEN** a visitor accesses `/api/public/agences/[slug]` and the agency exists with `verified: true`
- **THEN** the API SHALL return the agency profile with: agencyName, logo, sector, size, description, website, country, verified status, computed stats (completedOrders, avgRating, totalReviews, activeServices, teamSize), team members array, first 6 active services with ratings, and latest 10 reviews from agency services

#### Scenario: Agency not found
- **WHEN** a visitor accesses `/api/public/agences/[slug]` with a non-existent slug
- **THEN** the API SHALL return 404 "Agence introuvable"

#### Scenario: Stats are computed from real order/review data
- **WHEN** an agency has 15 completed orders, 4.3 average rating across services, 8 reviews, and 5 active services
- **THEN** the stats SHALL reflect: `completedOrders: 15`, `avgRating: 4.3`, `totalReviews: 8`, `activeServices: 5`

### Requirement: Team members come from TeamMember model
The API SHALL return team members from the `TeamMember` Prisma model, joined with User data for name and avatar.

#### Scenario: Agency with 3 team members
- **WHEN** an agency has 3 TeamMember records linked to User accounts
- **THEN** the API SHALL return each member with: id, name, avatar, role, and skills (from FreelancerProfile if available)
