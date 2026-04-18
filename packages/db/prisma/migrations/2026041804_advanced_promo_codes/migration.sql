-- Advanced promo codes : first-order-only, BOGO, tiered, trigger context.
ALTER TABLE "DiscountCode"
    ADD COLUMN IF NOT EXISTS "firstOrderOnly"   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "bogoQuantityBuy"  INTEGER,
    ADD COLUMN IF NOT EXISTS "bogoQuantityFree" INTEGER,
    ADD COLUMN IF NOT EXISTS "tieredRules"      JSONB,
    ADD COLUMN IF NOT EXISTS "triggerContext"   TEXT;

CREATE INDEX IF NOT EXISTS "DiscountCode_triggerContext_idx"
    ON "DiscountCode" ("triggerContext");
