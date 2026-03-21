import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma as _prisma, IS_DEV } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

// GET /api/admin/notifications/history — Get notification send history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV) {
      // In dev mode, try to read from AdminNotificationLog, fallback to empty
      try {
        const logs = await prisma.adminNotificationLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        return NextResponse.json({ history: logs });
      } catch {
        return NextResponse.json({ history: [] });
      }
    }

    // Production: read from AdminNotificationLog
    try {
      const logs = await prisma.adminNotificationLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        history: logs.map((l: { id: string; adminId: string; title: string; message: string; recipientCount: number; failedCount: number; channels: string[]; targetCriteria: unknown; createdAt: Date }) => ({
          id: l.id,
          adminId: l.adminId,
          title: l.title,
          message: l.message,
          recipientCount: l.recipientCount,
          failedCount: l.failedCount,
          channels: l.channels,
          targetCriteria: l.targetCriteria,
          status: l.failedCount > 0 ? "partial" : "sent",
          createdAt: l.createdAt,
        })),
      });
    } catch {
      // Table might not be migrated yet
      return NextResponse.json({ history: [] });
    }
  } catch (error) {
    console.error("[API /admin/notifications/history GET]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
