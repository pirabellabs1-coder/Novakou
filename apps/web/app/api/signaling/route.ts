import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

// Signaling via Postgres — works across Vercel serverless instances
// Table "signaling_signals" must exist (created via migration or manual SQL)
// Signals are ephemeral (TTL 60s, cleaned on every request)

interface SignalRow {
  id: number;
  type: string;
  from_user: string;
  to_user: string;
  payload: unknown;
  created_at: Date;
}

async function cleanup() {
  try {
    await prisma.$executeRaw`
      DELETE FROM "signaling_signals" WHERE "created_at" < NOW() - INTERVAL '60 seconds'
    `;
  } catch {
    // Table might not exist — ignore
  }
}

// POST — Send a signal to another user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await req.json();
    const { type, from, to, payload } = body;

    if (!type || !from || !to || !payload) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await cleanup();

    const payloadJson = JSON.stringify(payload);
    await prisma.$executeRaw`
      INSERT INTO "signaling_signals" ("type", "from_user", "to_user", "payload")
      VALUES (${type}, ${from}, ${to}, ${payloadJson}::jsonb)
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Signaling POST]", err);
    return NextResponse.json({ error: "Signaling error" }, { status: 500 });
  }
}

// GET — Poll for signals addressed to a user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await cleanup();

    // Fetch and delete signals atomically
    const rows = await prisma.$queryRaw<SignalRow[]>`
      DELETE FROM "signaling_signals"
      WHERE "id" IN (
        SELECT "id" FROM "signaling_signals"
        WHERE "to_user" = ${userId}
        ORDER BY "id" ASC
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "type", "from_user", "to_user", "payload", "created_at"
    `;

    return NextResponse.json({
      signals: (rows || []).map((r) => ({
        id: r.id,
        type: r.type,
        from: r.from_user,
        payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
      })),
    });
  } catch (err) {
    console.error("[Signaling GET]", err);
    // Return empty signals on error (table might not exist yet)
    return NextResponse.json({ signals: [] });
  }
}
