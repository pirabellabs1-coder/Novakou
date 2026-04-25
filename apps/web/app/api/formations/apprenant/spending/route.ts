import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const [enrollments, purchases] = await Promise.allSettled([
      prisma.enrollment.findMany({
        where: { userId },
        select: { paidAmount: true, createdAt: true },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { userId },
        select: { paidAmount: true, createdAt: true },
      }),
    ]);

    type TxItem = { paidAmount: number; createdAt: Date; type: string };
    const allTxs: TxItem[] = [
      ...(enrollments.status === "fulfilled"
        ? enrollments.value.map((e) => ({ paidAmount: e.paidAmount, createdAt: e.createdAt, type: "formation" }))
        : []),
      ...(purchases.status === "fulfilled"
        ? purchases.value.map((p) => ({ paidAmount: p.paidAmount, createdAt: p.createdAt, type: "product" }))
        : []),
    ];

    const totalXof = allTxs.reduce((s, t) => s + t.paidAmount, 0);

    // Monthly breakdown — last 6 months
    const monthly: { month: string; totalXof: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString("fr-FR", { month: "short" });
      const monthTxs = allTxs.filter((t) => {
        const td = new Date(t.createdAt);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      monthly.push({ month: monthLabel, totalXof: monthTxs.reduce((s, t) => s + t.paidAmount, 0) });
    }

    const byType = {
      formation: allTxs.filter((t) => t.type === "formation").reduce((s, t) => s + t.paidAmount, 0),
      product:   allTxs.filter((t) => t.type === "product").reduce((s, t) => s + t.paidAmount, 0),
      mentor:    0, // MentorSession not available in current schema
    };

    return NextResponse.json({
      totalXof: Math.round(totalXof),
      totalEur: Math.round(totalXof / 655.957),
      totalPurchases: allTxs.length,
      monthly,
      byType,
    });
  } catch {
    return NextResponse.json({
      totalXof: 0,
      totalEur: 0,
      totalPurchases: 0,
      monthly: [],
      byType: { formation: 0, product: 0, mentor: 0 },
    });
  }
}
