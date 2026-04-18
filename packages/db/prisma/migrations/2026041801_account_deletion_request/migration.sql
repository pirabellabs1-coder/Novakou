-- AccountDeletionRequest : flow user demande → cooldown 72h → admin valide → suppression

DO $$ BEGIN
  CREATE TYPE "AccountDeletionStatus" AS ENUM (
    'PENDING_COOLDOWN',
    'AWAITING_REVIEW',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AccountDeletionRequest" (
  "id"            TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL UNIQUE,
  "reason"        TEXT NOT NULL,
  "status"        "AccountDeletionStatus" NOT NULL DEFAULT 'PENDING_COOLDOWN',
  "requestedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cooldownUntil" TIMESTAMP(3) NOT NULL,
  "reviewedAt"    TIMESTAMP(3),
  "reviewedBy"    TEXT,
  "adminNote"     TEXT,
  "completedAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountDeletionRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AccountDeletionRequest_status_idx"        ON "AccountDeletionRequest"("status");
CREATE INDEX IF NOT EXISTS "AccountDeletionRequest_cooldownUntil_idx" ON "AccountDeletionRequest"("cooldownUntil");
