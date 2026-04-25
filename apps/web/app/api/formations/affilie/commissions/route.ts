import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

type ValidStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
const VALID_STATUSES: ValidStatus[] = ["PENDING", "APPROVED", "PAID", "CANCELLED"];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status");

    const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ data: [], summary: null });

    const statusWhere = statusFilter && VALID_STATUSES.includes(statusFilter as ValidStatus)
      ? { status: statusFilter as ValidStatus }
      : {};

    const commissions = await prisma.affiliateCommission.findMany({
      where: { affiliateId: profile.id, ...statusWhere },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total:     commissions.reduce((s, c) => s + c.commissionAmount, 0),
      approved:  commissions.filter((c) => c.status === "APPROVED").reduce((s, c) => s + c.commissionAmount, 0),
      pending:   commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.commissionAmount, 0),
      paid:      commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.commissionAmount, 0),
      cancelled: commissions.filter((c) => c.status === "CANCELLED").reduce((s, c) => s + c.commissionAmount, 0),
      count:     commissions.length,
    };

    return NextResponse.json({ data: commissions, summary });
  } catch {
    return NextResponse.json({ data: [], summary: null });
  }
}
