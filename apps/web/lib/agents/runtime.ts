import { prisma } from "@/lib/prisma";
import { AGENTS, type AgentKey } from "./registry";

/** Crée les 5 agents en base s'ils n'existent pas (désactivés par défaut). */
export async function ensureAgentsSeeded(): Promise<void> {
  for (const a of AGENTS) {
    await prisma.aiAgent.upsert({
      where: { key: a.key },
      update: { name: a.name, description: a.description },
      create: { key: a.key, name: a.name, description: a.description, enabled: false, autonomy: "mixed" },
    });
  }
}

export async function getAgentRecord(key: AgentKey) {
  return prisma.aiAgent.findUnique({ where: { key } });
}

type RunResult = { itemsProcessed?: number; actionsCreated?: number; tokensUsed?: number; summary?: string };

/**
 * Exécute la logique d'un agent en journalisant le run (durée, statut, résumé).
 * Met à jour lastRunAt. N'exécute rien si l'agent est désactivé.
 */
export async function recordRun(
  agentKey: AgentKey,
  fn: () => Promise<RunResult>,
): Promise<{ ran: boolean; result?: RunResult; error?: string }> {
  const agent = await prisma.aiAgent.findUnique({ where: { key: agentKey } });
  if (!agent || !agent.enabled) return { ran: false };

  const run = await prisma.agentRun.create({ data: { agentKey, status: "ok" } });
  try {
    const result = await fn();
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "ok",
        summary: result.summary ?? null,
        itemsProcessed: result.itemsProcessed ?? 0,
        actionsCreated: result.actionsCreated ?? 0,
        tokensUsed: result.tokensUsed ?? 0,
        finishedAt: new Date(),
      },
    });
    await prisma.aiAgent.update({ where: { key: agentKey }, data: { lastRunAt: new Date() } });
    return { ran: true, result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "error", error: msg.slice(0, 1000), finishedAt: new Date() },
    });
    await prisma.aiAgent.update({ where: { key: agentKey }, data: { lastRunAt: new Date() } }).catch(() => null);
    return { ran: true, error: msg };
  }
}

interface ProposeOpts {
  agentKey: AgentKey;
  type: string;
  risk: "low" | "sensitive";
  title: string;
  reasoning?: string;
  targetType?: string;
  targetId?: string;
  payload?: unknown;
  /** Idempotence : ne pas recréer une action identique déjà en attente/traitée. */
  dedupeKey?: string;
  /** Exécuteur appelé immédiatement si l'action est auto-exécutable (low-risk + autonomie). */
  execute?: () => Promise<unknown>;
}

/**
 * Crée une action d'agent. Selon le risque et l'autonomie de l'agent :
 *  - low-risk + autonomy "mixed"/"auto" + execute fourni → exécutée seule (auto_executed)
 *  - sinon → "proposed" (en attente de validation admin)
 * Renvoie l'action créée, ou null si dédupliquée.
 */
export async function proposeAction(opts: ProposeOpts) {
  const agent = await prisma.aiAgent.findUnique({ where: { key: opts.agentKey } });
  const autonomy = agent?.autonomy ?? "mixed";

  // Dédup : même type + cible non encore rejetée/traitée
  if (opts.targetType && opts.targetId) {
    const existing = await prisma.agentAction.findFirst({
      where: {
        agentKey: opts.agentKey,
        type: opts.type,
        targetType: opts.targetType,
        targetId: opts.targetId,
        status: { in: ["proposed", "approved", "executed", "auto_executed"] },
      },
      select: { id: true },
    });
    if (existing) return null;
  }

  const canAuto = opts.risk === "low" && (autonomy === "mixed" || autonomy === "auto") && !!opts.execute;
  // En autonomie "auto", même le sensible peut s'exécuter seul (l'admin a choisi le full-auto).
  const forceAuto = autonomy === "auto" && !!opts.execute;
  const willAuto = canAuto || forceAuto;

  const action = await prisma.agentAction.create({
    data: {
      agentKey: opts.agentKey,
      type: opts.type,
      risk: opts.risk,
      title: opts.title,
      reasoning: opts.reasoning ?? null,
      targetType: opts.targetType ?? null,
      targetId: opts.targetId ?? null,
      payload: (opts.payload ?? undefined) as object | undefined,
      status: willAuto ? "auto_executed" : "proposed",
    },
  });

  if (willAuto && opts.execute) {
    try {
      const result = await opts.execute();
      await prisma.agentAction.update({
        where: { id: action.id },
        data: { result: (result ?? {}) as object, executedAt: new Date() },
      });
    } catch (e) {
      await prisma.agentAction.update({
        where: { id: action.id },
        data: { status: "failed", result: { error: (e as Error).message } as object },
      });
    }
  }
  return action;
}
