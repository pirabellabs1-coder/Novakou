-- 2026-04-18 : tracking DB persistence + mentor packs/notes/reminders + vendor bundles
-- Idempotent (IF NOT EXISTS) to allow re-runs.

-- ── Tracking event log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TrackingEventLog" (
    "id"          TEXT PRIMARY KEY,
    "eventId"     TEXT UNIQUE NOT NULL,
    "type"        TEXT NOT NULL,
    "userId"      TEXT,
    "sessionId"   TEXT NOT NULL,
    "path"        TEXT NOT NULL,
    "entityType"  TEXT,
    "entityId"    TEXT,
    "referrer"    TEXT,
    "utmSource"   TEXT,
    "utmMedium"   TEXT,
    "utmCampaign" TEXT,
    "deviceType"  TEXT NOT NULL,
    "country"     TEXT,
    "userAgent"   TEXT,
    "metadata"    JSONB,
    "isBot"       BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TrackingEventLog_type_createdAt_idx"
    ON "TrackingEventLog" ("type", "createdAt");
CREATE INDEX IF NOT EXISTS "TrackingEventLog_sessionId_idx"
    ON "TrackingEventLog" ("sessionId");
CREATE INDEX IF NOT EXISTS "TrackingEventLog_userId_createdAt_idx"
    ON "TrackingEventLog" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "TrackingEventLog_entityType_entityId_createdAt_idx"
    ON "TrackingEventLog" ("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "TrackingEventLog_path_createdAt_idx"
    ON "TrackingEventLog" ("path", "createdAt");
CREATE INDEX IF NOT EXISTS "TrackingEventLog_createdAt_idx"
    ON "TrackingEventLog" ("createdAt");

-- ── Tracking session log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TrackingSessionLog" (
    "id"           TEXT PRIMARY KEY,
    "userId"       TEXT,
    "startedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt"      TIMESTAMP(3),
    "pageViews"    INTEGER NOT NULL DEFAULT 0,
    "entryPath"    TEXT NOT NULL,
    "exitPath"     TEXT,
    "deviceType"   TEXT NOT NULL,
    "referrer"     TEXT,
    "utmSource"    TEXT,
    "utmMedium"    TEXT,
    "utmCampaign"  TEXT,
    "country"      TEXT,
    "userAgent"    TEXT,
    "isBot"        BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS "TrackingSessionLog_userId_startedAt_idx"
    ON "TrackingSessionLog" ("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "TrackingSessionLog_startedAt_idx"
    ON "TrackingSessionLog" ("startedAt");

-- ── Mentor session packs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MentorSessionPack" (
    "id"                    TEXT PRIMARY KEY,
    "mentorId"              TEXT NOT NULL,
    "title"                 TEXT NOT NULL,
    "sessionsCount"         INTEGER NOT NULL,
    "priceXof"              INTEGER NOT NULL,
    "sessionDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "description"           TEXT,
    "isActive"              BOOLEAN NOT NULL DEFAULT true,
    "validityDays"          INTEGER NOT NULL DEFAULT 180,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorSessionPack_mentorId_fkey"
        FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MentorSessionPack_mentorId_isActive_idx"
    ON "MentorSessionPack" ("mentorId", "isActive");

CREATE TABLE IF NOT EXISTS "MentorSessionPackPurchase" (
    "id"               TEXT PRIMARY KEY,
    "packId"           TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "paidAmount"       INTEGER NOT NULL,
    "sessionsTotal"    INTEGER NOT NULL,
    "sessionsConsumed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt"        TIMESTAMP(3) NOT NULL,
    "refundedAt"       TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorSessionPackPurchase_packId_fkey"
        FOREIGN KEY ("packId") REFERENCES "MentorSessionPack"("id")
);

CREATE INDEX IF NOT EXISTS "MentorSessionPackPurchase_userId_expiresAt_idx"
    ON "MentorSessionPackPurchase" ("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "MentorSessionPackPurchase_packId_idx"
    ON "MentorSessionPackPurchase" ("packId");

-- ── Mentor private notes (CRM) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MentorStudentNote" (
    "id"        TEXT PRIMARY KEY,
    "mentorId"  TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "tags"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorStudentNote_mentorId_fkey"
        FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MentorStudentNote_mentorId_studentId_updatedAt_idx"
    ON "MentorStudentNote" ("mentorId", "studentId", "updatedAt");
CREATE INDEX IF NOT EXISTS "MentorStudentNote_studentId_idx"
    ON "MentorStudentNote" ("studentId");

-- ── Mentor booking reminders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MentorBookingReminder" (
    "id"        TEXT PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "kind"      TEXT NOT NULL,
    "sentAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentorBookingReminder_bookingId_fkey"
        FOREIGN KEY ("bookingId") REFERENCES "MentorBooking"("id") ON DELETE CASCADE,
    CONSTRAINT "MentorBookingReminder_bookingId_kind_key" UNIQUE ("bookingId", "kind")
);

CREATE INDEX IF NOT EXISTS "MentorBookingReminder_bookingId_idx"
    ON "MentorBookingReminder" ("bookingId");

-- ── Link MentorBooking → pack purchase (optional) ────────────────────────────
ALTER TABLE "MentorBooking"
    ADD COLUMN IF NOT EXISTS "packPurchaseId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MentorBooking_packPurchaseId_fkey') THEN
        ALTER TABLE "MentorBooking"
          ADD CONSTRAINT "MentorBooking_packPurchaseId_fkey"
          FOREIGN KEY ("packPurchaseId") REFERENCES "MentorSessionPackPurchase"("id")
          ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MentorBooking_packPurchaseId_idx"
    ON "MentorBooking" ("packPurchaseId");

-- ── Product bundles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ProductBundle" (
    "id"                TEXT PRIMARY KEY,
    "instructeurId"     TEXT NOT NULL,
    "shopId"            TEXT,
    "slug"              TEXT UNIQUE NOT NULL,
    "title"             TEXT NOT NULL,
    "description"       TEXT,
    "thumbnail"         TEXT,
    "priceXof"          INTEGER NOT NULL,
    "originalPriceXof"  INTEGER,
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductBundle_instructeurId_fkey"
        FOREIGN KEY ("instructeurId") REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE,
    CONSTRAINT "ProductBundle_shopId_fkey"
        FOREIGN KEY ("shopId") REFERENCES "VendorShop"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "ProductBundle_instructeurId_isActive_idx"
    ON "ProductBundle" ("instructeurId", "isActive");
CREATE INDEX IF NOT EXISTS "ProductBundle_shopId_idx"
    ON "ProductBundle" ("shopId");

CREATE TABLE IF NOT EXISTS "ProductBundleItem" (
    "id"          TEXT PRIMARY KEY,
    "bundleId"    TEXT NOT NULL,
    "itemKind"    TEXT NOT NULL,
    "formationId" TEXT,
    "productId"   TEXT,
    "order"       INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductBundleItem_bundleId_fkey"
        FOREIGN KEY ("bundleId") REFERENCES "ProductBundle"("id") ON DELETE CASCADE,
    CONSTRAINT "ProductBundleItem_formationId_fkey"
        FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE SET NULL,
    CONSTRAINT "ProductBundleItem_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "ProductBundleItem_bundleId_idx"
    ON "ProductBundleItem" ("bundleId");

CREATE TABLE IF NOT EXISTS "ProductBundlePurchase" (
    "id"         TEXT PRIMARY KEY,
    "bundleId"   TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "paidAmount" INTEGER NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductBundlePurchase_bundleId_fkey"
        FOREIGN KEY ("bundleId") REFERENCES "ProductBundle"("id")
);

CREATE INDEX IF NOT EXISTS "ProductBundlePurchase_bundleId_createdAt_idx"
    ON "ProductBundlePurchase" ("bundleId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductBundlePurchase_userId_idx"
    ON "ProductBundlePurchase" ("userId");
