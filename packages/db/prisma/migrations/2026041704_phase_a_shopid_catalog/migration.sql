-- Phase A : multi-shop — séparation du catalogue par boutique
-- 1) Ajouter shopId nullable sur Formation + DigitalProduct
-- 2) Backfill : assigner les produits existants à la boutique principale du vendeur
-- 3) Index pour les requêtes filtrées

ALTER TABLE "Formation"
  ADD COLUMN IF NOT EXISTS "shopId" TEXT;

ALTER TABLE "DigitalProduct"
  ADD COLUMN IF NOT EXISTS "shopId" TEXT;

-- FK vers VendorShop (ON DELETE SET NULL pour ne jamais supprimer un produit)
ALTER TABLE "Formation"
  DROP CONSTRAINT IF EXISTS "Formation_shopId_fkey";
ALTER TABLE "Formation"
  ADD CONSTRAINT "Formation_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "VendorShop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DigitalProduct"
  DROP CONSTRAINT IF EXISTS "DigitalProduct_shopId_fkey";
ALTER TABLE "DigitalProduct"
  ADD CONSTRAINT "DigitalProduct_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "VendorShop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Formation_shopId_idx"      ON "Formation"("shopId");
CREATE INDEX IF NOT EXISTS "DigitalProduct_shopId_idx" ON "DigitalProduct"("shopId");

-- Backfill : pour chaque vendeur ayant une boutique principale, assigner ses produits sans shopId
UPDATE "Formation" f
SET "shopId" = (
  SELECT vs."id"
  FROM "VendorShop" vs
  WHERE vs."instructeurId" = f."instructeurId" AND vs."isPrimary" = true
  LIMIT 1
)
WHERE f."shopId" IS NULL;

UPDATE "DigitalProduct" p
SET "shopId" = (
  SELECT vs."id"
  FROM "VendorShop" vs
  WHERE vs."instructeurId" = p."instructeurId" AND vs."isPrimary" = true
  LIMIT 1
)
WHERE p."shopId" IS NULL;
