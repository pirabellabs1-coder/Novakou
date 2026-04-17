-- Add custom domain + shop slug fields to InstructeurProfile and MentorProfile

ALTER TABLE "InstructeurProfile"
  ADD COLUMN IF NOT EXISTS "shopSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "customDomainAddedAt" TIMESTAMP(3);

ALTER TABLE "MentorProfile"
  ADD COLUMN IF NOT EXISTS "shopSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
  ADD COLUMN IF NOT EXISTS "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "customDomainAddedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "InstructeurProfile_shopSlug_key" ON "InstructeurProfile"("shopSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "InstructeurProfile_customDomain_key" ON "InstructeurProfile"("customDomain");
CREATE INDEX IF NOT EXISTS "InstructeurProfile_customDomain_idx" ON "InstructeurProfile"("customDomain");

CREATE UNIQUE INDEX IF NOT EXISTS "MentorProfile_shopSlug_key" ON "MentorProfile"("shopSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "MentorProfile_customDomain_key" ON "MentorProfile"("customDomain");
CREATE INDEX IF NOT EXISTS "MentorProfile_customDomain_idx" ON "MentorProfile"("customDomain");
