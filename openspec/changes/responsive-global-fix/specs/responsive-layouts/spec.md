## ADDED Requirements

### Requirement: Hero stats cards SHALL remain on a single horizontal line on all screen sizes
The 3 stat cards in the hero section (freelances actifs, clients satisfaits, projets livrés) MUST be displayed on a single horizontal row on all breakpoints. On mobile, padding, font size and icon size SHALL be reduced to fit.

#### Scenario: Hero stats on mobile (375px)
- **WHEN** the viewport width is 375px
- **THEN** the 3 stat cards are displayed side by side on one horizontal line with reduced text size (text-xs to text-sm) and compact padding (p-2)

#### Scenario: Hero stats on desktop (1280px)
- **WHEN** the viewport width is 1280px or more
- **THEN** the 3 stat cards are displayed side by side with full text size and standard padding

---

### Requirement: Hero search bar SHALL stack vertically on mobile
The search form in the hero section MUST stack its input fields vertically on screens below 640px.

#### Scenario: Search bar on mobile
- **WHEN** the viewport width is below 640px
- **THEN** the search input, category select, and search button are stacked vertically with full width

#### Scenario: Search bar on desktop
- **WHEN** the viewport width is 640px or above
- **THEN** the search input, category select, and search button are displayed in a single horizontal row

---

### Requirement: Category cards SHALL display 2 per row on mobile with reduced sizing
The category cards grid MUST show 2 columns on mobile, 3 on tablet (md), and 4 on desktop (lg+). Card padding, icon size, and text size SHALL be reduced on mobile.

#### Scenario: Category grid on mobile (375px)
- **WHEN** the viewport width is below 640px
- **THEN** category cards display in a 2-column grid with padding p-4, icon size text-3xl, and text size text-xs

#### Scenario: Category grid on tablet (768px)
- **WHEN** the viewport width is between 640px and 1024px
- **THEN** category cards display in a 3-column grid with padding p-6 and icon size text-4xl

---

### Requirement: Service cards grid SHALL use progressive breakpoints
Service cards across the site (popular services, marketplace, dashboards) MUST use a grid that progresses from 1 column on mobile to 2 on sm, 3 on lg.

#### Scenario: Service cards on mobile
- **WHEN** the viewport width is below 640px
- **THEN** service cards display in a single column with reduced gap (gap-4)

#### Scenario: Service cards on tablet
- **WHEN** the viewport width is between 640px and 1024px
- **THEN** service cards display in a 2-column grid with gap-6

---

### Requirement: Dashboard stat grids SHALL use progressive column breakpoints
All dashboard stat card grids (admin, freelance, client, agence) MUST use progressive breakpoints: 1-col on mobile, 2-col on sm, 3-col on md, and 4-6 col on xl. There SHALL be no column jumps greater than 2x between adjacent breakpoints.

#### Scenario: Admin dashboard stats on mobile
- **WHEN** the viewport width is below 640px
- **THEN** stat cards display in a 2-column grid (compact) or 1-column grid

#### Scenario: Admin dashboard stats on tablet
- **WHEN** the viewport width is between 768px and 1024px
- **THEN** stat cards display in a 3-column grid

---

### Requirement: Mobile sidebars SHALL be constrained to max 85% viewport width
All sidebar overlays on mobile (freelance, client, agence, admin, formations) MUST have a max-width of `min(85vw, 288px)` to prevent overflow on small screens.

#### Scenario: Sidebar on small phone (360px)
- **WHEN** the sidebar overlay is open on a 360px viewport
- **THEN** the sidebar width is max 306px (85% of 360px) and does not overflow the screen

#### Scenario: Sidebar on standard phone (390px)
- **WHEN** the sidebar overlay is open on a 390px viewport
- **THEN** the sidebar width is exactly 288px (capped by max-width)

---

### Requirement: Formation layouts SHALL use flexible height calculations
Formation layout containers (admin, instructeur, apprenant) MUST NOT use hardcoded pixel values in height calculations. They SHALL use `flex-1` or `min-h-[calc(100dvh-12rem)]` with `100vh` fallback.

#### Scenario: Formations layout on mobile with browser chrome
- **WHEN** the viewport is mobile and the browser address bar is visible
- **THEN** the content area adapts its height without overflow or scroll issues

#### Scenario: Formations layout on desktop
- **WHEN** the viewport is desktop (1024px+)
- **THEN** the content area fills available space below the header

---

### Requirement: Dashboard tables SHALL have horizontal scroll on mobile
All data tables in dashboards MUST be wrapped in a container with `overflow-x-auto` and the table itself MUST have `min-w` sufficient to display all columns without cramping.

#### Scenario: Orders table on mobile
- **WHEN** a dashboard table is viewed on a 375px screen
- **THEN** the table scrolls horizontally and all column content remains readable

---

### Requirement: Navbar SHALL provide full navigation on mobile
The mobile navbar MUST include access to all navigation items including currency selector, language selector, and user menu via a mobile hamburger menu or drawer.

#### Scenario: Navbar on mobile
- **WHEN** the viewport width is below 768px
- **THEN** a hamburger menu icon is visible and opens a mobile drawer with all navigation options

---

### Requirement: Text and spacing SHALL scale down on mobile
All heading text, card padding, and gap values MUST use responsive Tailwind classes. Headings SHALL use smaller sizes on mobile (e.g., `text-xl sm:text-2xl lg:text-3xl`). Gaps SHALL be reduced on mobile (e.g., `gap-4 sm:gap-6 lg:gap-8`).

#### Scenario: Landing page headings on mobile
- **WHEN** the viewport width is below 640px
- **THEN** section headings use text-xl or text-2xl maximum and card gaps use gap-4

#### Scenario: Dashboard content on tablet
- **WHEN** the viewport width is between 640px and 1024px
- **THEN** headings use text-2xl and gaps use gap-6
