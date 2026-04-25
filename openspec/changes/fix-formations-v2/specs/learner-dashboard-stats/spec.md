## ADDED Requirements

### Requirement: Seed data produces realistic learner dashboard stats
The seed must generate enrollment data that creates meaningful stats in the learner dashboard.

#### Scenario: Seed creates varied enrollments
- **WHEN** The seed is run
- **THEN** Enrollments have varied progress (10%, 30%, 50%, 75%, 100%), some with certificates, lesson progress records, and quiz scores

### Requirement: Dashboard stats reflect real enrollment data
Stats cards must show data computed from actual enrollment records, not hardcoded values.

#### Scenario: Learner with enrollments views dashboard
- **WHEN** A learner with 5 enrollments (3 in progress, 2 completed with certificates) views mes-formations
- **THEN** Stats show: 3 en cours, 2 completees, 2 certifications, and total hours computed from formation durations

### Requirement: Data coherence across spaces
Enrollment data visible to the learner must match what the instructor sees in their dashboard and what admin sees in their panel.

#### Scenario: Instructor views their formation stats
- **WHEN** An instructor checks their dashboard
- **THEN** The student count and revenue match the number of enrollments created for their formations

#### Scenario: Admin views platform stats
- **WHEN** An admin views the formations admin dashboard
- **THEN** Total enrollments, revenue, and formation counts match the actual database records
