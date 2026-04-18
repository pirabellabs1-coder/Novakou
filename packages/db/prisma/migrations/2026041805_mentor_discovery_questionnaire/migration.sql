-- Mentor : session découverte gratuite + questionnaire pré-session
ALTER TABLE "MentorProfile"
    ADD COLUMN IF NOT EXISTS "discoveryEnabled"         BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "discoveryDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    ADD COLUMN IF NOT EXISTS "preSessionQuestions"      JSONB;

-- MentorBooking : stocker les réponses au questionnaire par booking
ALTER TABLE "MentorBooking"
    ADD COLUMN IF NOT EXISTS "preSessionAnswers" JSONB,
    ADD COLUMN IF NOT EXISTS "isDiscovery"       BOOLEAN NOT NULL DEFAULT false;
