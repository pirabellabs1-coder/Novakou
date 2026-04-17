import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { EmailSequenceTrigger } from "@prisma/client";
import { sanitizeRichHtml } from "@/lib/sanitize-html";

type Params = { params: Promise<{ id: string }> };

async function ensureOwnership(session: Awaited<ReturnType<typeof getServerSession>>, sequenceId: string) {
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return null;

  // Primary lookup : via instructeurProfile.id (stable unique key)
  let seq = await prisma.emailSequence.findFirst({
    where: { id: sequenceId, instructeurId: ctx.instructeurId },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
    },
  });

  if (!seq) {
    // Fallback : the seq exists in DB but under a different instructeurProfile.
    // This can happen if the user ended up with a duplicate or migrated profile
    // after role changes. We verify ownership via userId on the joined profile.
    const any = await prisma.emailSequence.findUnique({
      where: { id: sequenceId },
      include: {
        instructeur: { select: { userId: true } },
        steps: { orderBy: { stepOrder: "asc" } },
      },
    });
    if (any?.instructeur?.userId === ctx.userId) {
      // The user legitimately owns this sequence via another instructeurProfile —
      // accept the lookup (and log so we can detect drift).
      console.warn(
        "[ensureOwnership] sequence owned by user but via different instructeurProfile",
        {
          sequenceId,
          expectedInstructeurId: ctx.instructeurId,
          actualInstructeurId: any?.instructeurId,
          userId: ctx.userId,
        },
      );
      // Strip the relation before returning (caller doesn't need it)
      const { instructeur: _, ...rest } = any;
      seq = rest;
    } else if (any) {
      // Sequence exists but belongs to another user entirely
      console.warn("[ensureOwnership] sequence exists but belongs to another user", {
        sequenceId,
        sessionUserId: ctx.userId,
      });
    } else {
      console.warn("[ensureOwnership] sequence not found at all", { sequenceId });
    }
  }

  if (!seq) return null;
  return { ctx, sequence: seq };
}

/** GET /api/vendeur/marketing/sequences/[id] */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const owned = await ensureOwnership(session, id);
    if (!owned) return NextResponse.json({ error: "Séquence introuvable" }, { status: 404 });

    // Map steps to the shape expected by SequenceEditorClient
    const mappedSteps = owned.sequence.steps.map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      type: s.stepType,
      delayHours: s.delayMinutes != null ? Math.round(s.delayMinutes / 60) : null,
      subject: s.subjectFr,
      content: s.bodyFr,
      sendAtHour: null,
      condition: s.conditionField
        ? { field: s.conditionField, op: s.conditionOp, value: s.conditionValue }
        : null,
    }));

    return NextResponse.json({
      data: {
        id: owned.sequence.id,
        name: owned.sequence.name,
        description: owned.sequence.description,
        trigger: owned.sequence.trigger,
        isActive: owned.sequence.isActive,
        steps: mappedSteps,
      },
    });
  } catch (err) {
    console.error("[sequence GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** PATCH /api/vendeur/marketing/sequences/[id]
 *  Body: { name?, description?, trigger?, isActive? }
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const owned = await ensureOwnership(session, id);
    if (!owned) return NextResponse.json({ error: "Séquence introuvable" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.description === "string") data.description = body.description.trim() || null;
    if (typeof body.trigger === "string") data.trigger = body.trigger as EmailSequenceTrigger;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const updated = await prisma.emailSequence.update({
      where: { id },
      data,
    });

    // Persist subject/body for the first EMAIL step if provided
    if (typeof body.subject === "string" || typeof body.content === "string") {
      const firstEmailStep = owned.sequence.steps.find((s) => s.stepType === "EMAIL");
      const subject = typeof body.subject === "string" ? body.subject.trim() : undefined;
      const content =
        typeof body.content === "string" ? sanitizeRichHtml(body.content) : undefined;

      if (firstEmailStep) {
        await prisma.emailSequenceStep.update({
          where: { id: firstEmailStep.id },
          data: {
            ...(subject !== undefined ? { subjectFr: subject } : {}),
            ...(content !== undefined ? { bodyFr: content } : {}),
          },
        });
      } else {
        // No EMAIL step yet: create one at stepOrder 1
        await prisma.emailSequenceStep.create({
          data: {
            sequenceId: id,
            stepOrder: 1,
            stepType: "EMAIL",
            subjectFr: subject ?? "",
            bodyFr: content ?? "",
          },
        });
      }
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[sequence PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/** DELETE /api/vendeur/marketing/sequences/[id] */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const owned = await ensureOwnership(session, id);
    if (!owned) return NextResponse.json({ error: "Séquence introuvable" }, { status: 404 });

    await prisma.emailSequence.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[sequence DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
