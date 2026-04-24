import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/formations/admin/apply-migration
 *
 * Endpoint one-shot pour appliquer les colonnes paymentRef / paymentProvider /
 * errorMessage à InstructorWithdrawal. Protégé par TEST_PAYOUT_TOKEN.
 *
 * Utilise IF NOT EXISTS donc idempotent — peut être appelé plusieurs fois.
 */
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-test-token") ?? "";
  if (!process.env.TEST_PAYOUT_TOKEN || token !== process.env.TEST_PAYOUT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  const push = (s: string) => { log.push(`[${new Date().toISOString()}] ${s}`); };

  try {
    push("Connecting to DB...");
    // Chaque ALTER TABLE est dans son propre $executeRawUnsafe pour pouvoir
    // detecter quelle etape echoue. ADD COLUMN IF NOT EXISTS -> idempotent.
    const statements = [
      // Migration 2026042402 — withdrawal_payment_ref
      `ALTER TABLE "InstructorWithdrawal" ADD COLUMN IF NOT EXISTS "paymentRef" TEXT`,
      `ALTER TABLE "InstructorWithdrawal" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT`,
      `ALTER TABLE "InstructorWithdrawal" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT`,
      `CREATE INDEX IF NOT EXISTS "InstructorWithdrawal_paymentRef_idx" ON "InstructorWithdrawal"("paymentRef")`,
      // Migration 2026042403 — order_bumps
      `CREATE TABLE IF NOT EXISTS "OrderBump" (
        "id"                 TEXT PRIMARY KEY,
        "instructeurId"      TEXT NOT NULL,
        "shopId"             TEXT,
        "title"              TEXT NOT NULL,
        "description"        TEXT NOT NULL,
        "imageUrl"           TEXT,
        "bumpFormationId"    TEXT,
        "bumpProductId"      TEXT,
        "price"              DOUBLE PRECISION NOT NULL,
        "originalPrice"      DOUBLE PRECISION,
        "appliesToAll"       BOOLEAN NOT NULL DEFAULT FALSE,
        "targetFormationIds" TEXT[] NOT NULL DEFAULT '{}',
        "targetProductIds"   TEXT[] NOT NULL DEFAULT '{}',
        "viewsCount"         INTEGER NOT NULL DEFAULT 0,
        "acceptedCount"      INTEGER NOT NULL DEFAULT 0,
        "isActive"           BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrderBump_instructeurId_fkey"   FOREIGN KEY ("instructeurId")   REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE,
        CONSTRAINT "OrderBump_bumpFormationId_fkey" FOREIGN KEY ("bumpFormationId") REFERENCES "Formation"("id")          ON DELETE SET NULL,
        CONSTRAINT "OrderBump_bumpProductId_fkey"   FOREIGN KEY ("bumpProductId")   REFERENCES "DigitalProduct"("id")     ON DELETE SET NULL
      )`,
      `CREATE INDEX IF NOT EXISTS "OrderBump_instructeurId_isActive_idx" ON "OrderBump"("instructeurId", "isActive")`,
      `CREATE INDEX IF NOT EXISTS "OrderBump_shopId_idx"                 ON "OrderBump"("shopId")`,
      `CREATE INDEX IF NOT EXISTS "OrderBump_bumpFormationId_idx"        ON "OrderBump"("bumpFormationId")`,
      `CREATE INDEX IF NOT EXISTS "OrderBump_bumpProductId_idx"          ON "OrderBump"("bumpProductId")`,
      // Migration 2026042404 — memberships
      `CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
        "id" TEXT PRIMARY KEY,
        "instructeurId" TEXT NOT NULL,
        "shopId" TEXT,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "imageUrl" TEXT,
        "price" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'XOF',
        "interval" TEXT NOT NULL,
        "linkedFormationIds" TEXT[] NOT NULL DEFAULT '{}',
        "linkedProductIds" TEXT[] NOT NULL DEFAULT '{}',
        "trialDays" INTEGER,
        "maxMembers" INTEGER,
        "activeCount" INTEGER NOT NULL DEFAULT 0,
        "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SubscriptionPlan_instructeurId_fkey" FOREIGN KEY ("instructeurId") REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "SubscriptionPlan_instructeurId_isActive_idx" ON "SubscriptionPlan"("instructeurId", "isActive")`,
      `CREATE INDEX IF NOT EXISTS "SubscriptionPlan_shopId_idx" ON "SubscriptionPlan"("shopId")`,

      `CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "planId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "currentPeriodStart" TIMESTAMP(3) NOT NULL,
        "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
        "trialEndsAt" TIMESTAMP(3),
        "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT FALSE,
        "cancelledAt" TIMESTAMP(3),
        "lastPaymentAt" TIMESTAMP(3),
        "nextInvoiceAt" TIMESTAMP(3),
        "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "renewalCount" INTEGER NOT NULL DEFAULT 0,
        "paymentMethod" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_planId_key" ON "Subscription"("userId", "planId")`,
      `CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId")`,
      `CREATE INDEX IF NOT EXISTS "Subscription_planId_idx" ON "Subscription"("planId")`,
      `CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status")`,
      `CREATE INDEX IF NOT EXISTS "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd")`,

      `CREATE TABLE IF NOT EXISTS "SubscriptionInvoice" (
        "id" TEXT PRIMARY KEY,
        "subscriptionId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'XOF',
        "status" TEXT NOT NULL,
        "periodStart" TIMESTAMP(3) NOT NULL,
        "periodEnd" TIMESTAMP(3) NOT NULL,
        "paymentRef" TEXT,
        "paymentProvider" TEXT,
        "paidAt" TIMESTAMP(3),
        "failedAt" TIMESTAMP(3),
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_subscriptionId_idx" ON "SubscriptionInvoice"("subscriptionId")`,
      `CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_userId_idx" ON "SubscriptionInvoice"("userId")`,
      `CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_status_idx" ON "SubscriptionInvoice"("status")`,
      // Migration 2026042405 — product_inquiries
      `CREATE TABLE IF NOT EXISTS "ProductInquiry" (
        "id" TEXT PRIMARY KEY,
        "instructeurId" TEXT NOT NULL,
        "shopId" TEXT,
        "formationId" TEXT,
        "productId" TEXT,
        "visitorUserId" TEXT,
        "visitorName" TEXT NOT NULL,
        "visitorEmail" TEXT NOT NULL,
        "visitorPhone" TEXT,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "repliedAt" TIMESTAMP(3),
        "reply" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductInquiry_instructeurId_fkey" FOREIGN KEY ("instructeurId") REFERENCES "InstructeurProfile"("id") ON DELETE CASCADE,
        CONSTRAINT "ProductInquiry_formationId_fkey"   FOREIGN KEY ("formationId")   REFERENCES "Formation"("id")          ON DELETE SET NULL,
        CONSTRAINT "ProductInquiry_productId_fkey"     FOREIGN KEY ("productId")     REFERENCES "DigitalProduct"("id")     ON DELETE SET NULL
      )`,
      `CREATE INDEX IF NOT EXISTS "ProductInquiry_instructeurId_status_idx" ON "ProductInquiry"("instructeurId", "status")`,
      `CREATE INDEX IF NOT EXISTS "ProductInquiry_formationId_idx"          ON "ProductInquiry"("formationId")`,
      `CREATE INDEX IF NOT EXISTS "ProductInquiry_productId_idx"            ON "ProductInquiry"("productId")`,
      `CREATE INDEX IF NOT EXISTS "ProductInquiry_visitorEmail_idx"         ON "ProductInquiry"("visitorEmail")`,
      `CREATE INDEX IF NOT EXISTS "ProductInquiry_createdAt_idx"            ON "ProductInquiry"("createdAt")`,
    ];

    const results: { sql: string; status: string; error?: string }[] = [];
    for (const sql of statements) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push({ sql: sql.slice(0, 80) + "...", status: "OK" });
        push(`OK: ${sql.slice(0, 60)}...`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ sql: sql.slice(0, 80) + "...", status: "ERROR", error: msg });
        push(`ERROR: ${msg.slice(0, 200)}`);
      }
    }

    // Verif : tenter de SELECT les colonnes pour confirmer qu'elles existent
    push("Verifying columns exist...");
    try {
      const check = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'InstructorWithdrawal'
         AND column_name IN ('paymentRef', 'paymentProvider', 'errorMessage')`,
      );
      push(`Columns found: ${check.map((c) => c.column_name).join(", ")}`);
      return NextResponse.json({ ok: true, results, columnsFound: check, log });
    } catch (e) {
      push(`Verify failed: ${e instanceof Error ? e.message : String(e)}`);
      return NextResponse.json({ ok: false, results, log, verifyError: e instanceof Error ? e.message : String(e) });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    push(`CRASH: ${msg}`);
    return NextResponse.json({ ok: false, error: msg, log });
  }
}
