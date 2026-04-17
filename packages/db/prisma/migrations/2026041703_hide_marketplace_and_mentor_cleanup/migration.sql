-- Toggle "cacher du marketplace" sur Formation et DigitalProduct
ALTER TABLE "Formation"
  ADD COLUMN IF NOT EXISTS "hiddenFromMarketplace" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "DigitalProduct"
  ADD COLUMN IF NOT EXISTS "hiddenFromMarketplace" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Formation_hiddenFromMarketplace_idx"
  ON "Formation"("hiddenFromMarketplace");
CREATE INDEX IF NOT EXISTS "DigitalProduct_hiddenFromMarketplace_idx"
  ON "DigitalProduct"("hiddenFromMarketplace");

-- Mentor n'a pas le droit aux boutiques custom — drop des colonnes ajoutées par erreur
ALTER TABLE "MentorProfile" DROP COLUMN IF EXISTS "shopSlug";
ALTER TABLE "MentorProfile" DROP COLUMN IF EXISTS "customDomain";
ALTER TABLE "MentorProfile" DROP COLUMN IF EXISTS "customDomainVerified";
ALTER TABLE "MentorProfile" DROP COLUMN IF EXISTS "customDomainAddedAt";
DROP INDEX IF EXISTS "MentorProfile_shopSlug_key";
DROP INDEX IF EXISTS "MentorProfile_customDomain_key";
DROP INDEX IF EXISTS "MentorProfile_customDomain_idx";
