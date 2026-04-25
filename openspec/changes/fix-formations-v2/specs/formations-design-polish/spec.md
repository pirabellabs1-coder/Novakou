## ADDED Requirements

### Requirement: Formation detail page has professional design
The formation detail page must have consistent spacing, improved card design, and subtle animations.

#### Scenario: User views formation detail page
- **WHEN** A user loads `/{slug}`
- **THEN** The page displays with consistent gap-6 spacing, rounded-2xl cards with subtle shadow-lg, smooth hover transitions, and clear visual hierarchy

### Requirement: Mes-formations dashboard has polished stats
The learner dashboard must display stats with animated counters, gradient backgrounds, and professional chart styling.

#### Scenario: User views mes-formations
- **WHEN** A logged-in learner loads `/mes-formations`
- **THEN** Stats cards have gradient backgrounds, animated counters, hover effects, and charts have smooth animations

### Requirement: Cart page has clean checkout flow
The cart page must have a clean, professional layout with clear pricing, promo code UI, and smooth checkout button.

#### Scenario: User views cart with items
- **WHEN** A learner has items in cart and loads `/panier`
- **THEN** Each cart item shows thumbnail, title, price with clear typography; checkout button is prominent with loading state

### Requirement: Instructor profile has polished presentation
The instructor profile page must present the instructor professionally with proper image handling, stat cards, and course grid.

#### Scenario: User views instructor profile
- **WHEN** A user navigates to `/instructeurs/{id}`
- **THEN** The profile shows a hero section with cover photo/gradient, avatar, badges, and organized tabs for about/courses/reviews
