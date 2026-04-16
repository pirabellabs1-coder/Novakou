/**
 * FreelanceHigh — Email Sequence Processor
 *
 * Traitement des sequences email automatisees etape par etape.
 * Gere l'inscription des utilisateurs dans les sequences, l'execution
 * des etapes (email, delai, condition, tag), et le traitement batch.
 *
 * En mode DEV (DEV_MODE=true), les donnees sont stockees dans des fichiers JSON.
 * En production, utilise Prisma (EmailSequence, EmailSequenceStep, EmailSequenceEnrollment).
 */

import { IS_DEV } from "../prisma";
import fs from "fs";
import path from "path";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SequenceRecord {
  id: string;
  instructeurId: string;
  name: string;
  description?: string;
  trigger: string;
  triggerConfig?: Record<string, unknown>;
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStepRecord {
  id: string;
  sequenceId: string;
  stepOrder: number;
  stepType: "EMAIL" | "DELAY" | "CONDITION" | "TAG_ACTION";
  // EMAIL fields
  subjectFr?: string;
  subjectEn?: string;
  bodyFr?: string;
  bodyEn?: string;
  // DELAY fields
  delayMinutes?: number;
  // CONDITION fields
  conditionField?: string;
  conditionOp?: string;
  conditionValue?: string;
  // TAG_ACTION fields
  tagAction?: string;
  tagName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentRecord {
  id: string;
  sequenceId: string;
  userId: string;
  currentStepIdx: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
  nextStepAt: string | null;
  completedAt: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── DEV Mode Store ───────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "lib", "dev");
const SEQUENCES_FILE = path.join(DATA_DIR, "marketing-sequences.json");
const STEPS_FILE = path.join(DATA_DIR, "marketing-sequence-steps.json");
const ENROLLMENTS_FILE = path.join(DATA_DIR, "marketing-sequence-enrollments.json");

function ensureDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    ensureDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const SEED_SEQUENCES: SequenceRecord[] = [
  {
    id: "seq-onboarding",
    instructeurId: "dev-instructeur-1",
    name: "Sequence d'accueil",
    description: "Emails envoyes apres l'inscription pour guider les nouveaux utilisateurs.",
    trigger: "SIGNUP",
    isActive: true,
    totalEnrolled: 0,
    totalCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seq-post-purchase",
    instructeurId: "dev-instructeur-1",
    name: "Suivi post-achat",
    description: "Emails de suivi apres un achat de formation.",
    trigger: "PURCHASE",
    isActive: true,
    totalEnrolled: 0,
    totalCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seq-cart-recovery",
    instructeurId: "dev-instructeur-1",
    name: "Recuperation panier abandonne",
    description: "Relance automatique apres un abandon de panier.",
    trigger: "ABANDONED_CART",
    isActive: true,
    totalEnrolled: 0,
    totalCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_STEPS: SequenceStepRecord[] = [
  // Onboarding sequence
  {
    id: "step-onboard-1",
    sequenceId: "seq-onboarding",
    stepOrder: 0,
    stepType: "EMAIL",
    subjectFr: "Bienvenue ! Voici comment bien demarrer",
    bodyFr: "Bonjour {{name}}, bienvenue sur FreelanceHigh ! Decouvrez nos formations...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-onboard-2",
    sequenceId: "seq-onboarding",
    stepOrder: 1,
    stepType: "DELAY",
    delayMinutes: 1440, // 1 day
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-onboard-3",
    sequenceId: "seq-onboarding",
    stepOrder: 2,
    stepType: "EMAIL",
    subjectFr: "Avez-vous explore notre catalogue ?",
    bodyFr: "Bonjour {{name}}, nous avons des formations pour tous les niveaux...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-onboard-4",
    sequenceId: "seq-onboarding",
    stepOrder: 3,
    stepType: "DELAY",
    delayMinutes: 4320, // 3 days
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-onboard-5",
    sequenceId: "seq-onboarding",
    stepOrder: 4,
    stepType: "CONDITION",
    conditionField: "has_purchased",
    conditionOp: "eq",
    conditionValue: "false",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-onboard-6",
    sequenceId: "seq-onboarding",
    stepOrder: 5,
    stepType: "EMAIL",
    subjectFr: "Votre code -10% expire bientot",
    bodyFr: "Bonjour {{name}}, profitez de -10% sur votre premiere formation avec le code WELCOME10...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-onboard-7",
    sequenceId: "seq-onboarding",
    stepOrder: 6,
    stepType: "TAG_ACTION",
    tagAction: "add",
    tagName: "onboarding_completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Post-purchase sequence
  {
    id: "step-postpurch-1",
    sequenceId: "seq-post-purchase",
    stepOrder: 0,
    stepType: "EMAIL",
    subjectFr: "Merci pour votre achat ! Commencez votre formation",
    bodyFr: "Bonjour {{name}}, votre formation {{formationTitle}} est prete. Commencez maintenant...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-postpurch-2",
    sequenceId: "seq-post-purchase",
    stepOrder: 1,
    stepType: "DELAY",
    delayMinutes: 4320, // 3 days
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-postpurch-3",
    sequenceId: "seq-post-purchase",
    stepOrder: 2,
    stepType: "CONDITION",
    conditionField: "course_progress",
    conditionOp: "lt",
    conditionValue: "30",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-postpurch-4",
    sequenceId: "seq-post-purchase",
    stepOrder: 3,
    stepType: "EMAIL",
    subjectFr: "N'oubliez pas votre formation !",
    bodyFr: "Bonjour {{name}}, vous avez commence {{formationTitle}} mais n'avez pas encore progresse. Reprenez...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Cart recovery sequence
  {
    id: "step-cart-1",
    sequenceId: "seq-cart-recovery",
    stepOrder: 0,
    stepType: "DELAY",
    delayMinutes: 60, // 1 hour
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-cart-2",
    sequenceId: "seq-cart-recovery",
    stepOrder: 1,
    stepType: "EMAIL",
    subjectFr: "Vous avez oublie quelque chose !",
    bodyFr: "Bonjour {{name}}, vous aviez {{formationTitle}} dans votre panier. Finalisez votre achat...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-cart-3",
    sequenceId: "seq-cart-recovery",
    stepOrder: 2,
    stepType: "DELAY",
    delayMinutes: 1440, // 1 day
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "step-cart-4",
    sequenceId: "seq-cart-recovery",
    stepOrder: 3,
    stepType: "EMAIL",
    subjectFr: "-10% pour finaliser votre achat",
    bodyFr: "Bonjour {{name}}, nous vous offrons -10% avec le code CART10. Valable 48h...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getSequences(): SequenceRecord[] {
  const existing = readJson<SequenceRecord[]>(SEQUENCES_FILE, []);
  if (existing.length === 0) {
    writeJson(SEQUENCES_FILE, SEED_SEQUENCES);
    return SEED_SEQUENCES;
  }
  return existing;
}

function saveSequences(sequences: SequenceRecord[]): void {
  writeJson(SEQUENCES_FILE, sequences);
}

function getSteps(): SequenceStepRecord[] {
  const existing = readJson<SequenceStepRecord[]>(STEPS_FILE, []);
  if (existing.length === 0) {
    writeJson(STEPS_FILE, SEED_STEPS);
    return SEED_STEPS;
  }
  return existing;
}

function getStepsForSequence(sequenceId: string): SequenceStepRecord[] {
  const steps = getSteps();
  return steps
    .filter((s) => s.sequenceId === sequenceId)
    .sort((a, b) => a.stepOrder - b.stepOrder);
}

function getEnrollments(): EnrollmentRecord[] {
  return readJson<EnrollmentRecord[]>(ENROLLMENTS_FILE, []);
}

function saveEnrollments(enrollments: EnrollmentRecord[]): void {
  writeJson(ENROLLMENTS_FILE, enrollments);
}

// ── Enrollment ───────────────────────────────────────────────────────────────

/**
 * Enroll a user in an email sequence.
 * If the user is already actively enrolled, this is a no-op.
 */
export async function enrollUserInSequence(
  sequenceId: string,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (IS_DEV) {
    return enrollUserInSequenceDev(sequenceId, userId, metadata);
  }

  // Production: use Prisma
  try {
    const prismaModule = await import("@freelancehigh/db");
    const prisma = prismaModule.prisma;

    // Check if already actively enrolled
    const existing = await prisma.emailSequenceEnrollment.findUnique({
      where: { sequenceId_userId: { sequenceId, userId } },
    });

    if (existing && existing.status === "ACTIVE") {
      console.log(
        `[Sequence] User ${userId} already actively enrolled in ${sequenceId}`
      );
      return;
    }

    if (existing) {
      // Re-activate cancelled/completed enrollment
      await prisma.emailSequenceEnrollment.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          currentStepIdx: 0,
          nextStepAt: new Date(),
          completedAt: null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });
    } else {
      await prisma.emailSequenceEnrollment.create({
        data: {
          sequenceId,
          userId,
          currentStepIdx: 0,
          status: "ACTIVE",
          nextStepAt: new Date(),
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });
    }

    // Increment total enrolled
    await prisma.emailSequence.update({
      where: { id: sequenceId },
      data: { totalEnrolled: { increment: 1 } },
    });

    console.log(`[Sequence] Enrolled user ${userId} in sequence ${sequenceId}`);
  } catch (err) {
    console.error(`[Sequence] Error enrolling user ${userId} in ${sequenceId}:`, err);
    throw err;
  }
}

function enrollUserInSequenceDev(
  sequenceId: string,
  userId: string,
  metadata?: Record<string, unknown>
): void {
  const enrollments = getEnrollments();

  // Check if already enrolled
  const existing = enrollments.find(
    (e) => e.sequenceId === sequenceId && e.userId === userId
  );

  if (existing && existing.status === "ACTIVE") {
    console.log(
      `[Sequence] User ${userId} already actively enrolled in ${sequenceId}`
    );
    return;
  }

  if (existing) {
    // Re-activate
    existing.status = "ACTIVE";
    existing.currentStepIdx = 0;
    existing.nextStepAt = new Date().toISOString();
    existing.completedAt = null;
    existing.metadata = metadata;
    existing.updatedAt = new Date().toISOString();
  } else {
    enrollments.push({
      id: `enroll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sequenceId,
      userId,
      currentStepIdx: 0,
      status: "ACTIVE",
      nextStepAt: new Date().toISOString(),
      completedAt: null,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveEnrollments(enrollments);

  // Increment sequence enrolled count
  const sequences = getSequences();
  const seq = sequences.find((s) => s.id === sequenceId);
  if (seq) {
    seq.totalEnrolled += 1;
    seq.updatedAt = new Date().toISOString();
    saveSequences(sequences);
  }

  console.log(`[Sequence] Enrolled user ${userId} in sequence ${sequenceId}`);
}

// ── Process Next Step ────────────────────────────────────────────────────────

/**
 * Process the next step for a specific enrollment.
 * Returns once the step is executed (or the enrollment is completed/paused).
 */
export async function processNextStep(enrollmentId: string): Promise<void> {
  if (IS_DEV) {
    return processNextStepDev(enrollmentId);
  }

  // Production: use Prisma
  try {
    const prismaModule = await import("@freelancehigh/db");
    const prisma = prismaModule.prisma;

    const enrollment = await prisma.emailSequenceEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        sequence: {
          include: {
            steps: { orderBy: { stepOrder: "asc" } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!enrollment || enrollment.status !== "ACTIVE") return;

    const steps = enrollment.sequence.steps;
    if (enrollment.currentStepIdx >= steps.length) {
      // All steps completed
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      await prisma.emailSequence.update({
        where: { id: enrollment.sequenceId },
        data: { totalCompleted: { increment: 1 } },
      });
      return;
    }

    const step = steps[enrollment.currentStepIdx];
    const context = {
      name: enrollment.user.name || "Utilisateur",
      email: enrollment.user.email,
      userId: enrollment.userId,
      ...(enrollment.metadata as Record<string, unknown> || {}),
    };

    try {
      await executeStep(step as unknown as SequenceStepRecord, context);
    } catch (err) {
      if (err instanceof SequenceConditionNotMetError) {
        // Condition not met: pause the sequence instead of retrying forever
        console.log(
          `[Sequence] Condition not met in enrollment ${enrollmentId}, pausing sequence.`
        );
        await prisma.emailSequenceEnrollment.update({
          where: { id: enrollmentId },
          data: { status: "PAUSED", nextStepAt: null },
        });
        return;
      }
      throw err;
    }

    // Calculate next step timing
    const nextIdx = enrollment.currentStepIdx + 1;
    let nextStepAt: Date | null = new Date();

    if (nextIdx < steps.length) {
      const nextStep = steps[nextIdx];
      if (nextStep.stepType === "DELAY" && nextStep.delayMinutes) {
        nextStepAt = new Date(Date.now() + nextStep.delayMinutes * 60 * 1000);
      }
    }

    await prisma.emailSequenceEnrollment.update({
      where: { id: enrollmentId },
      data: {
        currentStepIdx: nextIdx,
        nextStepAt,
      },
    });
  } catch (err) {
    console.error(`[Sequence] Error processing step for enrollment ${enrollmentId}:`, err);
  }
}

function processNextStepDev(enrollmentId: string): void {
  const enrollments = getEnrollments();
  const enrollment = enrollments.find((e) => e.id === enrollmentId);

  if (!enrollment || enrollment.status !== "ACTIVE") return;

  const steps = getStepsForSequence(enrollment.sequenceId);

  if (enrollment.currentStepIdx >= steps.length) {
    // All steps completed
    enrollment.status = "COMPLETED";
    enrollment.completedAt = new Date().toISOString();
    enrollment.updatedAt = new Date().toISOString();
    saveEnrollments(enrollments);

    const sequences = getSequences();
    const seq = sequences.find((s) => s.id === enrollment.sequenceId);
    if (seq) {
      seq.totalCompleted += 1;
      seq.updatedAt = new Date().toISOString();
      saveSequences(sequences);
    }

    console.log(
      `[Sequence] Enrollment ${enrollmentId} completed all steps.`
    );
    return;
  }

  const step = steps[enrollment.currentStepIdx];
  const context = {
    name: "Utilisateur",
    userId: enrollment.userId,
    ...(enrollment.metadata || {}),
  };

  // Execute the step synchronously for dev
  const stepPassed = executeStepSync(step, context);

  // If a CONDITION step failed, pause the sequence
  if (!stepPassed) {
    console.log(
      `[Sequence] Condition not met in enrollment ${enrollmentId}, pausing sequence.`
    );
    enrollment.status = "PAUSED";
    enrollment.nextStepAt = null;
    enrollment.updatedAt = new Date().toISOString();
    saveEnrollments(enrollments);
    return;
  }

  // Advance to next step
  const nextIdx = enrollment.currentStepIdx + 1;
  enrollment.currentStepIdx = nextIdx;
  enrollment.updatedAt = new Date().toISOString();

  // Calculate next step execution time
  if (nextIdx < steps.length) {
    const nextStep = steps[nextIdx];
    if (nextStep.stepType === "DELAY" && nextStep.delayMinutes) {
      enrollment.nextStepAt = new Date(
        Date.now() + nextStep.delayMinutes * 60 * 1000
      ).toISOString();
    } else {
      enrollment.nextStepAt = new Date().toISOString();
    }
  } else {
    enrollment.nextStepAt = null;
  }

  saveEnrollments(enrollments);
}

// ── Batch Processing ─────────────────────────────────────────────────────────

/**
 * Process all pending enrollment steps that are due.
 * Called periodically (e.g., every minute via cron or BullMQ repeatable job).
 * Returns the number of steps processed.
 */
export async function processPendingSteps(): Promise<number> {
  const now = new Date();
  let processed = 0;

  if (IS_DEV) {
    const enrollments = getEnrollments();
    const dueEnrollments = enrollments.filter(
      (e) =>
        e.status === "ACTIVE" &&
        e.nextStepAt !== null &&
        new Date(e.nextStepAt) <= now
    );

    for (const enrollment of dueEnrollments) {
      try {
        processNextStepDev(enrollment.id);
        processed++;
      } catch (err) {
        console.error(
          `[Sequence] Error processing enrollment ${enrollment.id}:`,
          err
        );
      }
    }

    if (processed > 0) {
      console.log(`[Sequence] Batch processed ${processed} pending step(s).`);
    }

    return processed;
  }

  // Production: use Prisma
  try {
    const prismaModule = await import("@freelancehigh/db");
    const prisma = prismaModule.prisma;

    const dueEnrollments = await prisma.emailSequenceEnrollment.findMany({
      where: {
        status: "ACTIVE",
        nextStepAt: { lte: now },
      },
      take: 100, // Process in batches of 100
    });

    for (const enrollment of dueEnrollments) {
      try {
        await processNextStep(enrollment.id);
        processed++;
      } catch (err) {
        console.error(
          `[Sequence] Error processing enrollment ${enrollment.id}:`,
          err
        );
      }
    }

    if (processed > 0) {
      console.log(`[Sequence] Batch processed ${processed} pending step(s).`);
    }
  } catch (err) {
    console.error("[Sequence] Error in batch processing:", err);
  }

  return processed;
}

// ── Cancel Enrollment ────────────────────────────────────────────────────────

/**
 * Cancel a user's enrollment in a sequence.
 */
export async function cancelEnrollment(
  sequenceId: string,
  userId: string
): Promise<void> {
  if (IS_DEV) {
    const enrollments = getEnrollments();
    const enrollment = enrollments.find(
      (e) => e.sequenceId === sequenceId && e.userId === userId && e.status === "ACTIVE"
    );

    if (!enrollment) {
      console.log(
        `[Sequence] No active enrollment found for user ${userId} in sequence ${sequenceId}`
      );
      return;
    }

    enrollment.status = "CANCELLED";
    enrollment.nextStepAt = null;
    enrollment.updatedAt = new Date().toISOString();
    saveEnrollments(enrollments);

    console.log(
      `[Sequence] Cancelled enrollment for user ${userId} in sequence ${sequenceId}`
    );
    return;
  }

  // Production: use Prisma
  try {
    const prismaModule = await import("@freelancehigh/db");
    const prisma = prismaModule.prisma;

    await prisma.emailSequenceEnrollment.updateMany({
      where: {
        sequenceId,
        userId,
        status: "ACTIVE",
      },
      data: {
        status: "CANCELLED",
        nextStepAt: null,
      },
    });

    console.log(
      `[Sequence] Cancelled enrollment for user ${userId} in sequence ${sequenceId}`
    );
  } catch (err) {
    console.error(`[Sequence] Error cancelling enrollment:`, err);
  }
}

// ── Condition Evaluation ─────────────────────────────────────────────────────

/**
 * Evaluate a single condition against a context object.
 * Used by CONDITION step type to decide whether to continue the sequence.
 */
export function evaluateCondition(
  field: string,
  op: string,
  value: string,
  context: Record<string, unknown>
): boolean {
  const fieldValue = resolveNestedField(field, context);

  switch (op) {
    case "eq":
      return String(fieldValue) === value;
    case "neq":
      return String(fieldValue) !== value;
    case "gt":
      return Number(fieldValue) > Number(value);
    case "gte":
      return Number(fieldValue) >= Number(value);
    case "lt":
      return Number(fieldValue) < Number(value);
    case "lte":
      return Number(fieldValue) <= Number(value);
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(value);
    case "not_contains":
      return typeof fieldValue === "string" && !fieldValue.includes(value);
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    case "not_exists":
      return fieldValue === undefined || fieldValue === null;
    case "in": {
      const values = value.split(",").map((v) => v.trim());
      return values.includes(String(fieldValue));
    }
    default:
      console.warn(`[Sequence] Unknown condition operator: ${op}`);
      return true;
  }
}

// ── Step Execution ───────────────────────────────────────────────────────────

async function executeStep(
  step: SequenceStepRecord,
  context: Record<string, unknown>
): Promise<void> {
  switch (step.stepType) {
    case "EMAIL": {
      const subject = step.subjectFr || step.subjectEn || "Sans sujet";
      const body = step.bodyFr || step.bodyEn || "";
      const personalizedSubject = interpolateTemplate(subject, context);
      const personalizedBody = interpolateTemplate(body, context);

      console.log(
        `[Sequence] SEND EMAIL: to=${context.email || context.userId}, subject="${personalizedSubject}"`
      );
      // In production, call the actual email service:
      // await sendSequenceEmail(context.email, personalizedSubject, personalizedBody);
      break;
    }

    case "DELAY": {
      // Delays are handled by the scheduling logic (nextStepAt).
      // When we reach a DELAY step, we skip it and set nextStepAt accordingly.
      console.log(
        `[Sequence] DELAY: ${step.delayMinutes || 0} minutes`
      );
      break;
    }

    case "CONDITION": {
      if (step.conditionField && step.conditionOp && step.conditionValue !== undefined) {
        const passes = evaluateCondition(
          step.conditionField,
          step.conditionOp,
          step.conditionValue,
          context
        );
        if (!passes) {
          console.log(
            `[Sequence] CONDITION not met: ${step.conditionField} ${step.conditionOp} ${step.conditionValue}. Skipping remaining steps.`
          );
          // In a more sophisticated system, we could branch or skip to a specific step.
          // For now, conditions that fail halt the sequence.
          throw new SequenceConditionNotMetError(
            `Condition not met: ${step.conditionField} ${step.conditionOp} ${step.conditionValue}`
          );
        }
        console.log(
          `[Sequence] CONDITION met: ${step.conditionField} ${step.conditionOp} ${step.conditionValue}`
        );
      }
      break;
    }

    case "TAG_ACTION": {
      const action = step.tagAction;
      const tagName = step.tagName;
      if (action && tagName) {
        console.log(
          `[Sequence] TAG_ACTION: ${action} tag="${tagName}" for userId=${context.userId}`
        );
        // Use the automation engine's tag management
        try {
          const { executeAction } = await import("./automation-engine");
          const dummyContext = {
            event: { type: "TAG_ADDED" as const, userId: String(context.userId), metadata: {}, timestamp: new Date() },
            workflow: { id: "", name: "", triggerType: "TAG_ADDED" as const, actions: [], isActive: true, createdAt: "", updatedAt: "" },
            userId: String(context.userId),
            metadata: {},
            results: {},
          };

          if (action === "add") {
            await executeAction({ type: "ADD_TAG", config: { tag: tagName } }, dummyContext);
          } else if (action === "remove") {
            await executeAction({ type: "REMOVE_TAG", config: { tag: tagName } }, dummyContext);
          }
        } catch (err) {
          console.error(`[Sequence] Error in TAG_ACTION:`, err);
        }
      }
      break;
    }

    default:
      console.warn(`[Sequence] Unknown step type: ${step.stepType}`);
  }
}

/**
 * Execute a step synchronously for dev mode.
 * Returns false if a CONDITION step fails (sequence should be paused).
 */
function executeStepSync(
  step: SequenceStepRecord,
  context: Record<string, unknown>
): boolean {
  switch (step.stepType) {
    case "EMAIL": {
      const subject = step.subjectFr || step.subjectEn || "Sans sujet";
      const body = step.bodyFr || step.bodyEn || "";
      const personalizedSubject = interpolateTemplate(subject, context);
      console.log(
        `[Sequence] SEND EMAIL (dev): subject="${personalizedSubject}", userId=${context.userId}`
      );
      void body;
      return true;
    }
    case "DELAY":
      console.log(`[Sequence] DELAY (dev): ${step.delayMinutes || 0} minutes`);
      return true;
    case "CONDITION": {
      if (step.conditionField && step.conditionOp && step.conditionValue !== undefined) {
        const passes = evaluateCondition(
          step.conditionField,
          step.conditionOp,
          step.conditionValue,
          context
        );
        console.log(
          `[Sequence] CONDITION (dev): ${step.conditionField} ${step.conditionOp} ${step.conditionValue} -> ${passes}`
        );
        return passes;
      }
      return true;
    }
    case "TAG_ACTION":
      console.log(
        `[Sequence] TAG_ACTION (dev): ${step.tagAction} "${step.tagName}" for userId=${context.userId}`
      );
      return true;
    default:
      console.warn(`[Sequence] Unknown step type: ${step.stepType}`);
      return true;
  }
}

// ── Helper: Template Interpolation ───────────────────────────────────────────

/**
 * Replace {{key}} placeholders with context values.
 */
function interpolateTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = context[key];
    return value !== undefined && value !== null ? String(value) : `{{${key}}}`;
  });
}

// ── Helper: Nested field resolution ──────────────────────────────────────────

function resolveNestedField(
  field: string,
  obj: Record<string, unknown>
): unknown {
  const parts = field.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

// ── Custom Error ─────────────────────────────────────────────────────────────

class SequenceConditionNotMetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SequenceConditionNotMetError";
  }
}

// ── Query Helpers (DEV) ──────────────────────────────────────────────────────

export function getAllSequences(instructeurId?: string): SequenceRecord[] {
  const sequences = getSequences();
  if (instructeurId) {
    return sequences.filter((s) => s.instructeurId === instructeurId);
  }
  return sequences;
}

export function getSequenceById(id: string): SequenceRecord | null {
  const sequences = getSequences();
  return sequences.find((s) => s.id === id) ?? null;
}

export function getSequenceSteps(sequenceId: string): SequenceStepRecord[] {
  return getStepsForSequence(sequenceId);
}

export function getSequenceEnrollments(
  sequenceId: string,
  status?: string
): EnrollmentRecord[] {
  const enrollments = getEnrollments();
  let filtered = enrollments.filter((e) => e.sequenceId === sequenceId);
  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }
  return filtered;
}

export function getUserEnrollments(userId: string): EnrollmentRecord[] {
  const enrollments = getEnrollments();
  return enrollments.filter((e) => e.userId === userId);
}
