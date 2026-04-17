## ADDED Requirements

### Requirement: Formation studentsCount updates on enrollment creation
The system SHALL atomically increment the Formation's `studentsCount` field whenever a new Enrollment is created for that formation.

#### Scenario: New enrollment increments student count
- **WHEN** a new Enrollment is created for formation ID "abc"
- **THEN** `Formation.studentsCount` for "abc" is atomically incremented by 1

#### Scenario: Refunded enrollment decrements student count
- **WHEN** an Enrollment status is changed to REFUNDED
- **THEN** `Formation.studentsCount` is atomically decremented by 1

### Requirement: Formation totalRevenue updates on enrollment creation
The system SHALL atomically increment the Formation's computed revenue whenever a new paid enrollment is created.

#### Scenario: Paid enrollment adds to revenue
- **WHEN** a new Enrollment with paidAmount = 49.99 is created for formation "abc"
- **THEN** the instructor dashboard query for formation "abc" computes totalRevenue = SUM(enrollment.paidAmount) including the new enrollment

### Requirement: Formation rating updates on review creation
The system SHALL recompute the Formation's `rating` field as the average of all FormationReview ratings whenever a review is created or deleted.

#### Scenario: New review updates average rating
- **WHEN** formation "abc" has 3 reviews with ratings [4, 5, 3] and a new review with rating 5 is added
- **THEN** `Formation.rating` is updated to (4+5+3+5)/4 = 4.25, and `Formation.reviewsCount` is updated to 4

#### Scenario: Review deletion recalculates rating
- **WHEN** a review is deleted from formation "abc"
- **THEN** `Formation.rating` is recalculated from remaining reviews, `Formation.reviewsCount` is decremented

### Requirement: Instructor dashboard shows real computed stats
The instructor dashboard SHALL display stats computed from real database aggregations, not hardcoded values.

#### Scenario: Instructor views dashboard with real data
- **WHEN** instructor accesses their dashboard
- **THEN** system computes and returns:
  - totalStudents = SUM of studentsCount across all instructor's formations
  - totalRevenue = SUM of all enrollment.paidAmount for instructor's formations
  - averageRating = weighted average of all formation ratings
  - totalFormations = COUNT of instructor's formations
  - recentEnrollments = latest 10 enrollments across instructor's formations

#### Scenario: Instructor views individual formation stats
- **WHEN** instructor views stats for a specific formation
- **THEN** system returns:
  - studentsCount from Formation model
  - revenue = SUM(enrollment.paidAmount) for that formation
  - averageRating = AVG(review.rating) for that formation
  - reviewsCount = COUNT(reviews) for that formation
  - completionRate = COUNT(enrollments with 100% progress) / COUNT(all enrollments)
  - enrollmentsByMonth = grouped enrollment counts per month

### Requirement: Admin dashboard shows real platform stats
The admin formations dashboard SHALL display platform-wide aggregations from real data.

#### Scenario: Admin views platform stats
- **WHEN** admin accesses formations dashboard
- **THEN** system computes and returns:
  - totalFormations = COUNT of all ACTIF formations
  - totalStudents = COUNT of distinct users with enrollments
  - totalRevenue = SUM of all enrollment.paidAmount
  - averagePlatformRating = AVG of all formation ratings (weighted)
  - topFormations = top 5 by enrollment count
  - recentEnrollments = latest 20 enrollments with user and formation details

### Requirement: Formation detail page shows real stats
The public formation detail page SHALL show stats computed from real data.

#### Scenario: View formation detail with real stats
- **WHEN** user accesses `/[slug]`
- **THEN** formation detail includes:
  - studentsCount from Formation model (pre-computed)
  - rating from Formation model (pre-computed)
  - reviewsCount = COUNT of FormationReview for this formation
  - totalDuration = SUM of lesson durations across all sections
  - totalLessons = COUNT of all lessons across all sections
