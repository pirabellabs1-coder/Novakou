-- ProductInquiry — questions pre-achat des visiteurs (Phase 2 #6)

CREATE TABLE IF NOT EXISTS "ProductInquiry" (
  "id"              TEXT PRIMARY KEY,
  "instructeurId"   TEXT NOT NULL,
  "shopId"          TEXT,
  "formationId"     TEXT,
  "productId"       TEXT,
  "visitorUserId"   TEXT,
  "visitorName"     TEXT NOT NULL,
  "visitorEmail"    TEXT NOT NULL,
  "visitorPhone"    TEXT,
  "subject"         TEXT NOT NULL,
  "message"         TEXT NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "repliedAt"       TIMESTAMP(3),
  "reply"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductInquiry_instructeurId_fkey" FOREIGN KEY ("instructeurId") REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "ProductInquiry_formationId_fkey"   FOREIGN KEY ("formationId")   REFERENCES "Formation"("id")          ON DELETE SET NULL,
  CONSTRAINT "ProductInquiry_productId_fkey"     FOREIGN KEY ("productId")     REFERENCES "DigitalProduct"("id")     ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "ProductInquiry_instructeurId_status_idx" ON "ProductInquiry"("instructeurId", "status");
CREATE INDEX IF NOT EXISTS "ProductInquiry_formationId_idx"          ON "ProductInquiry"("formationId");
CREATE INDEX IF NOT EXISTS "ProductInquiry_productId_idx"            ON "ProductInquiry"("productId");
CREATE INDEX IF NOT EXISTS "ProductInquiry_visitorEmail_idx"         ON "ProductInquiry"("visitorEmail");
CREATE INDEX IF NOT EXISTS "ProductInquiry_createdAt_idx"            ON "ProductInquiry"("createdAt");
