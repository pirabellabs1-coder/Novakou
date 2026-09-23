-- Adds cover photo URL to VendorShop (per-shop branding)
ALTER TABLE "VendorShop" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
