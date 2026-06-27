import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { shortPayGeniusMethodLabel } from "@/lib/paygenius-payout-methods";

function isAdmin(session: { user?: { role?: string | null } } | null): boolean {
  const role = session?.user?.role?.toString().toUpperCase();
  return role === "ADMIN" || IS_DEV;
}

/** GET /api/formations/admin/affiliate-withdrawals?status=EN_ATTENTE|TRAITE|REFUSE|all */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = status && status !== "all" ? { status } : {};

  const [items, counts] = await Promise.all([
    prisma.affiliateWithdrawal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        affiliate: {
          select: {
            affiliateCode: true,
            user: { select: { name: true, email: true, country: true } },
          },
        },
      },
    }),
    prisma.affiliateWithdrawal.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  return NextResponse.json({
    data: {
      items: items.map((w) => ({
        id: w.id,
        amount: w.amount,
        method: w.method,
        methodLabel: shortPayGeniusMethodLabel(w.method) || w.method,
        accountDetails: w.accountDetails,
        status: w.status,
        refusedReason: w.refusedReason,
        paymentRef: w.paymentRef,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        affiliateCode: w.affiliate?.affiliateCode ?? null,
        name: w.affiliate?.user?.name ?? null,
        email: w.affiliate?.user?.email ?? null,
        country: w.affiliate?.user?.country ?? null,
      })),
      statusCounts,
    },
  });
}
