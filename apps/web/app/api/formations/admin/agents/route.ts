import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { AGENTS } from "@/lib/agents/registry";

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
    };
  });

  const actions = await prisma.agentAction.findMany({
    where: { status: { in: ["proposed", "auto_executed", "failed"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ agents, actions, llmConfigured: !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) });
}

// PATCH — activer/désactiver ou changer l'autonomie d'un agent
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const key = String(body.key || "");
  if (!AGENTS.some((a) => a.key === key)) return NextResponse.json({ error: "Agent inconnu" }, { status: 400 });

  const data: { enabled?: boolean; autonomy?: string } = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.autonomy === "string" && ["mixed", "approval", "auto", "off"].includes(body.autonomy)) {
    data.autonomy = body.autonomy;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });

  await ensureAgentsSeeded();
  const updated = await prisma.aiAgent.update({ where: { key }, data });
  return NextResponse.json({ ok: true, agent: { key: updated.key, enabled: updated.enabled, autonomy: updated.autonomy } });
}
