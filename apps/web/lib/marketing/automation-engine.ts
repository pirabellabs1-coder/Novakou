/**
 * Novakou — Marketing Automation Engine
 *
 * Moteur trigger-condition-action central du systeme marketing.
 * En mode DEV (DEV_MODE=true), les workflows sont stockes dans un fichier JSON local.
 * En production, les workflows sont lus depuis la base Prisma.
 */

import { IS_DEV } from "../prisma";
import { eventBus } from "./event-bus";

// ── Trigger Types ────────────────────────────────────────────────────────────

export type TriggerType =
  | "PURCHASE"
  | "ENROLLMENT"
  | "CART_ABANDONED"
  | "COURSE_COMPLETED"
  | "LESSON_COMPLETED"
  | "QUIZ_PASSED"
  | "QUIZ_FAILED"
  | "USER_SIGNUP"
  | "USER_INACTIVE"
  | "TAG_ADDED"
  | "TAG_REMOVED"
  | "AFFILIATE_SALE"
  | "FUNNEL_STEP_REACHED"
  | "CUSTOM_EVENT";

// ── Action Types ─────────────────────────────────────────────────────────────

export type ActionType =
  | "SEND_EMAIL"
  | "ADD_TAG"
  | "REMOVE_TAG"
  | "ENROLL_SEQUENCE"
  | "CANCEL_SEQUENCE"
  | "GRANT_ACCESS"
  | "REVOKE_ACCESS"
  | "SEND_NOTIFICATION"
  | "WEBHOOK"
  | "DELAY"
  | "CONDITION_CHECK"
  | "CREATE_DISCOUNT"
  | "TRIGGER_UPSELL";

// ── Core Interfaces ──────────────────────────────────────────────────────────

export interface TriggerEvent {
  type: TriggerType;
  userId: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface WorkflowAction {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface WorkflowCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "in" | "not_in" | "exists";
  value: unknown;
  logic?: "AND" | "OR";
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  triggerType: TriggerType;
  triggerConfig?: Record<string, unknown>;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  instructeurId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionContext {
  event: TriggerEvent;
  workflow: WorkflowDefinition;
  userId: string;
  metadata: Record<string, unknown>;
  results: Record<string, unknown>;
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  userId: string;
  triggerType: TriggerType;
  status: "success" | "failed" | "partial";
  actionsExecuted: number;
  actionsFailed: number;
  error?: string;
  duration: number;
  executedAt: string;
}

// ── DEV Mode JSON Store ──────────────────────────────────────────────────────

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "lib", "dev");
const WORKFLOWS_FILE = path.join(DATA_DIR, "marketing-workflows.json");
const EXECUTION_LOG_FILE = path.join(DATA_DIR, "marketing-executions.json");

function ensureDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // ignore in dev
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
    // ignore write errors in dev
  }
}

// ── Default Seed Workflows (DEV) ─────────────────────────────────────────────

