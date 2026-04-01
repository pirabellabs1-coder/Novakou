## ADDED Requirements

### Requirement: Enrollment is created with correct initial state
The system SHALL create Enrollment records with proper initial values after successful payment.

#### Scenario: Enrollment created after checkout
- **WHEN** payment is verified for cart containing formations A and B
- **THEN** system creates two Enrollment records, each with: userId = authenticated user, formationId = respective formation, paidAmount = price after promo discount, stripeSessionId = Stripe session ID, progress = 0, completedAt = null

### Requirement: User can view their enrolled formations
The system SHALL return all formations a user is enrolled in, with progress data.

#### Scenario: List enrolled formations
- **WHEN** authenticated user sends GET to their enrolled formations endpoint
- **THEN** system returns enrollments with: formation details (title, thumbnail, category), progress percentage, completed lessons count, total lessons count, enrollment date, certificate if issued

#### Scenario: Group by status
- **WHEN** user requests enrolled formations with grouping
- **THEN** system returns enrollments grouped into "En cours" (progress < 100) and "Terminees" (progress = 100)

### Requirement: Lesson progress tracking updates enrollment progress
The system SHALL recalculate enrollment progress percentage when a lesson is marked as complete.

#### Scenario: Mark lesson as complete
- **WHEN** user sends POST `/api/formations/[id]/progress` with `{ lessonId, completed: true }`
- **THEN** system creates or updates LessonProgress record with completed = true and completedAt = now(). System recalculates enrollment progress = (completed lessons / total lessons) * 100. System updates Enrollment.progress field.

#### Scenario: Progress calculation accuracy
- **WHEN** formation has 3 sections with 4, 3, and 5 lessons (12 total) and user completes 6 lessons
- **THEN** enrollment progress = (6/12) * 100 = 50

#### Scenario: Lesson already completed
- **WHEN** user marks a lesson as complete that is already marked complete
- **THEN** system returns success without changing progress (idempotent)

### Requirement: Watch time tracking
The system SHALL track how much of a video lesson the user has watched.

#### Scenario: Update watch percentage
- **WHEN** user sends progress update with `{ lessonId, watchedPct: 75 }`
- **THEN** system updates LessonProgress.watchedPct to 75

### Requirement: Certificate auto-issuance on 100% completion
The system SHALL automatically issue a certificate when enrollment progress reaches 100%, if the formation has `hasCertificate = true`.

#### Scenario: Auto-issue certificate on completion
- **WHEN** the last lesson of a formation with hasCertificate = true is marked complete (progress = 100%)
- **THEN** system creates Certificate record with: unique certificateNumber (format CERT-YYYY-XXXXX), userId, formationId, enrollmentId, score = average quiz score or null, issuedAt = now(), unique verification code. System updates Enrollment.completedAt = now().

#### Scenario: Formation without certificate
- **WHEN** the last lesson of a formation with hasCertificate = false is marked complete
- **THEN** system updates Enrollment.completedAt = now() but does NOT create a Certificate

#### Scenario: Certificate already issued
- **WHEN** progress reaches 100% but a certificate already exists for this enrollment
- **THEN** system does not create a duplicate certificate (idempotent)

### Requirement: Certificate PDF download
The system SHALL generate a PDF certificate on demand when the user requests download.

#### Scenario: Download certificate PDF
- **WHEN** user sends GET `/api/formations/[id]/certificate`
- **THEN** system generates PDF with: student name, formation title, completion date, certificate number, verification code, QR code. Returns PDF file.

#### Scenario: Certificate not yet issued
- **WHEN** user requests certificate download but enrollment is not 100% complete
- **THEN** system returns 404 with message "Certificat non disponible"

### Requirement: Certificate verification by code
The system SHALL allow anyone to verify a certificate's authenticity using its verification code.

#### Scenario: Valid certificate verification
- **WHEN** anyone sends GET `/api/formations/certificats/verify/[code]`
- **THEN** system returns certificate details: student name, formation title, issue date, certificate number, validity status

#### Scenario: Invalid verification code
- **WHEN** invalid code is provided
- **THEN** system returns 404 with message "Certificat introuvable"

### Requirement: Formation review after enrollment
The system SHALL allow enrolled users to leave a review for a formation they are enrolled in.

#### Scenario: Submit review
- **WHEN** enrolled user sends POST `/api/formations/[id]/reviews` with `{ rating: 4, comment: "Excellent cours" }`
- **THEN** system creates FormationReview record, recalculates Formation.rating and reviewsCount, returns the created review

#### Scenario: Duplicate review prevention
- **WHEN** user tries to submit a second review for the same formation
- **THEN** system returns 409 with message "Vous avez deja laisse un avis"

#### Scenario: Non-enrolled user tries to review
- **WHEN** user without enrollment tries to submit a review
- **THEN** system returns 403 with message "Vous devez etre inscrit pour laisser un avis"

### Requirement: Formation detail shows enrollment status
The formation detail page SHALL indicate whether the current user is enrolled.

#### Scenario: User is enrolled
- **WHEN** authenticated user views a formation they are enrolled in
- **THEN** API response includes `{ isEnrolled: true, enrollment: { progress, completedAt } }` and UI shows "Continuer" button

#### Scenario: User is not enrolled
- **WHEN** authenticated user views a formation they are NOT enrolled in
- **THEN** API response includes `{ isEnrolled: false }` and UI shows "Ajouter au panier" and "Ajouter aux favoris" buttons

#### Scenario: Unauthenticated user
- **WHEN** unauthenticated user views a formation
- **THEN** API response includes `{ isEnrolled: false }` and UI shows "Ajouter au panier" with redirect to login on click
