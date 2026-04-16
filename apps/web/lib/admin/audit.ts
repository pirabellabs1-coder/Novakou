// FreelanceHigh — Admin Audit Log Helper
// Creates audit log entries for admin actions

import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

interface AuditLogParams {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  if (IS_DEV) {
    console.log(`[AUDIT] ${params.action}`, {
      actor: params.actorId,
      target: params.targetUserId || params.targetId,
      details: params.details,
    });
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetUserId: params.targetUserId,
        details: params.details ? (params.details as object) : undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    // Don't throw — audit log failures should never block admin actions
    console.error("[AuditLog] Failed to create entry:", error);
  }
}
