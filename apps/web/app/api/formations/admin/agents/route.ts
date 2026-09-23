import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { AGENTS, mergeConfig, type AgentKey } from "@/lib/agents/registry";

/**
 * API des DEUX agents de vérification autonomes (KYC + fiches).
 *
 * ── PHILOSOPHIE ───────────────────────────────────────────────────────────
 * Les décisions restent AUTONOMES — cette page ne les valide pas, elle les
 * MONTRE. Le fondateur y voit ce qui a été décidé récemment, ajuste les
 * consignes d'entraînement, coupe l'interrupteur d'un agent en cas de
 * problème. Rien de plus, rien de moins.
 */

function isAdmin(session: { user?: { email?: string | null; role?: unknown } | null } | null): boolean {
  if (!session?.user) return false;
  const role = String(session.user.role ?? "").toUpperCase();
  if (role === "ADMIN") return true;
  const email = (session.user.email ?? "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  return !!adminEmail && email === adminEmail;
}

// GET — liste des agents + activité récente
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  await ensureAgentsSeeded();
  const records = await prisma.aiAgent.findMany();
  const byKey = new Map(records.map((r) => [r.key, r]));

  const agents = AGENTS.map((def) => {
    const rec = byKey.get(def.key);
    return {
      ...def,
      enabled: rec?.enabled ?? false,
      autonomy: rec?.autonomy ?? "auto",
      lastRunAt: rec?.lastRunAt ?? null,
      configSchema: def.config,
      config: mergeConfig(def.key, rec?.config ?? null),
    };
  });

  // Décisions récentes — ce que l'agent a fait ces 7 derniers jours, par
  // agent. C'est ce qui donne à l'admin la vue « ça tourne, voici ce que ça
  // décide ».
  const depuis = new Date(Date.now() - 7 * 86400_000);
  const actions = await prisma.agentAction.findMany({
    where: { agentKey: { in: AGENTS.map((a) => a.key) }, createdAt: { gte: depuis } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, agentKey: true, status: true, type: true, title: true,
      reasoning: true, targetType: true, targetId: true, createdAt: true, executedAt: true,
    },
  });

  // Runs récents pour l'entête « prochain passage / dernier passage ».
  const runs = await prisma.agentRun.findMany({
    where: { agentKey: { in: AGENTS.map((a) => a.key) }, startedAt: { gte: depuis } },
    orderBy: { startedAt: "desc" },
    take: 40,
    select: {
      agentKey: true, status: true, summary: true, itemsProcessed: true,
      actionsCreated: true, tokensUsed: true, startedAt: true, finishedAt: true,
    },
  });

  // Cron toutes les 15 min : le prochain passage est le prochain multiple de 15
  // sur l'horloge UTC.
  const next = new Date();
  const min = next.getUTCMinutes();
  const prochainQuart = Math.ceil((min + 1) / 15) * 15;
  next.setUTCMinutes(prochainQuart % 60, 0, 0);
  if (prochainQuart >= 60) next.setUTCHours(next.getUTCHours() + 1);

  const dernierRun = await prisma.agentRun.findFirst({
    where: { agentKey: { in: AGENTS.map((a) => a.key) } },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true },
  });

  return NextResponse.json({
    agents,
    actions,
    runs,
    llmConfigured: !!process.env.OPENROUTER_API_KEY,
    live: {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.enabled).length,
      lastRunAt: dernierRun?.startedAt?.toISOString() ?? null,
      nextRunAt: next.toISOString(),
      serverTime: new Date().toISOString(),
    },
  });
}

// PATCH — activer/désactiver, changer l'autonomie, sauver la config
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    key?: string; enabled?: boolean; autonomy?: string; config?: unknown; setAllEnabled?: boolean;
  };

  await ensureAgentsSeeded();

  // Mode « activer/désactiver TOUS les agents en même temps ». Le fondateur
  // le demande d'un coup, pas un-par-un.
  if (typeof body.setAllEnabled === "boolean") {
    await prisma.aiAgent.updateMany({
      where: { key: { in: AGENTS.map((a) => a.key) } },
      data: { enabled: body.setAllEnabled },
    });
    return NextResponse.json({ ok: true, enabled: body.setAllEnabled });
  }

  const key = String(body.key ?? "");
  if (!AGENTS.some((a) => a.key === key)) return NextResponse.json({ error: "Agent inconnu" }, { status: 400 });

  const data: { enabled?: boolean; autonomy?: string; config?: object } = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.autonomy === "string" && ["auto", "approval", "off"].includes(body.autonomy)) {
    data.autonomy = body.autonomy;
  }
  if (body.config && typeof body.config === "object") {
    data.config = mergeConfig(key, body.config);
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });

  const updated = await prisma.aiAgent.update({ where: { key: key as AgentKey }, data });
  return NextResponse.json({
    ok: true,
    agent: {
      key: updated.key,
      enabled: updated.enabled,
      autonomy: updated.autonomy,
      config: mergeConfig(updated.key, updated.config),
    },
  });
}
