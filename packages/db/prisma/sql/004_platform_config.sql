-- Migration: Create PlatformConfig table (key-value store for admin platform settings)
-- This table stores all platform configuration as JSONB key-value pairs.
-- It is used by the admin config panel and the maintenance mode middleware.

CREATE TABLE IF NOT EXISTS "PlatformConfig" (
  "key"        TEXT PRIMARY KEY,
  "value"      JSONB NOT NULL,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy"  TEXT
);

-- Trigger to auto-update updatedAt on row changes
CREATE OR REPLACE FUNCTION update_platform_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_config_updated_at ON "PlatformConfig";
CREATE TRIGGER trg_platform_config_updated_at
  BEFORE UPDATE ON "PlatformConfig"
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_config_updated_at();
