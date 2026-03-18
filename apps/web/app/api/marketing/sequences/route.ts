// GET /api/marketing/sequences — List email sequences for authenticated instructor
// POST /api/marketing/sequences — Create a new email sequence
// PUT /api/marketing/sequences — Update a sequence (toggle active, update steps)
// DELETE /api/marketing/sequences — Delete a sequence

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// ── Types ──────────────────────────────────────────────────────────────────

interface MockSequence {
  id: string;
  instructeurId: string;
  name: string;
  description: string;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  openRate: number;
  stepsCount: number;
  steps: MockStep[];
  createdAt: string;
  updatedAt: string;
}

interface MockStep {
  id: string;
  sequenceId: string;
  stepOrder: number;
  stepType: "EMAIL" | "DELAY" | "CONDITION" | "TAG_ACTION";
  subjectFr?: string;
  subjectEn?: string;
  bodyFr?: string;
  bodyEn?: string;
  delayMinutes?: number;
  conditionField?: string;
  conditionOp?: string;
  conditionValue?: string;
  tagAction?: string;
  tagName?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_SEQUENCES: MockSequence[] = [];

let devSequences = [...MOCK_SEQUENCES];

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sequenceId = searchParams.get("id");

    if (DEV_MODE) {
      // Single sequence detail
      if (sequenceId) {
        const seq = devSequences.find((s) => s.id === sequenceId);
        if (!seq) {
          return NextResponse.json({ error: "Sequence non trouvee" }, { status: 404 });
        }
        return NextResponse.json({ sequence: seq });
      }

      // List all sequences with stats
      const totalEnrolled = devSequences.reduce((sum, s) => sum + s.totalEnrolled, 0);
      const totalCompleted = devSequences.reduce((sum, s) => sum + s.totalCompleted, 0);
      const avgOpenRate =
        devSequences.length > 0
          ? devSequences.reduce((sum, s) => sum + s.openRate, 0) / devSequences.length
          : 0;

      return NextResponse.json({
        sequences: devSequences.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          trigger: s.trigger,
          triggerConfig: s.triggerConfig,
          isActive: s.isActive,
          totalEnrolled: s.totalEnrolled,
          totalCompleted: s.totalCompleted,
          openRate: s.openRate,
          stepsCount: s.stepsCount,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
        stats: {
          totalSequences: devSequences.length,
          activeSequences: devSequences.filter((s) => s.isActive).length,
          totalEnrolled,
          totalCompleted,
          avgOpenRate: parseFloat(avgOpenRate.toFixed(1)),
        },
      });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    if (sequenceId) {
      const sequence = await prisma.emailSequence.findFirst({
        where: { id: sequenceId, instructeurId: instructeur.id },
        include: {
          steps: { orderBy: { stepOrder: "asc" } },
          _count: { select: { enrollments: true } },
        },
      });

      if (!sequence) {
        return NextResponse.json({ error: "Sequence non trouvee" }, { status: 404 });
      }

      return NextResponse.json({ sequence });
    }

    const sequences = await prisma.emailSequence.findMany({
      where: { instructeurId: instructeur.id },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalEnrolled = sequences.reduce((sum, s) => sum + s.totalEnrolled, 0);
    const totalCompleted = sequences.reduce((sum, s) => sum + s.totalCompleted, 0);

    return NextResponse.json({
      sequences: sequences.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        trigger: s.trigger,
        triggerConfig: s.triggerConfig,
        isActive: s.isActive,
        totalEnrolled: s.totalEnrolled,
        totalCompleted: s.totalCompleted,
        openRate: 0,
        stepsCount: s.steps.length,
        steps: s.steps,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      stats: {
        totalSequences: sequences.length,
        activeSequences: sequences.filter((s) => s.isActive).length,
        totalEnrolled,
        totalCompleted,
        avgOpenRate: 0,
      },
    });
  } catch (error) {
    console.error("[GET /api/marketing/sequences]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, trigger, triggerConfig, steps } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Le nom est requis (min 2 caracteres)" }, { status: 400 });
    }

    const validTriggers = [
      "PURCHASE",
      "ENROLLMENT",
      "ABANDONED_CART",
      "USER_INACTIVITY",
      "COURSE_COMPLETION",
      "SIGNUP",
      "TAG_ADDED",
    ];
    if (!trigger || !validTriggers.includes(trigger)) {
      return NextResponse.json(
        { error: `Declencheur invalide. Valeurs possibles: ${validTriggers.join(", ")}` },
        { status: 400 },
      );
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "Au moins une etape est requise" }, { status: 400 });
    }

    // Validate each step
    const validStepTypes = ["EMAIL", "DELAY", "CONDITION", "TAG_ACTION"];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.stepType || !validStepTypes.includes(step.stepType)) {
        return NextResponse.json(
          { error: `Etape ${i + 1}: type invalide` },
          { status: 400 },
        );
      }
      if (step.stepType === "EMAIL" && !step.subjectFr) {
        return NextResponse.json(
          { error: `Etape ${i + 1}: le sujet (FR) est requis pour un email` },
          { status: 400 },
        );
      }
      if (step.stepType === "DELAY" && (!step.delayMinutes || step.delayMinutes < 1)) {
        return NextResponse.json(
          { error: `Etape ${i + 1}: le delai doit etre superieur a 0 minute` },
          { status: 400 },
        );
      }
    }

    if (DEV_MODE) {
      const newId = `seq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();

      const newSteps: MockStep[] = steps.map((step: MockStep, idx: number) => ({
        id: `step-${newId}-${idx}`,
        sequenceId: newId,
        stepOrder: idx,
        stepType: step.stepType,
        subjectFr: step.subjectFr || undefined,
        subjectEn: step.subjectEn || undefined,
        bodyFr: step.bodyFr || undefined,
        bodyEn: step.bodyEn || undefined,
        delayMinutes: step.delayMinutes || undefined,
        conditionField: step.conditionField || undefined,
        conditionOp: step.conditionOp || undefined,
        conditionValue: step.conditionValue || undefined,
        tagAction: step.tagAction || undefined,
        tagName: step.tagName || undefined,
      }));

      const newSequence: MockSequence = {
        id: newId,
        instructeurId: "dev-instructeur-1",
        name: name.trim(),
        description: description || "",
        trigger,
        triggerConfig: triggerConfig || {},
        isActive: body.isActive !== false,
        totalEnrolled: 0,
        totalCompleted: 0,
        openRate: 0,
        stepsCount: newSteps.length,
        steps: newSteps,
        createdAt: now,
        updatedAt: now,
      };

      devSequences.push(newSequence);
      return NextResponse.json({ sequence: newSequence }, { status: 201 });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const sequence = await prisma.emailSequence.create({
      data: {
        instructeurId: instructeur.id,
        name: name.trim(),
        description: description || "",
        trigger,
        triggerConfig: triggerConfig || {},
        isActive: body.isActive !== false,
        steps: {
          create: steps.map((step: MockStep, idx: number) => ({
            stepOrder: idx,
            stepType: step.stepType,
            subjectFr: step.subjectFr || null,
            subjectEn: step.subjectEn || null,
            bodyFr: step.bodyFr || null,
            bodyEn: step.bodyEn || null,
            delayMinutes: step.delayMinutes || null,
            conditionField: step.conditionField || null,
            conditionOp: step.conditionOp || null,
            conditionValue: step.conditionValue || null,
            tagAction: step.tagAction || null,
            tagName: step.tagName || null,
          })),
        },
      },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
      },
    });

    return NextResponse.json({ sequence }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/sequences]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, trigger, triggerConfig, isActive, steps } = body;

    if (!id) {
      return NextResponse.json({ error: "L'identifiant de la sequence est requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const idx = devSequences.findIndex((s) => s.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Sequence non trouvee" }, { status: 404 });
      }

      const seq = devSequences[idx];
      const now = new Date().toISOString();

      if (name !== undefined) seq.name = name.trim();
      if (description !== undefined) seq.description = description;
      if (trigger !== undefined) seq.trigger = trigger;
      if (triggerConfig !== undefined) seq.triggerConfig = triggerConfig;
      if (isActive !== undefined) seq.isActive = isActive;

      // Update steps if provided
      if (Array.isArray(steps)) {
        seq.steps = steps.map((step: MockStep, stepIdx: number) => ({
          id: step.id || `step-${id}-${stepIdx}`,
          sequenceId: id,
          stepOrder: stepIdx,
          stepType: step.stepType,
          subjectFr: step.subjectFr || undefined,
          subjectEn: step.subjectEn || undefined,
          bodyFr: step.bodyFr || undefined,
          bodyEn: step.bodyEn || undefined,
          delayMinutes: step.delayMinutes || undefined,
          conditionField: step.conditionField || undefined,
          conditionOp: step.conditionOp || undefined,
          conditionValue: step.conditionValue || undefined,
          tagAction: step.tagAction || undefined,
          tagName: step.tagName || undefined,
        }));
        seq.stepsCount = seq.steps.length;
      }

      seq.updatedAt = now;
      devSequences[idx] = seq;

      return NextResponse.json({ sequence: seq });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const existing = await prisma.emailSequence.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Sequence non trouvee" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (triggerConfig !== undefined) updateData.triggerConfig = triggerConfig;
    if (isActive !== undefined) updateData.isActive = isActive;

    const sequence = await prisma.emailSequence.update({
      where: { id },
      data: updateData,
    });

    // Replace steps if provided
    if (Array.isArray(steps)) {
      await prisma.emailSequenceStep.deleteMany({ where: { sequenceId: id } });
      await prisma.emailSequenceStep.createMany({
        data: steps.map((step: MockStep, stepIdx: number) => ({
          sequenceId: id,
          stepOrder: stepIdx,
          stepType: step.stepType,
          subjectFr: step.subjectFr || null,
          subjectEn: step.subjectEn || null,
          bodyFr: step.bodyFr || null,
          bodyEn: step.bodyEn || null,
          delayMinutes: step.delayMinutes || null,
          conditionField: step.conditionField || null,
          conditionOp: step.conditionOp || null,
          conditionValue: step.conditionValue || null,
          tagAction: step.tagAction || null,
          tagName: step.tagName || null,
        })),
      });
    }

    const updated = await prisma.emailSequence.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json({ sequence: updated });
  } catch (error) {
    console.error("[PUT /api/marketing/sequences]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "L'identifiant de la sequence est requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const idx = devSequences.findIndex((s) => s.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Sequence non trouvee" }, { status: 404 });
      }
      devSequences.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const existing = await prisma.emailSequence.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Sequence non trouvee" }, { status: 404 });
    }

    // Delete steps, enrollments, and sequence
    await prisma.emailSequenceEnrollment.deleteMany({ where: { sequenceId: id } });
    await prisma.emailSequenceStep.deleteMany({ where: { sequenceId: id } });
    await prisma.emailSequence.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/sequences]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
