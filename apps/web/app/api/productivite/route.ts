import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import fs from "fs";
import path from "path";

// ── Persistence ──
const DEV_DIR = path.join(process.cwd(), "lib", "dev");
const SESSIONS_FILE = path.join(DEV_DIR, "productivite-sessions.json");

function ensureDir() {
  if (!fs.existsSync(DEV_DIR)) fs.mkdirSync(DEV_DIR, { recursive: true });
}

interface StoredSession {
  id: string;
  userId: string;
  label: string;
  start: string;
  end: string | null;
  durationSeconds: number;
  status: "running" | "paused" | "stopped";
  amount: number;
  date: string;
  pausedAt?: string; // ISO timestamp when paused
}

function readSessions(): StoredSession[] {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeSessions(data: StoredSession[]) {
  ensureDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

const HOURLY_RATE = 65; // EUR/hour default

function computeAmount(seconds: number): number {
  return Math.round((seconds / 3600) * HOURLY_RATE * 100) / 100;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const allSessions = readSessions();
  const userSessions = allSessions
    .filter((s) => s.userId === session.user.id && s.date === dateFilter)
    .map((s) => ({
      id: s.id,
      label: s.label,
      start: s.start,
      end: s.end,
      durationSeconds: s.status === "running" ? s.durationSeconds + Math.floor((Date.now() - new Date(s.start).getTime()) / 1000) : s.durationSeconds,
      status: s.status,
      amount: s.amount,
      date: s.date,
    }));

  return NextResponse.json({ sessions: userSessions });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const body = await request.json();
  const allSessions = readSessions();

  if (body.action === "start") {
    const now = new Date();
    const newSession: StoredSession = {
      id: "ps" + Date.now(),
      userId: session.user.id,
      label: body.label || "Session de travail",
      start: now.toISOString(),
      end: null,
      durationSeconds: 0,
      status: "running",
      amount: 0,
      date: now.toISOString().slice(0, 10),
    };
    allSessions.push(newSession);
    writeSessions(allSessions);
    return NextResponse.json({ session: newSession });
  }

  if (body.action === "pause") {
    const idx = allSessions.findIndex((s) => s.id === body.id && s.userId === session.user.id);
    if (idx < 0) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    const s = allSessions[idx];
    if (s.status !== "running") return NextResponse.json({ error: "Session non active" }, { status: 400 });
    const elapsed = Math.floor((Date.now() - new Date(s.start).getTime()) / 1000);
    s.durationSeconds = elapsed;
    s.status = "paused";
    s.amount = computeAmount(elapsed);
    s.pausedAt = new Date().toISOString();
    writeSessions(allSessions);
    return NextResponse.json({ session: s });
  }

  if (body.action === "resume") {
    const idx = allSessions.findIndex((s) => s.id === body.id && s.userId === session.user.id);
    if (idx < 0) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    const s = allSessions[idx];
    if (s.status !== "paused") return NextResponse.json({ error: "Session non en pause" }, { status: 400 });
    // Adjust start time to account for pause duration
    const pauseDuration = s.pausedAt ? Date.now() - new Date(s.pausedAt).getTime() : 0;
    s.start = new Date(new Date(s.start).getTime() + pauseDuration).toISOString();
    s.status = "running";
    delete s.pausedAt;
    writeSessions(allSessions);
    return NextResponse.json({ session: s });
  }

  if (body.action === "stop") {
    const idx = allSessions.findIndex((s) => s.id === body.id && s.userId === session.user.id);
    if (idx < 0) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    const s = allSessions[idx];
    const now = new Date();
    if (s.status === "running") {
      s.durationSeconds = Math.floor((now.getTime() - new Date(s.start).getTime()) / 1000);
    }
    s.status = "stopped";
    s.end = now.toISOString();
    s.amount = computeAmount(s.durationSeconds);
    writeSessions(allSessions);
    return NextResponse.json({ session: s });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
