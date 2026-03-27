import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10), 20);

    const services = await prisma.service.findMany({
      where: { status: "ACTIF" },
      orderBy: [{ isBoosted: "desc" }, { rating: "desc" }, { orderCount: "desc" }],
      take: limit * 2, // Fetch extra to score and pick top
      include: {
        category: { select: { name: true } },
        user: { select: { id: true, name: true, avatar: true, image: true, plan: true, kyc: true } },
        agency: { select: { id: true, agencyName: true, logo: true } },
        _count: { select: { reviews: true } },
      },
    });

    // Score: weighted combination of rating, order count, review count, views, boost
    const scored = services.map((s) => ({
      service: s,
      score:
        (s.rating / 5) * 0.35 +
        Math.min(s.orderCount / 100, 1) * 0.25 +
        Math.min((s._count.reviews || s.ratingCount) / 50, 1) * 0.2 +
        Math.min(s.views / 500, 1) * 0.1 +
        (s.isBoosted ? 0.1 : 0),
    }));

    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, limit).map(({ service: s }) => {
      const badges: string[] = [];
      if (s.agency) badges.push("Agence");
      if (s.user?.kyc && s.user.kyc >= 3) badges.push("Verifie");
      if (s.user?.plan) {
        const plan = s.user.plan.toUpperCase();
        if (plan === "PRO") badges.push("Pro");
        else if (plan === "BUSINESS") badges.push("Business");
      }

      return {
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.category?.name ?? "",
        priceEur: s.basePrice,
        rating: s.rating,
        reviews: s._count.reviews || s.ratingCount,
        orderCount: s.orderCount,
        image: (s.images as string[])?.[0] ?? "",
        freelancer: s.agency?.agencyName || s.user?.name ?? "",
        freelancerAvatar: s.agency?.logo || s.user?.avatar || s.user?.image ?? "",
        vendorBadges: badges,
      };
    });

    return NextResponse.json({ services: top });
  } catch (error) {
    console.error("[API /public/top-services GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des top services" },
      { status: 500 }
    );
  }
}
