import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/admin/ai-vendor-list?q=xxx
 *
 * Retourne une liste simple de vendeurs pour le selecteur du Vendor Coach.
 * Auth : ADMIN uniquement.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userRole = session?.user?.role?.toString().toLowerCase();
    if (userRole !== "admin" && !IS_DEV) {
      return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const vendors = await prisma.instructeurProfile.findMany({
      where: q
        ? {
            OR: [
              { user: { name: { contains: q, mode: "insensitive" } } },
              { user: { email: { contains: q, mode: "insensitive" } } },
              { shopSlug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      select: {
        id: true,
        totalEarned: true,
        status: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { totalEarned: "desc" },
      take: 40,
    });

    return NextResponse.json({
      data: vendors.map((v) => ({
        id: v.id,
        name: v.user?.name ?? "(sans nom)",
        email: v.user?.email ?? "",
        totalEarned: v.totalEarned,
        status: v.status,
      })),
    });
  } catch (err) {
    console.error("[admin/ai-vendor-list GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
