import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "all"; // all, instructeurs, apprenants
    const search = searchParams.get("search") ?? "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (filter === "instructeurs") where.instructeurProfile = { isNot: null };
    if (filter === "apprenants") where.instructeurProfile = { is: null };

    const users = await prisma.user.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        instructeurProfile: {
          select: {
            id: true,
            status: true,
            totalEarned: true,
            formations: { select: { id: true } },
            digitalProducts: { select: { id: true } },
          },
        },
        enrollments: { select: { id: true, paidAmount: true } },
        productPurchases: { select: { id: true, paidAmount: true } },
      },
    });

    const enriched = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      isInstructor: u.instructeurProfile !== null,
      instructorStatus: u.instructeurProfile?.status ?? null,
      productsCount: (u.instructeurProfile?.formations.length ?? 0) + (u.instructeurProfile?.digitalProducts.length ?? 0),
      totalEarned: u.instructeurProfile?.totalEarned ?? 0,
      enrollmentsCount: u.enrollments.length,
      purchasesCount: u.productPurchases.length,
      totalSpent:
        u.enrollments.reduce((s, e) => s + e.paidAmount, 0) +
        u.productPurchases.reduce((s, p) => s + p.paidAmount, 0),
    }));

    // Summary
    const [totalUsers, totalInstructors, totalLearners] = await Promise.all([
      prisma.user.count(),
      prisma.instructeurProfile.count(),
      prisma.user.count({ where: { instructeurProfile: { is: null } } }),
    ]);

    return NextResponse.json({
      data: enriched,
      summary: { totalUsers, totalInstructors, totalLearners },
    });
  } catch (err) {
    console.error("[admin/utilisateurs]", err);
    return NextResponse.json({ data: [], summary: { totalUsers: 0, totalInstructors: 0, totalLearners: 0 } });
  }
}
