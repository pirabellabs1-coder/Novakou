import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getOrCreateInstructeurProfile } from "@/lib/formations/prisma-helpers";

/**
 * GET /api/formations/vendeur/marketing/tags
 *
 * Suggestions d'autocomplétion pour les actions ADD_TAG/REMOVE_TAG des
 * automatisations : on renvoie les tags déjà utilisés par CE vendeur dans ses
 * workflows. Si le vendeur n'en a aucun, on propose quelques tags courants
 * comme point de départ.
 */
const DEFAULT_TAGS = ["nouveau_client", "acheteur", "prospect", "vip", "inactif", "formation_terminee"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ tags: DEFAULT_TAGS });

    const prisma = (await import("@freelancehigh/db")).default;
    const instructeur = await getOrCreateInstructeurProfile(session.user.id);

    const workflows = await prisma.automationWorkflow.findMany({
      where: { instructeurId: instructeur.id },
      select: { actions: true },
    });

    const used = new Set<string>();
    for (const wf of workflows) {
      const actions = Array.isArray(wf.actions) ? wf.actions : [];
      for (const a of actions as Array<{ type?: string; config?: { tag?: unknown } }>) {
        if ((a?.type === "ADD_TAG" || a?.type === "REMOVE_TAG") && typeof a.config?.tag === "string") {
          const t = a.config.tag.trim();
          if (t) used.add(t);
        }
      }
    }

    const tags = used.size > 0
      ? Array.from(used).sort((a, b) => a.localeCompare(b))
      : DEFAULT_TAGS;

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[GET /api/formations/vendeur/marketing/tags]", error);
    return NextResponse.json({ tags: DEFAULT_TAGS });
  }
}
