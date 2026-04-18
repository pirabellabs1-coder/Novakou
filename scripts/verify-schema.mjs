#!/usr/bin/env node
/**
 * Smoke test : verify all new tables created by our migrations are present
 * with the expected columns. Uses Prisma raw queries against the same DB
 * the app uses.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient();

const EXPECTED_TABLES = {
  TrackingEventLog: [
    "id", "eventId", "type", "userId", "sessionId", "path",
    "entityType", "entityId", "referrer",
    "utmSource", "utmMedium", "utmCampaign",
    "deviceType", "country", "userAgent", "metadata", "isBot", "createdAt",
  ],
  TrackingSessionLog: [
    "id", "userId", "startedAt", "lastActiveAt", "endedAt",
    "pageViews", "entryPath", "exitPath", "deviceType",
    "referrer", "utmSource", "utmMedium", "utmCampaign",
    "country", "userAgent", "isBot",
  ],
  MentorSessionPack: [
    "id", "mentorId", "title", "sessionsCount", "priceXof",
    "sessionDurationMinutes", "description", "isActive", "validityDays",
    "createdAt", "updatedAt",
  ],
  MentorSessionPackPurchase: [
    "id", "packId", "userId", "paidAmount", "sessionsTotal",
    "sessionsConsumed", "expiresAt", "refundedAt", "createdAt",
  ],
  MentorStudentNote: [
    "id", "mentorId", "studentId", "content", "tags", "createdAt", "updatedAt",
  ],
  MentorBookingReminder: ["id", "bookingId", "kind", "sentAt"],
  MentorResource: [
    "id", "mentorId", "title", "description", "kind", "url",
    "fileSize", "tags", "isPublic", "createdAt", "updatedAt",
  ],
  MentorResourceShare: [
    "id", "resourceId", "bookingId", "studentId", "sharedAt", "viewedAt",
  ],
  MentorSubscriptionPlan: [
    "id", "mentorId", "title", "sessionsPerMonth", "priceXofPerMonth",
    "sessionDurationMinutes", "description", "isActive",
    "createdAt", "updatedAt",
  ],
  MentorSubscription: [
    "id", "planId", "userId", "status",
    "currentPeriodStart", "currentPeriodEnd",
    "sessionsUsedThisPeriod", "cancelledAt", "createdAt", "updatedAt",
  ],
  ProductBundle: [
    "id", "instructeurId", "shopId", "slug", "title", "description",
    "thumbnail", "priceXof", "originalPriceXof", "isActive",
    "createdAt", "updatedAt",
  ],
  ProductBundleItem: [
    "id", "bundleId", "itemKind", "formationId", "productId", "order",
  ],
  ProductBundlePurchase: [
    "id", "bundleId", "userId", "paidAmount", "createdAt",
  ],
  FormationQuiz: [
    "id", "formationId", "title", "description", "passPct",
    "questions", "isActive", "createdAt", "updatedAt",
  ],
  QuizAttempt: [
    "id", "quizId", "userId", "scorePct", "passed", "answers", "createdAt",
  ],
  LearnerStreak: [
    "id", "userId", "currentStreak", "longestStreak",
    "lastActivityAt", "totalMinutes", "updatedAt",
  ],
  LearnerBadge: [
    "id", "userId", "code", "title", "description", "icon", "unlockedAt",
  ],
  SavedPaymentMethod: [
    "id", "userId", "provider", "token", "brand", "last4",
    "expMonth", "expYear", "isDefault", "createdAt", "updatedAt",
  ],
};

// Also check the new columns we added to existing tables
const EXPECTED_COLUMNS = {
  DiscountCode: [
    "firstOrderOnly", "bogoQuantityBuy", "bogoQuantityFree",
    "tieredRules", "triggerContext",
  ],
  MentorProfile: [
    "discoveryEnabled", "discoveryDurationMinutes", "preSessionQuestions",
  ],
  MentorBooking: [
    "packPurchaseId", "preSessionAnswers", "isDiscovery",
  ],
};

async function main() {
  let ok = 0;
  let missing = 0;
  const missingDetails = [];

  // Fetch all columns for all tables in one query
  const rows = await prisma.$queryRaw`
    SELECT table_name::text as table_name, column_name::text as column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `;

  const byTable = new Map();
  for (const r of rows) {
    const set = byTable.get(r.table_name) ?? new Set();
    set.add(r.column_name);
    byTable.set(r.table_name, set);
  }

  // Check new tables
  for (const [table, cols] of Object.entries(EXPECTED_TABLES)) {
    const present = byTable.get(table);
    if (!present) {
      missing++;
      missingDetails.push(`✗ TABLE MANQUANTE: ${table}`);
      continue;
    }
    const missingCols = cols.filter((c) => !present.has(c));
    if (missingCols.length === 0) {
      console.log(`✓ ${table} (${cols.length} colonnes OK)`);
      ok++;
    } else {
      missing++;
      missingDetails.push(`✗ ${table} — colonnes manquantes: ${missingCols.join(", ")}`);
    }
  }

  // Check added columns on existing tables
  for (const [table, cols] of Object.entries(EXPECTED_COLUMNS)) {
    const present = byTable.get(table);
    if (!present) {
      missing++;
      missingDetails.push(`✗ TABLE ${table} introuvable (???)`);
      continue;
    }
    const missingCols = cols.filter((c) => !present.has(c));
    if (missingCols.length === 0) {
      console.log(`✓ ${table} nouvelles colonnes (${cols.length}) OK`);
      ok++;
    } else {
      missing++;
      missingDetails.push(`✗ ${table} nouvelles colonnes manquantes: ${missingCols.join(", ")}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`RÉSULTAT: ${ok} OK · ${missing} problèmes`);
  if (missingDetails.length > 0) {
    console.log("\nDétails:");
    missingDetails.forEach((d) => console.log("  " + d));
  }
  await prisma.$disconnect();
  process.exit(missing > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[verify-schema] FAILED:", e);
  prisma.$disconnect();
  process.exit(2);
});