const SEED_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "wf-welcome-email",
    name: "Email de bienvenue apres inscription",
    triggerType: "USER_SIGNUP",
    isActive: true,
    actions: [
      { type: "SEND_EMAIL", config: { template: "welcome", subject: "Bienvenue sur Novakou !" } },
      { type: "ADD_TAG", config: { tag: "new_user" } },
      { type: "ENROLL_SEQUENCE", config: { sequenceId: "seq-onboarding" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wf-purchase-followup",
    name: "Suivi apres achat de formation",
    triggerType: "PURCHASE",
    isActive: true,
    conditions: [
      { field: "metadata.orderType", operator: "eq", value: "formation" },
    ],
    actions: [
      { type: "SEND_EMAIL", config: { template: "purchase_confirmation", subject: "Votre formation est prete !" } },
      { type: "ADD_TAG", config: { tag: "buyer" } },
      { type: "ENROLL_SEQUENCE", config: { sequenceId: "seq-post-purchase" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wf-cart-abandoned",
    name: "Relance panier abandonne",
    triggerType: "CART_ABANDONED",
    isActive: true,
    actions: [
      { type: "DELAY", config: { delayMinutes: 60 } },
      { type: "SEND_EMAIL", config: { template: "cart_abandoned", subject: "Vous avez oublie quelque chose !" } },
      { type: "DELAY", config: { delayMinutes: 1440 } },
      { type: "CREATE_DISCOUNT", config: { discountPct: 10, validityHours: 48, reason: "cart_recovery" } },
      { type: "SEND_EMAIL", config: { template: "cart_abandoned_discount", subject: "-10% pour finaliser votre achat" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wf-course-completed",
    name: "Upsell apres fin de formation",
    triggerType: "COURSE_COMPLETED",
    isActive: true,
    actions: [
      { type: "SEND_EMAIL", config: { template: "course_completed", subject: "Felicitations ! Vous avez termine votre formation" } },
      { type: "ADD_TAG", config: { tag: "course_completer" } },
      { type: "TRIGGER_UPSELL", config: { strategy: "related_courses" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wf-affiliate-sale",
    name: "Notification vente affilie",
    triggerType: "AFFILIATE_SALE",
    isActive: true,
    actions: [
      { type: "SEND_NOTIFICATION", config: { title: "Nouvelle vente affiliee !", message: "Vous avez gagne une commission." } },
      { type: "SEND_EMAIL", config: { template: "affiliate_sale", subject: "Nouvelle commission gagnee !" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ── Workflow Store ────────────────────────────────────────────────────────────

function devGetWorkflows(): WorkflowDefinition[] {
  const existing = readJson<WorkflowDefinition[]>(WORKFLOWS_FILE, []);
  if (existing.length === 0) {
    writeJson(WORKFLOWS_FILE, SEED_WORKFLOWS);
    return SEED_WORKFLOWS;
  }
  return existing;
}

function devSaveWorkflow(workflow: WorkflowDefinition): void {
  const workflows = devGetWorkflows();
  const idx = workflows.findIndex((w) => w.id === workflow.id);
  if (idx >= 0) {
    workflows[idx] = workflow;
  } else {
    workflows.push(workflow);
  }
  writeJson(WORKFLOWS_FILE, workflows);
}

function devLogExecution(log: ExecutionLog): void {
  const logs = readJson<ExecutionLog[]>(EXECUTION_LOG_FILE, []);
  logs.push(log);
  // Keep only last 500 entries
  const trimmed = logs.slice(-500);
  writeJson(EXECUTION_LOG_FILE, trimmed);
}

function devGetExecutionLogs(workflowId?: string): ExecutionLog[] {
  const logs = readJson<ExecutionLog[]>(EXECUTION_LOG_FILE, []);
  if (workflowId) {
    return logs.filter((l) => l.workflowId === workflowId);
  }
  return logs;
}

// ── Condition Evaluation ─────────────────────────────────────────────────────

function resolveField(field: string, context: ExecutionContext): unknown {
  const parts = field.split(".");
  let current: unknown = context;

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

export function checkConditions(
  conditions: WorkflowCondition[] | undefined,
  context: ExecutionContext
): boolean {
  if (!conditions || conditions.length === 0) return true;

  let result = true;

  for (let i = 0; i < conditions.length; i++) {
    const cond = conditions[i];
    const fieldValue = resolveField(cond.field, context);
    let conditionMet = false;

    switch (cond.operator) {
      case "eq":
        conditionMet = fieldValue === cond.value;
        break;
      case "neq":
        conditionMet = fieldValue !== cond.value;
        break;
      case "gt":
        conditionMet = typeof fieldValue === "number" && typeof cond.value === "number" && fieldValue > cond.value;
        break;
      case "gte":
        conditionMet = typeof fieldValue === "number" && typeof cond.value === "number" && fieldValue >= cond.value;
        break;
      case "lt":
        conditionMet = typeof fieldValue === "number" && typeof cond.value === "number" && fieldValue < cond.value;
        break;
      case "lte":
        conditionMet = typeof fieldValue === "number" && typeof cond.value === "number" && fieldValue <= cond.value;
        break;
      case "contains":
        conditionMet = typeof fieldValue === "string" && typeof cond.value === "string" && fieldValue.includes(cond.value);
        break;
      case "not_contains":
        conditionMet = typeof fieldValue === "string" && typeof cond.value === "string" && !fieldValue.includes(cond.value);
        break;
      case "in":
        conditionMet = Array.isArray(cond.value) && cond.value.includes(fieldValue);
        break;
      case "not_in":
        conditionMet = Array.isArray(cond.value) && !cond.value.includes(fieldValue);
        break;
      case "exists":
        conditionMet = fieldValue !== undefined && fieldValue !== null;
        break;
      default:
        conditionMet = false;
    }

    // Apply logic: default is AND
    const logic = cond.logic || "AND";
    if (i === 0) {
      result = conditionMet;
    } else if (logic === "AND") {
      result = result && conditionMet;
    } else {
      result = result || conditionMet;
    }
  }

  return result;
}

// ── Action Execution ─────────────────────────────────────────────────────────

export async function executeAction(
  action: WorkflowAction,
  context: ExecutionContext
): Promise<void> {
  const { type, config } = action;

  switch (type) {
    case "SEND_EMAIL": {
      const template = config.template as string;
      const subject = config.subject as string;
      console.log(
        `[Marketing] SEND_EMAIL: template=${template}, subject="${subject}", userId=${context.userId}`
      );
      // In production, call the email service:
      // await sendMarketingEmail(context.userId, template, subject, context.metadata);
      // For now, log the intent
      context.results[`email_${template}`] = { sent: true, timestamp: new Date().toISOString() };
      break;
    }

    case "ADD_TAG": {
      const tag = config.tag as string;
      console.log(`[Marketing] ADD_TAG: tag="${tag}", userId=${context.userId}`);
      if (IS_DEV) {
        // Dev mode: store tag in a local structure
        const tagsFile = path.join(DATA_DIR, "marketing-user-tags.json");
        const tags = readJson<Record<string, string[]>>(tagsFile, {});
        if (!tags[context.userId]) tags[context.userId] = [];
        if (!tags[context.userId].includes(tag)) {
          tags[context.userId].push(tag);
        }
        writeJson(tagsFile, tags);
      } else {
        // Production: create UserTag via Prisma
        const prismaModule = await import("@freelancehigh/db");
        const prisma = prismaModule.prisma;
        await prisma.userTag.upsert({
          where: { userId_tag: { userId: context.userId, tag } },
          update: {},
          create: { userId: context.userId, tag, source: "automation" },
        });
      }
      context.results[`tag_add_${tag}`] = true;
      break;
    }

    case "REMOVE_TAG": {
      const tag = config.tag as string;
      console.log(`[Marketing] REMOVE_TAG: tag="${tag}", userId=${context.userId}`);
      if (IS_DEV) {
        const tagsFile = path.join(DATA_DIR, "marketing-user-tags.json");
        const tags = readJson<Record<string, string[]>>(tagsFile, {});
        if (tags[context.userId]) {
          tags[context.userId] = tags[context.userId].filter((t) => t !== tag);
        }
        writeJson(tagsFile, tags);
      } else {
        const prismaModule = await import("@freelancehigh/db");
        const prisma = prismaModule.prisma;
        await prisma.userTag.deleteMany({
          where: { userId: context.userId, tag },
        });
      }
      context.results[`tag_remove_${tag}`] = true;
      break;
    }

    case "ENROLL_SEQUENCE": {
      const sequenceId = config.sequenceId as string;
      console.log(
        `[Marketing] ENROLL_SEQUENCE: sequenceId=${sequenceId}, userId=${context.userId}`
      );
      // Delegate to email-sequence-processor
      try {
        const { enrollUserInSequence } = await import("./email-sequence-processor");
        await enrollUserInSequence(sequenceId, context.userId, context.metadata);
        context.results[`enroll_${sequenceId}`] = true;
      } catch (err) {
        console.error(`[Marketing] Failed to enroll in sequence ${sequenceId}:`, err);
        context.results[`enroll_${sequenceId}`] = false;
      }
      break;
    }

    case "CANCEL_SEQUENCE": {
      const sequenceId = config.sequenceId as string;
      console.log(
        `[Marketing] CANCEL_SEQUENCE: sequenceId=${sequenceId}, userId=${context.userId}`
      );
      try {
        const { cancelEnrollment } = await import("./email-sequence-processor");
        await cancelEnrollment(sequenceId, context.userId);
        context.results[`cancel_${sequenceId}`] = true;
      } catch (err) {
        console.error(`[Marketing] Failed to cancel sequence ${sequenceId}:`, err);
        context.results[`cancel_${sequenceId}`] = false;
      }
      break;
    }

    case "GRANT_ACCESS": {
      const resourceId = config.resourceId as string;
      const resourceType = (config.resourceType as string) || "formation";
      console.log(
        `[Marketing] GRANT_ACCESS: resource=${resourceType}/${resourceId}, userId=${context.userId}`
      );
      // In production: create enrollment or access record
      context.results[`grant_${resourceId}`] = true;
      break;
    }

    case "REVOKE_ACCESS": {
      const resourceId = config.resourceId as string;
      console.log(
        `[Marketing] REVOKE_ACCESS: resourceId=${resourceId}, userId=${context.userId}`
      );
      context.results[`revoke_${resourceId}`] = true;
      break;
    }

    case "SEND_NOTIFICATION": {
      const title = config.title as string;
      const message = config.message as string;
      console.log(
        `[Marketing] SEND_NOTIFICATION: title="${title}", userId=${context.userId}`
      );
      if (IS_DEV) {
        const notifFile = path.join(DATA_DIR, "notifications.json");
        const notifs = readJson<Array<Record<string, unknown>>>(notifFile, []);
        notifs.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: context.userId,
          title,
          message,
          type: "system",
          read: false,
          createdAt: new Date().toISOString(),
        });
        writeJson(notifFile, notifs);
      }
      context.results.notification = { sent: true };
      break;
    }

    case "WEBHOOK": {
      const url = config.url as string;
      const method = (config.method as string) || "POST";
      const headers = (config.headers as Record<string, string>) || {};
      console.log(`[Marketing] WEBHOOK: ${method} ${url}, userId=${context.userId}`);
      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            event: context.event.type,
            userId: context.userId,
            metadata: context.metadata,
            timestamp: context.event.timestamp.toISOString(),
          }),
        });
        context.results.webhook = { status: response.status, ok: response.ok };
      } catch (err) {
        console.error(`[Marketing] Webhook to ${url} failed:`, err);
        context.results.webhook = { status: 0, ok: false, error: String(err) };
      }
      break;
    }

    case "DELAY": {
      const delayMinutes = (config.delayMinutes as number) || 0;
      console.log(
        `[Marketing] DELAY: ${delayMinutes} minutes for userId=${context.userId}`
      );
      // In production, this would schedule a BullMQ delayed job.
      // In dev, we log the intent. Actual delays require a job queue.
      context.results.delay = {
        delayMinutes,
        scheduledFor: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(),
      };
      break;
    }

    case "CONDITION_CHECK": {
      const condField = config.field as string;
      const condOp = config.operator as string;
      const condValue = config.value;
      console.log(
        `[Marketing] CONDITION_CHECK: ${condField} ${condOp} ${condValue}`
      );
      // Evaluate inline condition — if false, skip remaining actions
      const fieldValue = resolveField(condField, context);
      let passes = false;
      switch (condOp) {
        case "eq": passes = fieldValue === condValue; break;
        case "neq": passes = fieldValue !== condValue; break;
        case "gt": passes = Number(fieldValue) > Number(condValue); break;
        case "gte": passes = Number(fieldValue) >= Number(condValue); break;
        default: passes = true;
      }
      context.results.conditionCheck = { field: condField, passes };
      if (!passes) {
        throw new ConditionNotMetError(`Condition not met: ${condField} ${condOp} ${String(condValue)}`);
      }
      break;
    }

    case "CREATE_DISCOUNT": {
      const discountPct = (config.discountPct as number) || 10;
      const validityHours = (config.validityHours as number) || 48;
      const reason = (config.reason as string) || "automation";
      console.log(
        `[Marketing] CREATE_DISCOUNT: ${discountPct}% for ${validityHours}h, userId=${context.userId}`
      );
      // Generate a unique discount code
      const code = `AUTO-${context.userId.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      context.results.discount = { code, discountPct, validityHours, reason };
      break;
    }

    case "TRIGGER_UPSELL": {
      const strategy = (config.strategy as string) || "related";
      console.log(
        `[Marketing] TRIGGER_UPSELL: strategy=${strategy}, userId=${context.userId}`
      );
      context.results.upsell = { strategy, triggered: true };
      break;
    }

    default:
      console.warn(`[Marketing] Unknown action type: ${type}`);
  }
}

// Custom error for condition checks that should halt the action chain gracefully
class ConditionNotMetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConditionNotMetError";
  }
}

// ── Get Active Workflows ─────────────────────────────────────────────────────

export async function getActiveWorkflows(
  triggerType: TriggerType
): Promise<WorkflowDefinition[]> {
  if (IS_DEV) {
    const workflows = devGetWorkflows();
    return workflows.filter((w) => w.isActive && w.triggerType === triggerType);
  }

  // Production: query Prisma
  // Note: MarketingWorkflow model would need to exist in schema.
  // For now, return from JSON as fallback.
  try {
    const workflows = devGetWorkflows();
    return workflows.filter((w) => w.isActive && w.triggerType === triggerType);
  } catch {
    return [];
  }
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

export async function emitEvent(event: TriggerEvent): Promise<void> {
  const startTime = Date.now();

  console.log(
    `[Marketing] Event received: type=${event.type}, userId=${event.userId}, timestamp=${event.timestamp.toISOString()}`
  );

  // Propagate to the event bus for real-time listeners
  try {
    await eventBus.emit(event);
  } catch (err) {
    console.error("[Marketing] Event bus propagation error:", err);
  }

  // Find matching workflows
  const workflows = await getActiveWorkflows(event.type);

  if (workflows.length === 0) {
    console.log(`[Marketing] No active workflows for trigger: ${event.type}`);
    return;
  }

  console.log(
    `[Marketing] Found ${workflows.length} workflow(s) for trigger: ${event.type}`
  );

  // Execute each matching workflow
  for (const workflow of workflows) {
    const context: ExecutionContext = {
      event,
      workflow,
      userId: event.userId,
      metadata: { ...event.metadata },
      results: {},
    };

    let actionsExecuted = 0;
    let actionsFailed = 0;
    let executionError: string | undefined;

    try {
      // Check conditions
      if (!checkConditions(workflow.conditions, context)) {
        console.log(
          `[Marketing] Conditions not met for workflow "${workflow.name}" (${workflow.id})`
        );
        devLogExecution({
          id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          workflowId: workflow.id,
          userId: event.userId,
          triggerType: event.type,
          status: "success",
          actionsExecuted: 0,
          actionsFailed: 0,
          duration: Date.now() - startTime,
          executedAt: new Date().toISOString(),
        });
        continue;
      }

      // Execute actions in order
      for (const action of workflow.actions) {
        try {
          await executeAction(action, context);
          actionsExecuted++;
        } catch (err) {
          if (err instanceof ConditionNotMetError) {
            console.log(
              `[Marketing] Condition check halted workflow "${workflow.name}": ${err.message}`
            );
            break;
          }
          actionsFailed++;
          console.error(
            `[Marketing] Action ${action.type} failed in workflow "${workflow.name}":`,
            err
          );
          executionError = String(err);
        }
      }
    } catch (err) {
      executionError = String(err);
      console.error(
        `[Marketing] Workflow "${workflow.name}" failed:`,
        err
      );
    }

    // Log execution
    const status: ExecutionLog["status"] =
      actionsFailed === 0 ? "success" : actionsExecuted > 0 ? "partial" : "failed";

    devLogExecution({
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workflowId: workflow.id,
      userId: event.userId,
      triggerType: event.type,
      status,
      actionsExecuted,
      actionsFailed,
      error: executionError,
      duration: Date.now() - startTime,
      executedAt: new Date().toISOString(),
    });

    console.log(
      `[Marketing] Workflow "${workflow.name}" completed: ${actionsExecuted} actions executed, ${actionsFailed} failed`
    );
  }
}

// ── Workflow Management ──────────────────────────────────────────────────────

export function getAllWorkflows(): WorkflowDefinition[] {
  return devGetWorkflows();
}

export function getWorkflowById(id: string): WorkflowDefinition | null {
  const workflows = devGetWorkflows();
  return workflows.find((w) => w.id === id) ?? null;
}

export function createWorkflow(
  data: Omit<WorkflowDefinition, "id" | "createdAt" | "updatedAt">
): WorkflowDefinition {
  const workflow: WorkflowDefinition = {
    ...data,
    id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  devSaveWorkflow(workflow);
  return workflow;
}

export function updateWorkflow(
  id: string,
  updates: Partial<Omit<WorkflowDefinition, "id" | "createdAt">>
): WorkflowDefinition | null {
  const workflow = getWorkflowById(id);
  if (!workflow) return null;

  const updated: WorkflowDefinition = {
    ...workflow,
    ...updates,
    id: workflow.id,
    createdAt: workflow.createdAt,
    updatedAt: new Date().toISOString(),
  };
  devSaveWorkflow(updated);
  return updated;
}

export function deleteWorkflow(id: string): boolean {
  const workflows = devGetWorkflows();
  const filtered = workflows.filter((w) => w.id !== id);
  if (filtered.length === workflows.length) return false;
  writeJson(WORKFLOWS_FILE, filtered);
  return true;
}

export function getExecutionLogs(workflowId?: string): ExecutionLog[] {
  return devGetExecutionLogs(workflowId);
}

// ── User Tags Helpers ────────────────────────────────────────────────────────

export function getUserTags(userId: string): string[] {
  if (IS_DEV) {
    const tagsFile = path.join(DATA_DIR, "marketing-user-tags.json");
    const tags = readJson<Record<string, string[]>>(tagsFile, {});
    return tags[userId] || [];
  }
  return [];
}

export function setUserTags(userId: string, tags: string[]): void {
  if (IS_DEV) {
    const tagsFile = path.join(DATA_DIR, "marketing-user-tags.json");
    const allTags = readJson<Record<string, string[]>>(tagsFile, {});
    allTags[userId] = tags;
    writeJson(tagsFile, allTags);
  }
}
