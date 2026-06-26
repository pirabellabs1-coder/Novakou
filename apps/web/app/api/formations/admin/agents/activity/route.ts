import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getAgentDef } from "@/lib/agents/registry";

function isAdmin(session: { user?: ({ email?: string | null } & Record<string, unknown>) } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as Record<string, unknown>).role as string | undefined;
  if (role === "ADMIN" || role === "admin") return true;
  const email = (session.user.email || "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  return !!adminEmail && email === adminEmail;
}

function meta(key: string) {
  const d = getAgentDef(key);
  return { emoji: d?.emoji ?? "🤖", name: d?.name ?? key };
}

// GET — journal d'activité en direct (exécutions + actions fusionnées, plus récent d'abord)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") || 120)));
  const agent = url.searchParams.get("agent") || undefined;
  const where = agent ? { agentKey: agent } : {};

  const [runs, actions] = await Promise.all([
    prisma.agentRun.findMany({ where, orderBy: { startedAt: "desc" }, take: limit }),
    prisma.agentAction.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
  ]);

  type Event = {
    kind: "run" | "action";
    id: string;
    agentKey: string;
    emoji: string;
    agentName: string;
    at: string; // tri (ISO)
    createdAt: string;
    status: string;
    // run
    summary?: string | null;
    itemsProcessed?: number;
    actionsCreated?: number;
    tokensUsed?: number;
    error?: string | null;
    durationMs?: number | null;
    // action
    type?: string;
    risk?: string;
    title?: string;
    reasoning?: string | null;
    draft?: string | null;
    targetType?: string | null;
    decidedAt?: string | null;
    executedAt?: string | null;
  };

  const events: Event[] = [];

  for (const r of runs) {
    const m = meta(r.agentKey);
    events.push({
      kind: "run",
      id: r.id,
      agentKey: r.agentKey,
      emoji: m.emoji,
      agentName: m.name,
      at: (r.finishedAt ?? r.startedAt).toISOString(),
      createdAt: r.startedAt.toISOString(),
      status: r.status,
      summary: r.summary,
      itemsProcessed: r.itemsProcessed,
      actionsCreated: r.actionsCreated,
      tokensUsed: r.tokensUsed,
      error: r.error,
      durationMs: r.finishedAt ? r.finishedAt.getTime() - r.startedAt.getTime() : null,
    });
  }

  for (const a of actions) {
    const m = meta(a.agentKey);
    const payload = (a.payload ?? {}) as Record<string, unknown>;
    const draft = (payload.draft as string) || (payload.draftDescription as string) || null;
    const at = a.executedAt ?? a.decidedAt ?? a.createdAt;
    events.push({
      kind: "action",
      id: a.id,
      agentKey: a.agentKey,
      emoji: m.emoji,
      agentName: m.name,
      at: at.toISOString(),
      createdAt: a.createdAt.toISOString(),
      status: a.status,
      type: a.type,
      risk: a.risk,
      title: a.title,
      reasoning: a.reasoning,
      draft,
      targetType: a.targetType,
      decidedAt: a.decidedAt ? a.decidedAt.toISOString() : null,
      executedAt: a.executedAt ? a.executedAt.toISOString() : null,
    });
  }

  events.sort((x, y) => y.at.localeCompare(x.at));

  return NextResponse.json({
    events: events.slice(0, limit),
    serverTime: new Date().toISOString(),
  });
}
