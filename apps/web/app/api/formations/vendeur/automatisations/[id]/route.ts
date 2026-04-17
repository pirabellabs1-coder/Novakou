import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { AutomationTriggerType, WorkflowStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

async function ensureOwnership(session: Awaited<ReturnType<typeof getServerSession>>, workflowId: string) {
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return null;
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  const wf = await prisma.automationWorkflow.findFirst({
    where: { id: workflowId, instructeurId: ctx.instructeurId },
  });
  if (!wf) return null;
  return { ctx, workflow: wf };
}

/** GET /api/vendeur/automatisations/[id] */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const owned = await ensureOwnership(session, id);
    if (!owned) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 });

    return NextResponse.json({ data: owned.workflow });
  } catch (err) {
    console.error("[workflow GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** PATCH /api/vendeur/automatisations/[id]
 *  Body: { name?, description?, triggerType?, status?, actions?, conditions? }
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const owned = await ensureOwnership(session, id);
    if (!owned) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.description === "string") data.description = body.description.trim() || null;
    if (typeof body.triggerType === "string")
      data.triggerType = body.triggerType as AutomationTriggerType;
    if (typeof body.status === "string") data.status = body.status as WorkflowStatus;
    if (body.actions !== undefined) {
      // Light validation: actions must be an array of { id, type, config } with a known type
      if (!Array.isArray(body.actions)) {
        return NextResponse.json(
          { error: "actions doit être un tableau" },
          { status: 400 }
        );
      }
      const ALLOWED_TYPES = new Set([
        "SEND_EMAIL",
        "ADD_TAG",
        "ENROLL_SEQUENCE",
        "WEBHOOK",
        "WAIT",
      ]);
      for (const a of body.actions) {
        if (
          !a ||
          typeof a !== "object" ||
          typeof a.id !== "string" ||
          typeof a.type !== "string" ||
          !ALLOWED_TYPES.has(a.type) ||
          typeof a.config !== "object"
        ) {
          return NextResponse.json(
            { error: "Action invalide dans le tableau" },
            { status: 400 }
          );
        }
      }
      data.actions = body.actions;
    }
    if (body.conditions !== undefined) data.conditions = body.conditions;
    if (body.triggerConfig !== undefined) {
      if (body.triggerConfig === null) data.triggerConfig = null;
      else if (typeof body.triggerConfig === "object") data.triggerConfig = body.triggerConfig;
    }

    const updated = await prisma.automationWorkflow.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[workflow PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/** DELETE /api/vendeur/automatisations/[id] */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const owned = await ensureOwnership(session, id);
    if (!owned) return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 });

    await prisma.automationWorkflow.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[workflow DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
