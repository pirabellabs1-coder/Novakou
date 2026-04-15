import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const typeFilter = searchParams.get("type"); // "formation" | "product"

    const [enrollments, purchases] = await Promise.allSettled([
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          formation: {
            select: {
              id: true, title: true, thumbnail: true, customCategory: true,
              instructeur: { select: { user: { select: { id: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true, title: true, productType: true, banner: true,
              instructeur: { select: { user: { select: { id: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const enrollmentList = enrollments.status === "fulfilled" ? enrollments.value : [];
    const purchaseList   = purchases.status   === "fulfilled" ? purchases.value   : [];

    // Merge into unified timeline
    const orders = [
      ...enrollmentList.map((e) => ({
        id: e.id,
        type: "formation" as const,
        title: e.formation?.title ?? "Formation",
        thumbnail: e.formation?.thumbnail ?? null,
        category: e.formation?.customCategory ?? null,
        amount: e.paidAmount,
        currency: "XOF",
        status: e.completedAt ? "COMPLETED" : "ACTIVE",
        createdAt: e.createdAt.toISOString(),
        progress: e.progress,
        instructeurUserId: (e.formation as { instructeur?: { user?: { id?: string } } })?.instructeur?.user?.id ?? null,
      })),
      ...purchaseList.map((p) => ({
        id: p.id,
        type: "product" as const,
        title: p.product?.title ?? "Produit",
        thumbnail: p.product?.banner ?? null,
        category: p.product?.productType ?? null,
        amount: p.paidAmount,
        currency: "XOF",
        status: "COMPLETED" as const,
        createdAt: p.createdAt.toISOString(),
        progress: 100,
        instructeurUserId: (p.product as { instructeur?: { user?: { id?: string } } })?.instructeur?.user?.id ?? null,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filtered = typeFilter ? orders.filter((o) => o.type === typeFilter) : orders;

    return NextResponse.json({ data: filtered });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
