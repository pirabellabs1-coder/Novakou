## ADDED Requirements

### Requirement: FormationCard has premium visual polish
The FormationCard component SHALL have refined visual styling with better shadow depth, brand-aligned colors, and improved typography hierarchy.

#### Scenario: Card displays in grid mode
- **WHEN** a FormationCard renders in grid mode
- **THEN** it SHALL have a subtle brand accent (indigo/violet left border or top bar), refined shadows (`shadow-sm` default, `shadow-xl` on hover), and clean typography with proper contrast ratios

#### Scenario: Card hover state
- **WHEN** a user hovers over a FormationCard
- **THEN** the card SHALL elevate with `shadow-xl`, the thumbnail SHALL scale subtly, and the title SHALL transition to the brand primary color

### Requirement: Formations homepage has refined visual hierarchy
The formations homepage SHALL have improved section spacing, refined gradient colors matching the brand palette (indigo/violet), and polished component transitions.

#### Scenario: Homepage hero section
- **WHEN** a user visits `/`
- **THEN** the hero SHALL use brand gradient colors (indigo → violet), have clear typography hierarchy, and display stats with a modern glassmorphism style

#### Scenario: Category section styling
- **WHEN** the categories grid displays on the homepage
- **THEN** each category card SHALL have consistent brand-aligned accent colors and smooth hover transitions

### Requirement: Overall brand consistency
All formations UI elements SHALL use the FreelanceHigh brand palette: primary indigo (`#6366f1`), accent violet (`#8b5cf6`), deep text (`#1e1b4b`), gold prestige accents where appropriate.

#### Scenario: Color consistency across pages
- **WHEN** any formations page renders
- **THEN** primary actions SHALL use indigo, secondary elements SHALL use violet, and text SHALL use the deep indigo or standard gray scale
