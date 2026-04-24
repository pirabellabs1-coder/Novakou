-- Admin email broadcast campaigns
CREATE TABLE IF NOT EXISTS "AdminCampaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subject" TEXT NOT NULL,
  "htmlBody" TEXT NOT NULL,
  "segment" TEXT NOT NULL,
  "segmentFilter" JSONB,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "sentAt" TIMESTAMP(3),
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "openedCount" INTEGER NOT NULL DEFAULT 0,
  "clickedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AdminCampaign_status_idx" ON "AdminCampaign"("status");
CREATE INDEX IF NOT EXISTS "AdminCampaign_createdAt_idx" ON "AdminCampaign"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminCampaign_createdBy_idx" ON "AdminCampaign"("createdBy");

CREATE TABLE IF NOT EXISTS "AdminCampaignRecipient" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "resendId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "sentAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  CONSTRAINT "AdminCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdminCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AdminCampaignRecipient_campaignId_idx" ON "AdminCampaignRecipient"("campaignId");
CREATE INDEX IF NOT EXISTS "AdminCampaignRecipient_userId_idx" ON "AdminCampaignRecipient"("userId");
CREATE INDEX IF NOT EXISTS "AdminCampaignRecipient_status_idx" ON "AdminCampaignRecipient"("status");
