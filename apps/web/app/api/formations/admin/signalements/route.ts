import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const [reports, refundRequests] = await Promise.all([
      prisma.discussionReport.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, reason: true, createdAt: true,
          user: { select: { name: true, email: true } },
          discussion: {
            select: {
              id: true, title: true, content: true, reportCount: true, status: true,
              formation: { select: { title: true } },
              user: { select: { name: true } },
            },
          },
          reply: {
            select: { id: true, content: true, reportCount: true, user: { select: { name: true } } },
          },
        },
      }),
      prisma.refundRequest.findMany({
        where: { status: "PENDING" },
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, amount: true, reason: true, createdAt: true, status: true,
          user: { select: { name: true, email: true } },
          enrollment: {
            select: {
              id: true, paidAmount: true,
              formation: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    const summary = {
      totalReports: reports.length,
      totalRefunds: refundRequests.length,
      pendingRefundAmount: refundRequests.reduce((s, r) => s + r.amount, 0),
    };

    return NextResponse.json({
      data: { reports, refundRequests },
      summary,
    });
  } catch (err) {
    console.error("[admin/signalements]", err);
    return NextResponse.json({ data: { reports: [], refundRequests: [] }, summary: null });
  }
}
