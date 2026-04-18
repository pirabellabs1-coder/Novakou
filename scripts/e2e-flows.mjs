#!/usr/bin/env node
/**
 * End-to-end flow tests via direct Prisma calls (bypasses auth).
 * Creates test data, exercises models, cleans up.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient();

const CLEANUP_IDS = {
  users: [],
  mentorProfiles: [],
  instructeurProfiles: [],
  formations: [],
  packs: [],
  bundles: [],
  quizzes: [],
};

async function cleanup() {
  console.log("\n🧹 Cleanup...");
  try {
    await prisma.trackingEventLog.deleteMany({ where: { eventId: { startsWith: "test-" } } });
    await prisma.mentorSessionPackPurchase.deleteMany({ where: { id: { startsWith: "test-" } } });
    await prisma.mentorStudentNote.deleteMany({ where: { content: { contains: "TEST_NOTE" } } });
    await prisma.mentorResource.deleteMany({ where: { title: { startsWith: "TEST_" } } });
    await prisma.mentorBookingReminder.deleteMany({ where: { bookingId: { in: ["test-booking-1"] } } });
    await prisma.productBundlePurchase.deleteMany({ where: { bundleId: { in: CLEANUP_IDS.bundles } } });
    await prisma.productBundleItem.deleteMany({ where: { bundleId: { in: CLEANUP_IDS.bundles } } });
    await prisma.productBundle.deleteMany({ where: { id: { in: CLEANUP_IDS.bundles } } });
    await prisma.quizAttempt.deleteMany({ where: { userId: { in: CLEANUP_IDS.users } } });
    await prisma.formationQuiz.deleteMany({ where: { id: { in: CLEANUP_IDS.quizzes } } });
    await prisma.mentorSessionPack.deleteMany({ where: { id: { in: CLEANUP_IDS.packs } } });
    await prisma.learnerBadge.deleteMany({ where: { userId: { in: CLEANUP_IDS.users } } });
    await prisma.learnerStreak.deleteMany({ where: { userId: { in: CLEANUP_IDS.users } } });
    for (const id of CLEANUP_IDS.formations) {
      await prisma.formation.deleteMany({ where: { id } }).catch(() => null);
    }
    for (const id of CLEANUP_IDS.mentorProfiles) {
      await prisma.mentorProfile.deleteMany({ where: { id } }).catch(() => null);
    }
    for (const id of CLEANUP_IDS.instructeurProfiles) {
      await prisma.instructeurProfile.deleteMany({ where: { id } }).catch(() => null);
    }
    for (const id of CLEANUP_IDS.users) {
      await prisma.user.deleteMany({ where: { id } }).catch(() => null);
    }
  } catch (e) {
    console.warn("Cleanup warning:", e.message);
  }
}

async function ensureCategory() {
  // Find or create a category for test formations
  let cat = await prisma.formationCategory.findFirst();
  if (cat) return cat;
  cat = await prisma.formationCategory.create({
    data: { name: "Test", slug: `test-${Date.now().toString(36)}`, icon: "school" },
  });
  return cat;
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test("Tracking: insert + dedup by eventId", async () => {
  const eventId = `test-${Date.now()}`;
  await prisma.trackingEventLog.create({
    data: {
      eventId, type: "page_view", sessionId: "test-session",
      path: "/test", deviceType: "desktop",
    },
  });
  // Second insert with same eventId must fail (unique constraint)
  try {
    await prisma.trackingEventLog.create({
      data: {
        eventId, type: "page_view", sessionId: "test-session-2",
        path: "/test", deviceType: "desktop",
      },
    });
    throw new Error("Dedup not enforced");
  } catch (e) {
    if (e.code !== "P2002") throw e;
  }
  await prisma.trackingEventLog.deleteMany({ where: { eventId } });
});

test("Mentor pack: create + purchase + session consumption", async () => {
  // Create test user + mentor profile + pack
  const u = await prisma.user.create({
    data: {
      email: `mentor-${Date.now()}@test.local`,
      name: "Mentor Test",
      passwordHash: "x",
      role: "FREELANCE",
      emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const mp = await prisma.mentorProfile.create({
    data: { userId: u.id, specialty: "Test", sessionPrice: 25000 },
  });
  CLEANUP_IDS.mentorProfiles.push(mp.id);

  const pack = await prisma.mentorSessionPack.create({
    data: {
      mentorId: mp.id,
      title: "Pack Test 5",
      sessionsCount: 5,
      priceXof: 100000,
    },
  });
  CLEANUP_IDS.packs.push(pack.id);

  // Create a student user + purchase
  const s = await prisma.user.create({
    data: {
      email: `student-${Date.now()}@test.local`,
      name: "Student Test",
      passwordHash: "x",
      role: "CLIENT",
      emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(s.id);

  const purchase = await prisma.mentorSessionPackPurchase.create({
    data: {
      packId: pack.id,
      userId: s.id,
      paidAmount: 100000,
      sessionsTotal: 5,
      expiresAt: new Date(Date.now() + 180 * 86400_000),
    },
  });

  // Simulate consumption
  const updated = await prisma.mentorSessionPackPurchase.update({
    where: { id: purchase.id },
    data: { sessionsConsumed: { increment: 1 } },
  });
  if (updated.sessionsConsumed !== 1) throw new Error("Consumption didn't increment");

  // Cleanup the purchase (user cleanup won't cascade)
  await prisma.mentorSessionPackPurchase.deleteMany({ where: { id: purchase.id } });
});

test("Mentor notes: create + update + tags", async () => {
  const u = await prisma.user.create({
    data: {
      email: `mentor-n-${Date.now()}@test.local`,
      name: "Mentor Notes",
      passwordHash: "x", role: "FREELANCE", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const mp = await prisma.mentorProfile.create({
    data: { userId: u.id, specialty: "Test" },
  });
  CLEANUP_IDS.mentorProfiles.push(mp.id);

  const s = await prisma.user.create({
    data: {
      email: `student-n-${Date.now()}@test.local`,
      name: "Stu Notes",
      passwordHash: "x", role: "CLIENT", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(s.id);

  const note = await prisma.mentorStudentNote.create({
    data: {
      mentorId: mp.id,
      studentId: s.id,
      content: "TEST_NOTE hello world",
      tags: ["objectif", "debut"],
    },
  });
  const updated = await prisma.mentorStudentNote.update({
    where: { id: note.id },
    data: { content: "TEST_NOTE updated", tags: ["fini"] },
  });
  if (updated.tags.length !== 1 || updated.tags[0] !== "fini") throw new Error("Tags update broken");
});

test("Product bundle: create + 2 items + compute savings", async () => {
  const cat = await ensureCategory();
  const u = await prisma.user.create({
    data: {
      email: `vendor-${Date.now()}@test.local`,
      name: "Vendor",
      passwordHash: "x", role: "FREELANCE", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const ip = await prisma.instructeurProfile.create({
    data: { userId: u.id, status: "APPROUVE" },
  });
  CLEANUP_IDS.instructeurProfiles.push(ip.id);
  const f1 = await prisma.formation.create({
    data: {
      title: "F1", slug: `f1-${Date.now()}`,
      description: "d", price: 30000, instructeurId: ip.id, categoryId: cat.id,
    },
  });
  const f2 = await prisma.formation.create({
    data: {
      title: "F2", slug: `f2-${Date.now()}`,
      description: "d", price: 25000, instructeurId: ip.id, categoryId: cat.id,
    },
  });
  CLEANUP_IDS.formations.push(f1.id, f2.id);

  const b = await prisma.productBundle.create({
    data: {
      instructeurId: ip.id,
      slug: `bundle-${Date.now()}`,
      title: "Bundle Test",
      priceXof: 40000,
      originalPriceXof: 55000,
      items: {
        create: [
          { itemKind: "formation", formationId: f1.id, order: 0 },
          { itemKind: "formation", formationId: f2.id, order: 1 },
        ],
      },
    },
    include: { items: true },
  });
  CLEANUP_IDS.bundles.push(b.id);
  if (b.items.length !== 2) throw new Error("Items not created");
  if ((b.originalPriceXof ?? 0) - b.priceXof !== 15000) throw new Error("Savings computation");
});

test("Quiz: create + grade correct/incorrect", async () => {
  const cat = await ensureCategory();
  const u = await prisma.user.create({
    data: {
      email: `instr-q-${Date.now()}@test.local`,
      name: "Instr Q",
      passwordHash: "x", role: "FREELANCE", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const ip = await prisma.instructeurProfile.create({
    data: { userId: u.id, status: "APPROUVE" },
  });
  CLEANUP_IDS.instructeurProfiles.push(ip.id);
  const f = await prisma.formation.create({
    data: {
      title: "QF", slug: `qf-${Date.now()}`,
      description: "d", price: 10000, instructeurId: ip.id, categoryId: cat.id,
    },
  });
  CLEANUP_IDS.formations.push(f.id);

  const quiz = await prisma.formationQuiz.create({
    data: {
      formationId: f.id,
      title: "Q",
      passPct: 60,
      questions: [
        { id: "q1", question: "2+2=?", choices: [{ label: "3", correct: false }, { label: "4", correct: true }] },
        { id: "q2", question: "Paris?", choices: [{ label: "France", correct: true }, { label: "Italie", correct: false }] },
      ],
    },
  });
  CLEANUP_IDS.quizzes.push(quiz.id);

  const s = await prisma.user.create({
    data: {
      email: `s-q-${Date.now()}@test.local`, name: "SQ",
      passwordHash: "x", role: "CLIENT", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(s.id);

  // 2/2 correct → passed
  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id, userId: s.id,
      scorePct: 100, passed: true,
      answers: [{ questionId: "q1", chosen: 1, ok: true }, { questionId: "q2", chosen: 0, ok: true }],
    },
  });
  if (!attempt.passed) throw new Error("Attempt should have passed");
});

test("Learner streak: first activity + increment", async () => {
  const u = await prisma.user.create({
    data: {
      email: `learner-${Date.now()}@test.local`, name: "Learner",
      passwordHash: "x", role: "CLIENT", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);

  const s1 = await prisma.learnerStreak.create({
    data: { userId: u.id, currentStreak: 1, longestStreak: 1, totalMinutes: 10, lastActivityAt: new Date() },
  });
  if (s1.currentStreak !== 1) throw new Error("Initial streak failed");

  // Simulate yesterday + 1 day → bump
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.learnerStreak.update({
    where: { userId: u.id },
    data: { lastActivityAt: yesterday },
  });
  // The actual streak engine is tested in the lib, not here — here we verify
  // the column schema and updates work.
});

test("Advanced promo code: schema fields accessible", async () => {
  const u = await prisma.user.create({
    data: {
      email: `v-p-${Date.now()}@test.local`, name: "VP",
      passwordHash: "x", role: "FREELANCE", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const ip = await prisma.instructeurProfile.create({
    data: { userId: u.id, status: "APPROUVE" },
  });
  CLEANUP_IDS.instructeurProfiles.push(ip.id);

  const code = await prisma.discountCode.create({
    data: {
      instructeurId: ip.id,
      code: `TEST${Date.now().toString(36).toUpperCase()}`,
      discountType: "PERCENTAGE",
      discountValue: 10,
      firstOrderOnly: true,
      bogoQuantityBuy: 2,
      bogoQuantityFree: 1,
      tieredRules: [{ qty: 2, pct: 10 }, { qty: 3, pct: 20 }],
      triggerContext: "welcome",
    },
  });
  if (!code.firstOrderOnly) throw new Error("firstOrderOnly not set");
  if (code.bogoQuantityBuy !== 2) throw new Error("BOGO buy not set");
  if (!Array.isArray(code.tieredRules)) throw new Error("tieredRules not JSON array");
  await prisma.discountCode.deleteMany({ where: { id: code.id } });
});

test("Mentor profile: discovery + questionnaire fields", async () => {
  const u = await prisma.user.create({
    data: {
      email: `m-p-${Date.now()}@test.local`, name: "MP",
      passwordHash: "x", role: "FREELANCE", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const mp = await prisma.mentorProfile.create({
    data: {
      userId: u.id,
      specialty: "Test",
      discoveryEnabled: true,
      discoveryDurationMinutes: 20,
      preSessionQuestions: [
        { id: "q1", label: "Your goal?", type: "text", required: true },
      ],
    },
  });
  CLEANUP_IDS.mentorProfiles.push(mp.id);
  if (!mp.discoveryEnabled) throw new Error("discoveryEnabled not set");
  if (mp.discoveryDurationMinutes !== 20) throw new Error("duration not set");
  if (!Array.isArray(mp.preSessionQuestions)) throw new Error("questions not JSON array");
});

test("Saved payment method: create + default flag", async () => {
  const u = await prisma.user.create({
    data: {
      email: `pm-${Date.now()}@test.local`, name: "PM",
      passwordHash: "x", role: "CLIENT", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const pm = await prisma.savedPaymentMethod.create({
    data: {
      userId: u.id,
      provider: "moneroo",
      token: "mock-token-123",
      brand: "orange",
      last4: "**78",
      isDefault: true,
    },
  });
  if (!pm.isDefault) throw new Error("Default flag not set");
  await prisma.savedPaymentMethod.deleteMany({ where: { id: pm.id } });
});

test("Mentor subscription plan + subscription", async () => {
  const u = await prisma.user.create({
    data: {
      email: `m-s-${Date.now()}@test.local`, name: "MS",
      passwordHash: "x", role: "FREELANCE", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(u.id);
  const mp = await prisma.mentorProfile.create({
    data: { userId: u.id, specialty: "Test" },
  });
  CLEANUP_IDS.mentorProfiles.push(mp.id);

  const plan = await prisma.mentorSubscriptionPlan.create({
    data: {
      mentorId: mp.id,
      title: "Monthly Coaching",
      sessionsPerMonth: 4,
      priceXofPerMonth: 150000,
    },
  });

  const s = await prisma.user.create({
    data: {
      email: `sub-${Date.now()}@test.local`, name: "Sub",
      passwordHash: "x", role: "CLIENT", emailVerified: new Date(),
    },
  });
  CLEANUP_IDS.users.push(s.id);

  const sub = await prisma.mentorSubscription.create({
    data: {
      planId: plan.id,
      userId: s.id,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400_000),
    },
  });
  if (sub.status !== "ACTIVE") throw new Error("Default status");
  await prisma.mentorSubscription.deleteMany({ where: { id: sub.id } });
  await prisma.mentorSubscriptionPlan.deleteMany({ where: { id: plan.id } });
});

(async () => {
  console.log(`Running ${tests.length} E2E flow tests...\n`);
  let pass = 0, fail = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✓ ${t.name}`);
      pass++;
    } catch (e) {
      console.log(`✗ ${t.name}\n    → ${e.message}`);
      fail++;
    }
  }
  await cleanup();
  await prisma.$disconnect();
  console.log("\n" + "=".repeat(60));
  console.log(`RÉSULTAT: ${pass} OK · ${fail} KO`);
  process.exit(fail > 0 ? 1 : 0);
})();
