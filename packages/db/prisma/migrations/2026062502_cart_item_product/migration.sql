-- CartItem polymorphe : peut référencer une formation OU un produit digital.
ALTER TABLE "CartItem" ALTER COLUMN "formationId" DROP NOT NULL;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "productId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_userId_productId_key" ON "CartItem"("userId", "productId");
DO $$ BEGIN
  ALTER TABLE "CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
