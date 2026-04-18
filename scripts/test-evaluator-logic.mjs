#!/usr/bin/env node
/**
 * Test the discount evaluator LOGIC end-to-end by importing the TS file
 * via Next's dev server. We expose a helper endpoint to trigger evaluation.
 *
 * Simpler approach: hit a small test endpoint that directly uses the
 * evaluator. We create the endpoint below.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient();
const BASE = process.env.BASE_URL || "http://localhost:3001";

async function setup() {
  const u = await prisma.user.create({
    data: {
      email: `eval-${Date.now()}@test.local`, name: "EV",
      passwordHash: "x", role: "FREELANCE", emailVerified: new Date(),
    },
  });
  const ip = await prisma.instructeurProfile.create({
    data: { userId: u.id, status: "APPROUVE" },
  });

  const codes = {
    pct: await prisma.discountCode.create({
      data: {
        instructeurId: ip.id, code: `PCT${Date.now()}`,
        discountType: "PERCENTAGE", discountValue: 20, scope: "ALL",
      },
    }),
    bogo: await prisma.discountCode.create({
      data: {
        instructeurId: ip.id, code: `BOGO${Date.now()}`,
        discountType: "PERCENTAGE", discountValue: 0, scope: "ALL",
        bogoQuantityBuy: 2, bogoQuantityFree: 1,
      },
    }),
    tier: await prisma.discountCode.create({
      data: {
        instructeurId: ip.id, code: `TIER${Date.now()}`,
        discountType: "PERCENTAGE", discountValue: 5, scope: "ALL",
        tieredRules: [{ qty: 2, pct: 10 }, { qty: 3, pct: 25 }],
      },
    }),
    first: await prisma.discountCode.create({
      data: {
        instructeurId: ip.id, code: `FIRST${Date.now()}`,
        discountType: "FIXED_AMOUNT", discountValue: 5000, scope: "ALL",
        firstOrderOnly: true,
      },
    }),
    expired: await prisma.discountCode.create({
      data: {
        instructeurId: ip.id, code: `EXPIRED${Date.now()}`,
        discountType: "PERCENTAGE", discountValue: 50, scope: "ALL",
        expiresAt: new Date(Date.now() - 86400_000), // yesterday
      },
    }),
  };

  return { user: u, ip, codes };
}

async function cleanup(ctx) {
  const ids = Object.values(ctx.codes).map((c) => c.id);
  await prisma.discountCode.deleteMany({ where: { id: { in: ids } } });
  await prisma.instructeurProfile.deleteMany({ where: { id: ctx.ip.id } });
  await prisma.user.deleteMany({ where: { id: ctx.user.id } });
}

async function evalCode(code, lines, userId) {
  const res = await fetch(`${BASE}/api/formations/discount/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, lines, userId }),
  });
  return res.json();
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("Percentage 20% on 10 000", async (ctx) => {
  const r = await evalCode(ctx.codes.pct.code, [
    { id: "f1", kind: "formation", priceXof: 10000 },
  ]);
  if (!r.ok) throw new Error(`Expected ok, got: ${r.reason}`);
  if (r.discountAmount !== 2000) throw new Error(`Expected 2000, got ${r.discountAmount}`);
  if (r.finalAmount !== 8000) throw new Error(`Expected 8000, got ${r.finalAmount}`);
});

test("BOGO: 2 achetés + 1 offert (3 items 5000 chacun → 5000 gratuit)", async (ctx) => {
  const r = await evalCode(ctx.codes.bogo.code, [
    { id: "a", kind: "formation", priceXof: 5000 },
    { id: "b", kind: "formation", priceXof: 5000 },
    { id: "c", kind: "formation", priceXof: 5000 },
  ]);
  if (!r.ok) throw new Error(`Expected ok, got: ${r.reason}`);
  if (r.discountAmount !== 5000) throw new Error(`Expected 5000, got ${r.discountAmount}`);
  if (!r.freeLines || r.freeLines.length !== 1) throw new Error("Expected 1 freeLine");
});

test("BOGO: pas assez d'items (2 items mais N+M = 3 requis) → refusé", async (ctx) => {
  const r = await evalCode(ctx.codes.bogo.code, [
    { id: "a", kind: "formation", priceXof: 5000 },
    { id: "b", kind: "formation", priceXof: 5000 },
  ]);
  if (r.ok) throw new Error("BOGO shouldn't have been applied (not enough items)");
});

test("Tiered: 3 items → tier 25% (pas 10%)", async (ctx) => {
  const r = await evalCode(ctx.codes.tier.code, [
    { id: "a", kind: "formation", priceXof: 10000 },
    { id: "b", kind: "formation", priceXof: 10000 },
    { id: "c", kind: "formation", priceXof: 10000 },
  ]);
  if (!r.ok) throw new Error(`Expected ok, got: ${r.reason}`);
  if (r.appliedTierPct !== 25) throw new Error(`Expected tier 25, got ${r.appliedTierPct}`);
  if (r.discountAmount !== 7500) throw new Error(`Expected 7500, got ${r.discountAmount}`);
});

test("Tiered: 2 items → tier 10%", async (ctx) => {
  const r = await evalCode(ctx.codes.tier.code, [
    { id: "a", kind: "formation", priceXof: 10000 },
    { id: "b", kind: "formation", priceXof: 10000 },
  ]);
  if (!r.ok) throw new Error(`Expected ok, got: ${r.reason}`);
  if (r.appliedTierPct !== 10) throw new Error(`Expected tier 10, got ${r.appliedTierPct}`);
  if (r.discountAmount !== 2000) throw new Error(`Expected 2000, got ${r.discountAmount}`);
});

test("FIXED_AMOUNT 5000 FCFA", async (ctx) => {
  const r = await evalCode(ctx.codes.first.code, [
    { id: "f1", kind: "formation", priceXof: 15000 },
  ]);
  if (!r.ok) throw new Error(`Expected ok, got: ${r.reason}`);
  if (r.discountAmount !== 5000) throw new Error(`Expected 5000, got ${r.discountAmount}`);
  if (r.finalAmount !== 10000) throw new Error(`Expected 10000, got ${r.finalAmount}`);
});

test("Code expiré → refusé", async (ctx) => {
  const r = await evalCode(ctx.codes.expired.code, [
    { id: "f1", kind: "formation", priceXof: 10000 },
  ]);
  if (r.ok) throw new Error("Expired code should not apply");
  if (!r.reason?.includes("expir")) throw new Error(`Wrong reason: ${r.reason}`);
});

test("Code inexistant → refusé", async () => {
  const r = await evalCode(`NOPE${Date.now()}`, [
    { id: "f1", kind: "formation", priceXof: 10000 },
  ]);
  if (r.ok) throw new Error("Unknown code should not apply");
});

test("Panier vide → refusé", async (ctx) => {
  const r = await evalCode(ctx.codes.pct.code, []);
  if (r.ok) throw new Error("Empty cart should not apply");
});

(async () => {
  console.log("Setting up test codes...");
  const ctx = await setup();
  console.log(`Running ${tests.length} evaluator logic tests...\n`);
  let pass = 0, fail = 0;
  for (const t of tests) {
    try {
      await t.fn(ctx);
      console.log(`✓ ${t.name}`);
      pass++;
    } catch (e) {
      console.log(`✗ ${t.name}\n    → ${e.message}`);
      fail++;
    }
  }
  await cleanup(ctx);
  await prisma.$disconnect();
  console.log("\n" + "=".repeat(60));
  console.log(`RÉSULTAT: ${pass} OK · ${fail} KO`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error("FATAL:", e);
  await prisma.$disconnect();
  process.exit(2);
});
