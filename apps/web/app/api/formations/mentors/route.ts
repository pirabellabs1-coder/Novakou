import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/mentors
 * Returns all public mentor profiles for the listing page.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");
    const search = searchParams.get("search");

    const mentors = await prisma.mentorProfile.findMany({
      where: {
        AND: [
          // Only show mentors who have at least completed their profile
          { specialty: { not: "" } },
          domain && domain !== "Tous" ? { domain } : {},
          search
            ? {
                OR: [
                  { specialty: { contains: search, mode: "insensitive" } },
                  { bio: { contains: search, mode: "insensitive" } },
                  { user: { name: { contains: search, mode: "insensitive" } } },
                ],
              }
            : {},
        ],
      },
      orderBy: [
        { isAvailable: "desc" },
        { rating: "desc" },
        { totalSessions: "desc" },
      ],
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    const data = mentors.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      image: m.user.image,
      specialty: m.specialty,
      domain: m.domain,
      bio: m.bio,
      coverImage: m.coverImage,
      sessionPrice: m.sessionPrice,
      sessionDuration: m.sessionDuration,
      languages: m.languages,
      badges: m.badges,
      available: m.isAvailable,
      isVerified: m.isVerified,
      rating: m.rating,
      reviews: m.reviewsCount,
      students: m.totalStudents,
      totalSessions: m.totalSessions,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[mentors GET]", err);
    return NextResponse.json({ data: [] });
  }
}
