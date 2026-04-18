-- Apprenant : streaks (série de jours d'étude) + badges gagnés
CREATE TABLE IF NOT EXISTS "LearnerStreak" (
    "id"             TEXT PRIMARY KEY,
    "userId"         TEXT UNIQUE NOT NULL,
    "currentStreak"  INTEGER NOT NULL DEFAULT 0,
    "longestStreak"  INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "totalMinutes"   INTEGER NOT NULL DEFAULT 0,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "LearnerStreak_userId_idx"
    ON "LearnerStreak" ("userId");

CREATE TABLE IF NOT EXISTS "LearnerBadge" (
    "id"          TEXT PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon"        TEXT NOT NULL,
    "unlockedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerBadge_userId_code_key" UNIQUE ("userId", "code")
);

CREATE INDEX IF NOT EXISTS "LearnerBadge_userId_idx"
    ON "LearnerBadge" ("userId");
