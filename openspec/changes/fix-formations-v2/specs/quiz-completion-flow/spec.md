## ADDED Requirements

### Requirement: Quiz routes must handle DEV_MODE users
All quiz API routes (`/api/formations/quiz/[quizId]` and `/api/formations/[id]/quiz/submit`) must call `ensureUserInDb` after authentication to prevent FK constraint errors in DEV_MODE.

#### Scenario: Authenticated dev user fetches quiz
- **WHEN** A user authenticated via DEV_MODE dev store fetches `/api/formations/quiz/{quizId}`
- **THEN** The user record is auto-created in Prisma DB if missing, and the quiz data is returned successfully

#### Scenario: Authenticated dev user submits quiz answers
- **WHEN** A DEV_MODE user submits answers to `/api/formations/{id}/quiz/submit`
- **THEN** The user record exists in DB, the quiz is graded, lesson progress is updated, and if 100% complete with passing score, a certificate is generated

### Requirement: Quiz seed data must be complete and realistic
The seed must create quiz records with questions for formations that have QUIZ-type lessons, with realistic question content.

#### Scenario: Seed generates quiz data
- **WHEN** `pnpm --filter=@freelancehigh/db seed` is run
- **THEN** Each formation with QUIZ-type lessons has a Quiz with 4-8 realistic questions, each with 4 options, a correct answer, and an explanation

### Requirement: Instructor profile page handles API errors gracefully
The instructor profile page must check HTTP response status before parsing JSON.

#### Scenario: Instructor profile API returns 404
- **WHEN** A user navigates to `/instructeurs/{id}` and the API returns 404
- **THEN** The page displays "Instructeur introuvable" with a link to explore formations, without crashing or redirecting to dashboard

#### Scenario: Instructor profile API returns valid data
- **WHEN** The API returns a valid instructor profile
- **THEN** The page displays the instructor's bio, courses, reviews, and statistics correctly
