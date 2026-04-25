import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("q") ?? "";

    const formations = await prisma.formation.findMany({
      where: {
        status: "ACTIF",
        ...(search ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { customCategory: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        customCategory: true,
        level: true,
        price: true,
        rating: true,
        studentsCount: true,
      },
      orderBy: { studentsCount: "desc" },
      take: 50,
    });

    return NextResponse.json({ data: formations });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
