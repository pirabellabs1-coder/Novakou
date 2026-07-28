-- API de Conversion (server-side) : token d'accès + code test sur les pixels.
-- Additif : colonnes nullables, aucune donnée existante touchée.
ALTER TABLE "MarketingPixel" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "MarketingPixel" ADD COLUMN IF NOT EXISTS "testEventCode" TEXT;
