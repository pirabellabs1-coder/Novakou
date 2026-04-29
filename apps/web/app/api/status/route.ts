/**
 * GET /api/status
 *
 * Health check endpoint. Used by Vercel uptime monitoring, status page,
 * and external alerting (Pingdom, UptimeRobot, etc).
 *
 * Returns 200 if healthy, 503 if degraded/down.
 *   { status: "ok"|"degraded"|"down", checks: {...}, timestamp, version }
 *
 * NEVER cached — always reflects current state.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckResult = "ok" | "degraded" | "down";

export async function GET() {
  const checks: Record<string, CheckResult> = {};
  const start = Date.now();

  // ── Database ─────────────────────────────────────────────────────────
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const elapsed = Date.now() - t0;
    checks.db = elapsed < 500 ? "ok" : "degraded";
  } catch {
    checks.db = "down";
  }

  // ── Env vars sanity ─────────────────────────────────────────────────
  // Critical secrets that must be present in production
  if (process.env.NODE_ENV === "production") {
    const required = [
      "NEXTAUTH_SECRET",
      "DATABASE_URL",
    ];
    const missing = required.filter((k) => !process.env[k]);
    checks.env = missing.length === 0 ? "ok" : "down";
  } else {
    checks.env = "ok";
  }

  // ── Aggregate ────────────────────────────────────────────────────────
  const values = Object.values(checks);
  let overall: CheckResult = "ok";
  if (values.includes("down")) overall = "down";
  else if (values.includes("degraded")) overall = "degraded";

  const httpStatus = overall === "down" ? 503 : 200;

  return NextResponse.json(
    {
      status: overall,
      checks,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    },
    {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
      },
    },
  );
}
