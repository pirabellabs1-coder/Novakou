-- Ajoute instructeurId + shopId sur PlatformRevenue pour permettre des requêtes
-- de wallet vendeur scopées par boutique active sans JOIN polymorphe.

ALTER TABLE "PlatformRevenue"
  ADD COLUMN IF NOT EXISTS "instructeurId" TEXT,
  ADD COLUMN IF NOT EXISTS "shopId" TEXT;

CREATE INDEX IF NOT EXISTS "PlatformRevenue_instructeurId_idx" ON "PlatformRevenue"("instructeurId");
CREATE INDEX IF NOT EXISTS "PlatformRevenue_shopId_idx"        ON "PlatformRevenue"("shopId");

-- Backfill : pour les revenus existants type=formation, retrouver via Enrollment → Formation
UPDATE "PlatformRevenue" pr
SET
  "instructeurId" = f."instructeurId",
  "shopId"        = f."shopId"
FROM "Enrollment" e
JOIN "Formation" f ON f."id" = e."formationId"
WHERE pr."orderType" = 'formation'
  AND pr."orderId"   = e."id"
  AND pr."instructeurId" IS NULL;

UPDATE "PlatformRevenue" pr
SET
  "instructeurId" = p."instructeurId",
  "shopId"        = p."shopId"
FROM "DigitalProductPurchase" pp
JOIN "DigitalProduct" p ON p."id" = pp."productId"
WHERE pr."orderType" = 'product'
  AND pr."orderId"   = pp."id"
  AND pr."instructeurId" IS NULL;
