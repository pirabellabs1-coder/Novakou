import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase() || "";
    const category = searchParams.get("category") || "";
    const minPrice = Number(searchParams.get("minPrice")) || 0;
    const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;
    const sort = searchParams.get("sort") || "pertinence";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 12);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: { in: ["ACTIF", "VEDETTE"] } };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { descriptionText: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q] } },
      ];
    }
    if (category) {
      where.category = { slug: category };
    }
    if (minPrice > 0) where.basePrice = { ...where.basePrice, gte: minPrice };
    if (maxPrice < Infinity) where.basePrice = { ...where.basePrice, lte: maxPrice };

    // Determine ordering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { rating: "desc" };
    switch (sort) {
      case "prix_asc": orderBy = { basePrice: "asc" }; break;
      case "prix_desc": orderBy = { basePrice: "desc" }; break;
      case "note": orderBy = { rating: "desc" }; break;
      case "nouveau": orderBy = { createdAt: "desc" }; break;
      case "populaire": orderBy = { orderCount: "desc" }; break;
      default: orderBy = [{ isBoosted: "desc" }, { rating: "desc" }];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          media: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true } },
          user: { select: { name: true, image: true, avatar: true, country: true, plan: true, kyc: true } },
          agency: { select: { id: true, agencyName: true, logo: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);

    // Build vendor badges based on real data
    function buildBadges(user: { plan?: string | null; kyc?: number | null } | null, agency: { id: string } | null): string[] {
      const badges: string[] = [];
      if (agency) {
        badges.push("Agence");
      }
      if (user?.kyc && user.kyc >= 3) {
        badges.push("Verifie");
      }
      if (user?.plan) {
        const plan = user.plan.toUpperCase();
        if (plan === "PRO") badges.push("Pro");
        else if (plan === "BUSINESS") badges.push("Business");
        else if (plan === "AGENCE") badges.push("Agence");
      }
      return badges;
    }

    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.category?.name || "",
        categoryId: s.categoryId,
        basePrice: s.basePrice,
        deliveryDays: s.deliveryDays,
        rating: s.rating,
        ratingCount: s._count.reviews || s.ratingCount,
        orderCount: s.orderCount,
        image: s.media?.[0]?.url || (s.images as string[])?.[0] || "",
        images: s.images || [],
        vendorName: s.agency?.agencyName || s.user?.name || "",
        vendorAvatar: s.agency?.logo || s.user?.avatar || s.user?.image || "",
        vendorUsername: "",
        vendorCountry: s.user?.country || "",
        vendorBadges: buildBadges(s.user, s.agency),
        isBoosted: s.isBoosted,
        isVedette: s.status === "VEDETTE",
        tags: s.tags || [],
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[API /public/services GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des services" },
      { status: 500 }
    );
  }
}
