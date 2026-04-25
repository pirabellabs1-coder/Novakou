import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Accept either user.id or instructeur.id or user name-slug (fallback)
    let profile = await prisma.instructeurProfile.findFirst({
      where: { OR: [{ userId: id }, { id: id }] },
      select: {
        id: true,
        userId: true,
        bioFr: true,
        expertise: true,
        linkedin: true,
        website: true,
        youtube: true,
        yearsExp: true,
        totalEarned: true,
        status: true,
        user: {
          select: { id: true, name: true, email: true, image: true, country: true, createdAt: true },
        },
        formations: {
          where: { status: "ACTIF" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, slug: true, title: true, shortDesc: true, thumbnail: true,
            price: true, originalPrice: true, rating: true, reviewsCount: true,
            studentsCount: true, customCategory: true,
          },
        },
        digitalProducts: {
          where: { status: "ACTIF" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, slug: true, title: true, description: true, banner: true,
            productType: true, price: true, originalPrice: true, rating: true,
            reviewsCount: true, salesCount: true,
          },
        },
      },
    });

    if (!profile) {
      // Try by slugified user name
      const users = await prisma.user.findMany({
        where: { instructeurProfile: { isNot: null } },
        select: { id: true, name: true },
      });
      const targetSlug = id.toLowerCase();
      const matched = users.find(
        (u) => u.name.toLowerCase().replace(/\s+/g, "-") === targetSlug
      );
      if (matched) {
        profile = await prisma.instructeurProfile.findUnique({
          where: { userId: matched.id },
          select: {
            id: true, userId: true, bioFr: true, expertise: true, linkedin: true,
            website: true, youtube: true, yearsExp: true, totalEarned: true, status: true,
            user: { select: { id: true, name: true, email: true, image: true, country: true, createdAt: true } },
            formations: {
              where: { status: "ACTIF" },
              orderBy: { createdAt: "desc" },
              select: {
                id: true, slug: true, title: true, shortDesc: true, thumbnail: true,
                price: true, originalPrice: true, rating: true, reviewsCount: true,
                studentsCount: true, customCategory: true,
              },
            },
            digitalProducts: {
              where: { status: "ACTIF" },
              orderBy: { createdAt: "desc" },
              select: {
                id: true, slug: true, title: true, description: true, banner: true,
                productType: true, price: true, originalPrice: true, rating: true,
                reviewsCount: true, salesCount: true,
              },
            },
          },
        });
      }
    }

    if (!profile) {
      return NextResponse.json({ error: "Instructeur introuvable" }, { status: 404 });
    }

    // Stats
    const totalStudents = profile.formations.reduce((s, f) => s + f.studentsCount, 0);
    const totalProducts = profile.formations.length + profile.digitalProducts.length;
    const ratings = [
      ...profile.formations.filter((f) => f.reviewsCount > 0).map((f) => ({ r: f.rating, c: f.reviewsCount })),
      ...profile.digitalProducts.filter((p) => p.reviewsCount > 0).map((p) => ({ r: p.rating, c: p.reviewsCount })),
    ];
    const totalReviews = ratings.reduce((s, r) => s + r.c, 0);
    const avgRating = totalReviews > 0
      ? ratings.reduce((s, r) => s + r.r * r.c, 0) / totalReviews
      : 0;

    // Recent reviews
    const reviews = await prisma.formationReview.findMany({
      where: { formation: { instructeurId: profile.id } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, rating: true, comment: true, createdAt: true,
        user: { select: { name: true, image: true } },
        formation: { select: { title: true } },
      },
    });

    return NextResponse.json({
      data: {
        profile: {
          id: profile.id,
          userId: profile.userId,
          name: profile.user.name,
          image: profile.user.image,
          country: profile.user.country,
          bio: profile.bioFr,
          expertise: profile.expertise,
          linkedin: profile.linkedin,
          website: profile.website,
          youtube: profile.youtube,
          yearsExp: profile.yearsExp,
          joinedAt: profile.user.createdAt,
          status: profile.status,
        },
        formations: profile.formations,
        products: profile.digitalProducts,
        stats: {
          totalStudents,
          totalProducts,
          avgRating,
          totalReviews,
        },
        reviews,
      },
    });
  } catch (err) {
    console.error("[public/instructeur]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
