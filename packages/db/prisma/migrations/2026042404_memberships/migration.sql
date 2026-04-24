-- Memberships (abonnements recurrents) — Phase 1 #3
-- Un vendeur cree des SubscriptionPlan, les acheteurs s'abonnent via
-- Subscription, chaque paiement genere une SubscriptionInvoice.

CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id"                  TEXT PRIMARY KEY,
  "instructeurId"       TEXT NOT NULL,
  "shopId"              TEXT,
  "name"                TEXT NOT NULL,
  "description"         TEXT NOT NULL,
  "imageUrl"            TEXT,
  "price"               DOUBLE PRECISION NOT NULL,
  "currency"            TEXT NOT NULL DEFAULT 'XOF',
  "interval"            TEXT NOT NULL,
  "linkedFormationIds"  TEXT[] NOT NULL DEFAULT '{}',
  "linkedProductIds"    TEXT[] NOT NULL DEFAULT '{}',
  "trialDays"           INTEGER,
  "maxMembers"          INTEGER,
  "activeCount"         INTEGER NOT NULL DEFAULT 0,
  "totalEarned"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive"            BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionPlan_instructeurId_fkey" FOREIGN KEY ("instructeurId") REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SubscriptionPlan_instructeurId_isActive_idx" ON "SubscriptionPlan"("instructeurId", "isActive");
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_shopId_idx"                 ON "SubscriptionPlan"("shopId");

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"                  TEXT PRIMARY KEY,
  "userId"              TEXT NOT NULL,
  "planId"              TEXT NOT NULL,
  "status"              TEXT NOT NULL,
  "currentPeriodStart"  TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd"    TIMESTAMP(3) NOT NULL,
  "trialEndsAt"         TIMESTAMP(3),
  "cancelAtPeriodEnd"   BOOLEAN NOT NULL DEFAULT FALSE,
  "cancelledAt"         TIMESTAMP(3),
  "lastPaymentAt"       TIMESTAMP(3),
  "nextInvoiceAt"       TIMESTAMP(3),
  "totalPaid"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "renewalCount"        INTEGER NOT NULL DEFAULT 0,
  "paymentMethod"       TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_planId_key"     ON "Subscription"("userId", "planId");
CREATE INDEX        IF NOT EXISTS "Subscription_userId_idx"            ON "Subscription"("userId");
CREATE INDEX        IF NOT EXISTS "Subscription_planId_idx"            ON "Subscription"("planId");
CREATE INDEX        IF NOT EXISTS "Subscription_status_idx"            ON "Subscription"("status");
CREATE INDEX        IF NOT EXISTS "Subscription_currentPeriodEnd_idx"  ON "Subscription"("currentPeriodEnd");

CREATE TABLE IF NOT EXISTS "SubscriptionInvoice" (
  "id"              TEXT PRIMARY KEY,
  "subscriptionId"  TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "amount"          DOUBLE PRECISION NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'XOF',
  "status"          TEXT NOT NULL,
  "periodStart"     TIMESTAMP(3) NOT NULL,
  "periodEnd"       TIMESTAMP(3) NOT NULL,
  "paymentRef"      TEXT,
  "paymentProvider" TEXT,
  "paidAt"          TIMESTAMP(3),
  "failedAt"        TIMESTAMP(3),
  "errorMessage"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_subscriptionId_idx" ON "SubscriptionInvoice"("subscriptionId");
CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_userId_idx"         ON "SubscriptionInvoice"("userId");
CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_status_idx"         ON "SubscriptionInvoice"("status");
