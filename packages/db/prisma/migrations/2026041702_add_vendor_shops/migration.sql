-- Multi-shop: chaque vendeur peut avoir jusqu'à 5 boutiques (limite côté API).
-- 1) Créer la table VendorShop
-- 2) Backfill: 1 shop "Boutique principale" par InstructeurProfile existant
--    + copier customDomain* depuis InstructeurProfile vers le shop primaire

CREATE TABLE IF NOT EXISTS "VendorShop" (
  "id"                   TEXT PRIMARY KEY,
  "instructeurId"        TEXT NOT NULL,
  "name"                 TEXT NOT NULL,
  "slug"                 TEXT NOT NULL,
  "description"          TEXT,
  "logoUrl"              TEXT,
  "themeColor"           TEXT,
  "isPrimary"            BOOLEAN NOT NULL DEFAULT false,
  "customDomain"         TEXT,
  "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
  "customDomainAddedAt"  TIMESTAMP(3),
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendorShop_instructeurId_fkey"
    FOREIGN KEY ("instructeurId") REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE
);

-- Idempotence : si la table existait déjà via db push sans DEFAULT sur updatedAt,
-- on force la contrainte + on rebouche les NULL avant tout INSERT.
ALTER TABLE "VendorShop" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
UPDATE "VendorShop" SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
UPDATE "VendorShop" SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "createdAt" IS NULL;
ALTER TABLE "VendorShop" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "VendorShop" ALTER COLUMN "createdAt" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "VendorShop_slug_key"         ON "VendorShop"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "VendorShop_customDomain_key" ON "VendorShop"("customDomain");
CREATE INDEX        IF NOT EXISTS "VendorShop_instructeurId_idx"  ON "VendorShop"("instructeurId");
CREATE INDEX        IF NOT EXISTS "VendorShop_slug_idx"           ON "VendorShop"("slug");
CREATE INDEX        IF NOT EXISTS "VendorShop_customDomain_idx"   ON "VendorShop"("customDomain");

-- Backfill: 1 boutique primaire par profil instructeur
-- Slug = shopSlug existant OU "boutique-<id 8 premiers chars>"
INSERT INTO "VendorShop" (
  "id", "instructeurId", "name", "slug", "isPrimary",
  "customDomain", "customDomainVerified", "customDomainAddedAt",
  "createdAt", "updatedAt"
)
SELECT
  'shop_' || substr(md5(random()::text || ip."id"), 1, 16),
  ip."id",
  COALESCE(NULLIF(u."name", ''), 'Boutique'),
  COALESCE(ip."shopSlug", 'boutique-' || substr(ip."id", 1, 8)),
  true,
  ip."customDomain",
  ip."customDomainVerified",
  ip."customDomainAddedAt",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "InstructeurProfile" ip
LEFT JOIN "User" u ON u."id" = ip."userId"
WHERE NOT EXISTS (
  SELECT 1 FROM "VendorShop" vs WHERE vs."instructeurId" = ip."id"
);
