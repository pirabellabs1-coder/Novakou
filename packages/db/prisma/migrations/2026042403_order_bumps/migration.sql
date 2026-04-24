-- OrderBump — offres additionnelles au checkout (Phase 1, feature #1)
-- Permet au vendeur de proposer un produit complémentaire via checkbox
-- sur la page checkout, avant le paiement (boost du panier moyen).

CREATE TABLE IF NOT EXISTS "OrderBump" (
  "id"                  TEXT PRIMARY KEY,
  "instructeurId"       TEXT NOT NULL,
  "shopId"              TEXT,

  "title"               TEXT NOT NULL,
  "description"         TEXT NOT NULL,
  "imageUrl"            TEXT,

  "bumpFormationId"     TEXT,
  "bumpProductId"       TEXT,

  "price"               DOUBLE PRECISION NOT NULL,
  "originalPrice"       DOUBLE PRECISION,

  "appliesToAll"        BOOLEAN NOT NULL DEFAULT FALSE,
  "targetFormationIds"  TEXT[] NOT NULL DEFAULT '{}',
  "targetProductIds"    TEXT[] NOT NULL DEFAULT '{}',

  "viewsCount"          INTEGER NOT NULL DEFAULT 0,
  "acceptedCount"       INTEGER NOT NULL DEFAULT 0,

  "isActive"            BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderBump_instructeurId_fkey"   FOREIGN KEY ("instructeurId")   REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "OrderBump_bumpFormationId_fkey" FOREIGN KEY ("bumpFormationId") REFERENCES "Formation"("id")          ON DELETE SET NULL,
  CONSTRAINT "OrderBump_bumpProductId_fkey"   FOREIGN KEY ("bumpProductId")   REFERENCES "DigitalProduct"("id")     ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "OrderBump_instructeurId_isActive_idx" ON "OrderBump"("instructeurId", "isActive");
CREATE INDEX IF NOT EXISTS "OrderBump_shopId_idx"                 ON "OrderBump"("shopId");
CREATE INDEX IF NOT EXISTS "OrderBump_bumpFormationId_idx"        ON "OrderBump"("bumpFormationId");
CREATE INDEX IF NOT EXISTS "OrderBump_bumpProductId_idx"          ON "OrderBump"("bumpProductId");
