// FreelanceHigh — Audit log utility for formations admin actions
import prisma from "@freelancehigh/db";

interface AuditActionParams {
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Enregistre une action administrative dans le journal d'audit.
 * Appelée après chaque action de modification admin (approbation, rejet, etc.)
 */
export async function logAuditAction({
  userId,
  action,
  targetType,
  targetId,
  targetUserId,
  metadata,
  ipAddress,
}: AuditActionParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        targetUserId: targetUserId ?? null,
        details: metadata ?? null,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (error) {
    // Ne pas bloquer l'action principale si le log échoue
    console.error("[AuditLog] Failed to log action:", action, error);
  }
}

/**
 * Extrait l'adresse IP d'une requête Next.js
 */
export function getRequestIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return undefined;
}
