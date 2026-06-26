import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { AGENTS } from "@/lib/agents/registry";

function isAdmin(session: { user?: ({ email?: string | null } & Record<string, unknown>) } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as Record<string, unknown>).role as string | undefined;
  if (role === "ADMIN" || role === "admin") return true;
  const email = (session.user.email || "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  return !!adminEmail && email === adminEmail;
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const days = Math.min(90, Math.max(7, Number(new URL(req.url).searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [runs, actions] = await Promise.all([
    prisma.agentRun.findMany({
      where: { startedAt: { gte: since } },
      select: { agentKey: true, status: true, itemsProcessed: true, actionsCreated: true, tokensUsed: true, startedAt: true },
    }),
    prisma.agentAction.findMany({
      where: { createdAt: { gte: since } },
      select: { agentKey: true, status: true, type: true, createdAt: true },
    }),
  ]);

  // Série quotidienne (remplie pour chaque jour de la fenêtre)
  const daily = new Map<string, { date: string; runs: number; tasks: number; actions: number; tokens: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000);
    const k = dayKey(d);
    daily.set(k, { date: k, runs: 0, tasks: 0, actions: 0, tokens: 0 });
  }
  for (const r of runs) {
    const e = daily.get(dayKey(new Date(r.startedAt)));
    if (e) { e.runs++; e.tasks += r.itemsProcessed; e.tokens += r.tokensUsed; }
  }
  for (const a of actions) {
    const e = daily.get(dayKey(new Date(a.createdAt)));
    if (e) e.actions++;
  }
  const series = Array.from(daily.values());

  // Par agent
  const perAgent = AGENTS.map((def) => {
    const ar = runs.filter((r) => r.agentKey === def.key);
    const aa = actions.filter((a) => a.agentKey === def.key);
    return {
      key: def.key,
      name: def.name,
      emoji: def.emoji,
      runs: ar.length,
      tasks: ar.reduce((s, r) => s + r.itemsProcessed, 0),
      actions: aa.length,
      errors: ar.filter((r) => r.status === "error").length,
    };
  });

  // Répartition des statuts d'actions
  const statusCounts: Record<string, number> = {};
  for (const a of actions) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;

  // Totaux
  const totalRuns = runs.length;
  const totalTasks = runs.reduce((s, r) => s + r.itemsProcessed, 0);
  const totalActions = actions.length;
  const totalTokens = runs.reduce((s, r) => s + r.tokensUsed, 0);
  const decided = (statusCounts.approved ?? 0) + (statusCounts.rejected ?? 0);
  const approvalRate = decided > 0 ? Math.round(((statusCounts.approved ?? 0) / decided) * 100) : null;
  const autoRate = totalActions > 0 ? Math.round(((statusCounts.auto_executed ?? 0) / totalActions) * 100) : 0;

  return NextResponse.json({
    days,
    totals: { runs: totalRuns, tasks: totalTasks, actions: totalActions, tokens: totalTokens, approvalRate, autoRate, errors: runs.filter((r) => r.status === "error").length },
    series,
    perAgent,
    statusCounts,
  });
}
