## ADDED Requirements

### Requirement: Dashboard stats reflect real enrollment data
The learner dashboard (`/mes-formations`) SHALL display accurate stats based on the user's actual enrollments from the database.

#### Scenario: User with enrollments sees correct stats
- **WHEN** an authenticated user with 3 enrollments (2 in progress at 40% and 60%, 1 completed at 100% with certificate) visits `/mes-formations`
- **THEN** the "En cours" stat displays 2
- **THEN** the "Complétées" stat displays 1
- **THEN** the "Certifications" stat displays 1
- **THEN** the "Heures d'apprentissage" stat displays the total duration of all 3 formations converted from minutes to hours (rounded)

#### Scenario: User with no enrollments sees empty state
- **WHEN** an authenticated user with 0 enrollments visits `/mes-formations`
- **THEN** all stat cards display 0
- **THEN** an empty state message is shown with a CTA to explore formations
- **THEN** charts display placeholder messages instead of empty charts

#### Scenario: Newly purchased formation appears in dashboard
- **WHEN** a user purchases a formation (via mock or Stripe payment) and then navigates to `/mes-formations`
- **THEN** the enrollment appears in the "En cours" tab with 0% progress
- **THEN** the "En cours" stat increments by 1
- **THEN** the "Heures d'apprentissage" stat includes the new formation's duration

### Requirement: Formation progress updates in real-time
When a user completes lessons in a formation, the progress SHALL update both in the learning page and on the dashboard.

#### Scenario: Completing a lesson updates progress
- **WHEN** a user marks a lesson as completed via PUT `/api/formations/[id]/progress`
- **THEN** the enrollment progress percentage is recalculated
- **THEN** the dashboard reflects the new progress on next visit

#### Scenario: Completing all lessons triggers certificate
- **WHEN** a user completes all lessons (progress reaches 100%) and the average quiz score meets the minimum
- **THEN** a certificate is automatically generated
- **THEN** the "Certifications" stat increments by 1 on next dashboard visit
- **THEN** a "Voir le certificat" link appears on the completed formation card

### Requirement: Stats calculations are correct
The API `/api/apprenant/enrollments` SHALL compute all stats correctly.

#### Scenario: Total hours computation
- **WHEN** the API computes `totalHours`
- **THEN** it sums all formation durations (in minutes) across all enrollments and divides by 60, rounding to nearest integer

#### Scenario: Streak computation
- **WHEN** the API computes `streak`
- **THEN** it counts consecutive days (starting from today going backwards) where the user completed at least one lesson

#### Scenario: Average progress computation
- **WHEN** the frontend computes `averageProgress`
- **THEN** it averages the `progress` field across all enrollments (0-100 scale)
