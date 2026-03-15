import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// In-memory signaling store with TTL
interface Signal {
  id: string;
  type: string;
  from: string;
  to: string;
  payload: unknown;
  createdAt: number;
}

const signals: Signal[] = [];
const SIGNAL_TTL_MS = 60_000; // 60 seconds
let nextId = 1;

function cleanup() {
  const cutoff = Date.now() - SIGNAL_TTL_MS;
  let i = 0;
  while (i < signals.length && signals[i].createdAt < cutoff) i++;
  if (i > 0) signals.splice(0, i);
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

    cleanup();

    const signal: Signal = {
      id: `sig-${nextId++}`,
      type,
      from,
      to,
      payload,
      createdAt: Date.now(),
    };

    signals.push(signal);

    return NextResponse.json({ ok: true, id: signal.id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
    const afterId = searchParams.get("afterId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    cleanup();

    let results = signals.filter((s) => s.to === userId);

    // If afterId is provided, only return signals after that id
    if (afterId) {
      const idx = results.findIndex((s) => s.id === afterId);
      if (idx >= 0) {
        results = results.slice(idx + 1);
      }
    }

    // Remove consumed signals
    for (const r of results) {
      const idx = signals.indexOf(r);
      if (idx >= 0) signals.splice(idx, 1);
    }

    return NextResponse.json({
      signals: results.map((s) => ({
        id: s.id,
        type: s.type,
        from: s.from,
        payload: s.payload,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
