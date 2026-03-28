import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { serviceStore, reviewStore } from "@/lib/dev/data-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10), 20);

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const allServices = serviceStore.getAll().filter((s) => s.status === "actif" || s.status === "vedette");
      const allReviews = reviewStore.getAll();

      const scored = allServices.map((s) => {
        const serviceReviews = allReviews.filter((r) => r.serviceId === s.id);
        const reviewCount = serviceReviews.length || s.ratingCount || 0;
        return {
          service: s,
          reviewCount,
          score:
            (s.status === "vedette" ? 0.2 : 0) +
            (s.rating / 5) * 0.35 +
            Math.min(s.orderCount / 100, 1) * 0.25 +
            Math.min(reviewCount / 50, 1) * 0.2 +
            Math.min(s.views / 500, 1) * 0.1 +
            (s.isBoosted ? 0.1 : 0),
        };
      });

      scored.sort((a, b) => b.score - a.score);

      const top = scored.slice(0, limit).map(({ service: s, reviewCount }) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.categoryName,
        priceEur: s.basePrice,
        rating: s.rating,
        reviews: reviewCount,
        orderCount: s.orderCount,
        image: s.images?.[0] ?? s.mainImage ?? "",
        freelancer: s.vendorName,
        freelancerAvatar: s.vendorAvatar ?? "",
        vendorBadges: s.vendorBadges ?? [],
      }));

      return NextResponse.json({ services: top });
    }

    const services = await prisma.service.findMany({
      where: { status: { in: ["ACTIF", "VEDETTE"] } },
      orderBy: [{ isBoosted: "desc" }, { rating: "desc" }, { orderCount: "desc" }],
      take: limit * 2, // Fetch extra to score and pick top
      include: {
        category: { select: { name: true } },
        user: { select: { id: true, name: true, avatar: true, image: true, plan: true, kyc: true } },
        agency: { select: { id: true, agencyName: true, logo: true } },
        _count: { select: { reviews: true } },
      },
    });

    // Score: weighted combination of rating, order count, review count, views, boost, vedette
    const scored = services.map((s) => ({
      service: s,
      score:
        (s.status === "VEDETTE" ? 0.2 : 0) +
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
        reviews: s._count.reviews || (s.ratingCount ?? 0),
        orderCount: s.orderCount,
        image: (s.images as string[])?.[0] ?? "",
        freelancer: s.agency?.agencyName || (s.user?.name ?? ""),
        freelancerAvatar: s.agency?.logo || s.user?.avatar || (s.user?.image ?? ""),
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
