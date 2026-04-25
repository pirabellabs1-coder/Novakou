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

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        formation: {
          select: {
            id: true,
            title: true,
            customCategory: true,
            level: true,
            thumbnail: true,
            rating: true,
            instructeurId: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json({ data: certificates });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
