-- AbandonedCart : permettre les paniers abandonnés par des invités (email seul)
-- userId devient nullable, email ajouté.

-- Drop the old FK so we can make userId nullable without issues
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AbandonedCart_userId_fkey') THEN
    ALTER TABLE "AbandonedCart" DROP CONSTRAINT "AbandonedCart_userId_fkey";
  END IF;
END $$;

ALTER TABLE "AbandonedCart"
    ALTER COLUMN "userId" DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Re-add FK as nullable cascade
ALTER TABLE "AbandonedCart"
    ADD CONSTRAINT "AbandonedCart_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AbandonedCart_email_idx"
    ON "AbandonedCart" ("email");
