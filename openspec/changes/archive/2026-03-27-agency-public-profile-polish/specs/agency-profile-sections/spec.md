## MODIFIED Requirements

### Requirement: Agency profile UI displays real data
The agency profile page SHALL display real data from the Prisma API instead of dev store mock data for all sections: hero, stats, team, services, and reviews.

#### Scenario: Agency profile hero shows real info
- **WHEN** a visitor views an agency profile
- **THEN** the hero section SHALL display the real agency logo (from Cloudinary/Supabase), name, verified badge based on actual `verified` field, sector, country, and team member count from the API

#### Scenario: Stats grid shows real numbers
- **WHEN** the agency has 20 completed orders, 4.6 average rating, and 15 reviews
- **THEN** the stats grid SHALL display these real numbers, not hardcoded or mock values

#### Scenario: Team members section shows real team
- **WHEN** the agency has team members in the TeamMember table
- **THEN** the page SHALL display real avatars, names, roles, and skills for each member

#### Scenario: Services section shows real agency services
- **WHEN** the agency has active services
- **THEN** the services section SHALL display real service cards with titles, prices, ratings, and order counts from Prisma
