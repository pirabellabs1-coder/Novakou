import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

type Params = { params: Promise<{ id: string }> };

async function ensureOwnership(userId: string, funnelId: string) {
  const inst = await getOrCreateInstructeur(userId);
  if (!inst) return { ok: false, status: 400 as const, error: "Profil instructeur requis" };
  const funnel = await prisma.salesFunnel.findFirst({
    where: { id: funnelId, instructeurId: inst.id },
  });
  if (!funnel) return { ok: false, status: 404 as const, error: "Funnel introuvable" };
  return { ok: true as const, funnel, instructeurId: inst.id };
}

/**
 * GET /api/vendeur/funnels/[id]
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const check = await ensureOwnership(userId, id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const funnel = await prisma.salesFunnel.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json({ data: funnel });
  } catch (err) {
    console.error("[vendeur/funnels/[id] GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/vendeur/funnels/[id]
 * Update funnel meta (name, description, isActive, theme) and/or its steps.
 *
 * Body: { name?, description?, isActive?, theme?, steps?: [{ id, blocks?, headlineFr?, ... }] }
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const check = await ensureOwnership(userId, id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await request.json();

    // Update funnel meta
    const funnelUpdate: Record<string, unknown> = {};
    if (typeof body.name === "string") funnelUpdate.name = body.name.trim();
    if (typeof body.description === "string") funnelUpdate.description = body.description;
    if (typeof body.isActive === "boolean") funnelUpdate.isActive = body.isActive;
    if (body.theme !== undefined) funnelUpdate.theme = body.theme;

    if (Object.keys(funnelUpdate).length > 0) {
      await prisma.salesFunnel.update({ where: { id }, data: funnelUpdate });
    }

    // Update individual steps
    if (Array.isArray(body.steps)) {
      for (const step of body.steps) {
        if (!step.id) continue;
        const stepUpdate: Record<string, unknown> = {};
        if (typeof step.title === "string") stepUpdate.title = step.title;
        if (typeof step.headlineFr === "string") stepUpdate.headlineFr = step.headlineFr;
        if (typeof step.descriptionFr === "string") stepUpdate.descriptionFr = step.descriptionFr;
        if (typeof step.ctaTextFr === "string") stepUpdate.ctaTextFr = step.ctaTextFr;
        if (step.blocks !== undefined) stepUpdate.blocks = step.blocks;
        if (step.formationId !== undefined) stepUpdate.formationId = step.formationId || null;
        if (step.productId !== undefined) stepUpdate.productId = step.productId || null;
        if (typeof step.discountPct === "number") stepUpdate.discountPct = step.discountPct;

        if (Object.keys(stepUpdate).length > 0) {
          await prisma.funnelStep.update({
            where: { id: step.id },
            data: stepUpdate,
          });
        }
      }
    }

    const updated = await prisma.salesFunnel.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[vendeur/funnels/[id] PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendeur/funnels/[id]
 */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const check = await ensureOwnership(userId, id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    await prisma.salesFunnel.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[vendeur/funnels/[id] DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
