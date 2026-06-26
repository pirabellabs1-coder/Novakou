import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { AGENTS, mergeConfig } from "@/lib/agents/registry";

function isAdmin(session: { user?: ({ email?: string | null } & Record<string, unknown>) } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as Record<string, unknown>).role as string | undefined;
  if (role === "ADMIN" || role === "admin") return true;
  const email = (session.user.email || "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  return !!adminEmail && email === adminEmail;
}

// GET — liste des agents (métadonnées + état + stats) + actions en attente
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  await ensureAgentsSeeded();
  const records = await prisma.aiAgent.findMany();
  const byKey = new Map(records.map((r) => [r.key, r]));

  const pendingCounts = await prisma.agentAction.groupBy({
    by: ["agentKey"],
    where: { status: "proposed" },
    _count: { _all: true },
  });
  const pendingMap = new Map(pendingCounts.map((p) => [p.agentKey, p._count._all]));

  const agents = AGENTS.map((def) => {
    const rec = byKey.get(def.key);
    return {
      ...def,
      enabled: rec?.enabled ?? false,
      autonomy: rec?.autonomy ?? "mixed",
      lastRunAt: rec?.lastRunAt ?? null,
      pending: pendingMap.get(def.key) ?? 0,
      // Schéma de réglages + valeurs effectives (par défaut fusionnées avec l'enregistré).
      configSchema: def.config,
      config: mergeConfig(def.key, rec?.config ?? null),
    };
  });

  const actions = await prisma.agentAction.findMany({
    where: { status: { in: ["proposed", "auto_executed", "failed"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Résumé « centrale » (live) : ce qui tourne, ce qui a été fait sur 24 h.
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [runsToday, actionsToday, pending, lastRun] = await Promise.all([
    prisma.agentRun.count({ where: { startedAt: { gte: since24h } } }),
    prisma.agentAction.count({ where: { createdAt: { gte: since24h } } }),
    prisma.agentAction.count({ where: { status: "proposed" } }),
    prisma.agentRun.findFirst({ orderBy: { startedAt: "desc" }, select: { startedAt: true } }),
  ]);
  const activeAgents = agents.filter((a) => a.enabled).length;
  // Le cron tourne en haut de chaque heure (vercel.json: 0 * * * *).
  const next = new Date();
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);

  return NextResponse.json({
    agents,
    actions,
    llmConfigured: !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
    live: {
      activeAgents,
      totalAgents: agents.length,
      runsToday,
      actionsToday,
      pending,
      lastRunAt: lastRun?.startedAt ? lastRun.startedAt.toISOString() : null,
      nextRunAt: next.toISOString(),
      serverTime: new Date().toISOString(),
    },
  });
}

// PATCH — activer/désactiver ou changer l'autonomie d'un agent
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "");
  if (!AGENTS.some((a) => a.key === key)) return NextResponse.json({ error: "Agent inconnu" }, { status: 400 });

  const data: { enabled?: boolean; autonomy?: string; config?: object } = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.autonomy === "string" && ["mixed", "approval", "auto", "off"].includes(body.autonomy)) {
    data.autonomy = body.autonomy;
  }
  // Réglages d'« entraînement » : on valide/normalise via mergeConfig (bornes + types).
  if (body.config && typeof body.config === "object") {
    data.config = mergeConfig(key, body.config);
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });

  await ensureAgentsSeeded();
  const updated = await prisma.aiAgent.update({ where: { key }, data });
  return NextResponse.json({
    ok: true,
    agent: { key: updated.key, enabled: updated.enabled, autonomy: updated.autonomy, config: mergeConfig(updated.key, updated.config) },
  });
}
