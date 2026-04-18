-- Mentor : plans d'abonnement mensuel + souscriptions apprenants
CREATE TABLE IF NOT EXISTS "MentorSubscriptionPlan" (
    "id"                    TEXT PRIMARY KEY,
    "mentorId"              TEXT NOT NULL,
    "title"                 TEXT NOT NULL,
    "sessionsPerMonth"      INTEGER NOT NULL,
    "priceXofPerMonth"      INTEGER NOT NULL,
    "sessionDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "description"           TEXT,
    "isActive"              BOOLEAN NOT NULL DEFAULT true,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "MentorSubscriptionPlan_mentorId_isActive_idx"
    ON "MentorSubscriptionPlan" ("mentorId", "isActive");

CREATE TABLE IF NOT EXISTS "MentorSubscription" (
    "id"                     TEXT PRIMARY KEY,
    "planId"                 TEXT NOT NULL,
    "userId"                 TEXT NOT NULL,
    "status"                 TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd"       TIMESTAMP(3) NOT NULL,
    "sessionsUsedThisPeriod" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt"            TIMESTAMP(3),
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorSubscription_planId_fkey"
        FOREIGN KEY ("planId") REFERENCES "MentorSubscriptionPlan"("id")
);

CREATE INDEX IF NOT EXISTS "MentorSubscription_userId_status_idx"
    ON "MentorSubscription" ("userId", "status");
CREATE INDEX IF NOT EXISTS "MentorSubscription_planId_idx"
    ON "MentorSubscription" ("planId");
