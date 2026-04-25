import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        formation: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            customCategory: true,
            level: true,
            duration: true,
            rating: true,
            reviewsCount: true,
            instructeurId: true,
            reviews: {
              where: { userId },
              select: { id: true, rating: true, comment: true },
            },
          },
        },
        certificate: { select: { id: true, code: true, issuedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: enrollments });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
