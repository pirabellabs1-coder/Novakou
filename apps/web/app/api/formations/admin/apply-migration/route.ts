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
      `ALTER TABLE "InstructorWithdrawal" ADD COLUMN IF NOT EXISTS "paymentRef" TEXT`,
      `ALTER TABLE "InstructorWithdrawal" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT`,
      `ALTER TABLE "InstructorWithdrawal" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT`,
      `CREATE INDEX IF NOT EXISTS "InstructorWithdrawal_paymentRef_idx" ON "InstructorWithdrawal"("paymentRef")`,
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
