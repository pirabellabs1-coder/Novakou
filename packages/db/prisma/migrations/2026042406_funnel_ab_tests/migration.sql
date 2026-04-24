-- A/B Testing sur funnels (Phase 2 #8)

CREATE TABLE IF NOT EXISTS "FunnelABTest" (
  "id"        TEXT PRIMARY KEY,
  "funnelId"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "variantA"  TEXT NOT NULL,
  "variantB"  TEXT NOT NULL,
  "blocksA"   JSONB NOT NULL,
  "blocksB"   JSONB NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "winner"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FunnelABTest_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "SalesFunnel"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "FunnelABTest_funnelId_isActive_idx" ON "FunnelABTest"("funnelId", "isActive");

CREATE TABLE IF NOT EXISTS "FunnelABTestEvent" (
  "id"         TEXT PRIMARY KEY,
  "testId"     TEXT NOT NULL,
  "variant"    TEXT NOT NULL,
  "eventType"  TEXT NOT NULL,
  "visitorId"  TEXT NOT NULL,
  "orderValue" DOUBLE PRECISION,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FunnelABTestEvent_testId_fkey" FOREIGN KEY ("testId") REFERENCES "FunnelABTest"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "FunnelABTestEvent_testId_variant_eventType_idx" ON "FunnelABTestEvent"("testId", "variant", "eventType");
CREATE INDEX IF NOT EXISTS "FunnelABTestEvent_visitorId_idx" ON "FunnelABTestEvent"("visitorId");
