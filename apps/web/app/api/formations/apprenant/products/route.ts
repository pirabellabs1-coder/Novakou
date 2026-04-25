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

    const purchases = await prisma.digitalProductPurchase.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            productType: true,
            banner: true,
            fileSize: true,
            fileUrl: true,
            instructeurId: true,
            reviews: {
              where: { userId },
              select: { id: true, rating: true, comment: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: purchases });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
