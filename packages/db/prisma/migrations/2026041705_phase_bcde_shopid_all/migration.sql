-- Phase B/C/D/E : multi-shop — ajouter shopId sur tous les objets vendeur
-- Marketing, Automatisations, Wallet, Intégrations
-- Backfill: assigner à la boutique principale du vendeur

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'MarketingPixel',
    'AffiliateProgram',
    'DiscountCode',
    'EmailSequence',
    'SalesFunnel',
    'SmartPopup',
    'CampaignTracker',
    'AutomationWorkflow',
    'VendorIntegration',
    'VendorWebhook',
    'VendorApiKey',
    'InstructorWithdrawal'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "shopId" TEXT;', tbl);
    EXECUTE format(
      'ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I;',
      tbl, tbl || '_shopId_fkey'
    );
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("shopId") REFERENCES "VendorShop"("id") ON DELETE SET NULL ON UPDATE CASCADE;',
      tbl, tbl || '_shopId_fkey'
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I("shopId");',
      tbl || '_shopId_idx', tbl
    );
    -- Backfill: pour les rows sans shopId mais avec instructeurId, assigner à la boutique principale
    EXECUTE format($f$
      UPDATE %1$I t
      SET "shopId" = (
        SELECT vs."id" FROM "VendorShop" vs
        WHERE vs."instructeurId" = t."instructeurId" AND vs."isPrimary" = true
        LIMIT 1
      )
      WHERE t."shopId" IS NULL AND t."instructeurId" IS NOT NULL;
    $f$, tbl);
  END LOOP;
END $$;
