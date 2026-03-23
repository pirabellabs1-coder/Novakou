import { NextRequest, NextResponse } from "next/server";
import { serviceStore } from "@/lib/dev/data-store";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q")?.toLowerCase();
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : null;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : null;
    const sort = searchParams.get("sort");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));

    // ── Dev mode: in-memory store ──
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      let services = serviceStore.getFeedServices();

      // Filter by search query
      if (query) {
        services = services.filter(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.descriptionText.toLowerCase().includes(query) ||
            s.tags.some((t) => t.toLowerCase().includes(query)) ||
            s.categoryName.toLowerCase().includes(query) ||
            s.subCategoryName.toLowerCase().includes(query) ||
            s.vendorName.toLowerCase().includes(query)
        );
      }

      // Filter by category
      if (category) {
        services = services.filter(
          (s) => s.categoryId === category || s.subCategoryId === category
        );
      }

      // Filter by min price
      if (minPrice !== null) {
        services = services.filter((s) => s.basePrice >= minPrice);
      }

      // Filter by max price
      if (maxPrice !== null) {
        services = services.filter((s) => s.basePrice <= maxPrice);
      }

      // Sort
      switch (sort) {
        case "prix-asc":
          services.sort((a, b) => a.basePrice - b.basePrice);
          break;
        case "prix-desc":
          services.sort((a, b) => b.basePrice - a.basePrice);
          break;
        case "note":
          services.sort((a, b) => b.rating - a.rating);
          break;
        case "nouveaute":
          services.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "popularite":
          services.sort((a, b) => b.orderCount - a.orderCount);
          break;
        default:
          // Default: boosted services first, then by views (pertinence)
          services.sort((a, b) => {
            if (a.isBoosted && !b.isBoosted) return -1;
            if (!a.isBoosted && b.isBoosted) return 1;
            return b.views - a.views;
          });
          break;
      }

      const total = services.length;
      const paginated = services.slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        services: paginated,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    }

    // ── Production: Prisma ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: { in: ["ACTIF", "VEDETTE"] },
    };

    if (category) {
      where.OR = [
        { categoryId: category },
        { subCategoryId: category },
      ];
    }

    if (minPrice !== null || maxPrice !== null) {
      where.basePrice = {};
      if (minPrice !== null) where.basePrice.gte = minPrice;
      if (maxPrice !== null) where.basePrice.lte = maxPrice;
    }

    if (query) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { descriptionText: { contains: query, mode: "insensitive" } },
            { tags: { has: query } },
          ],
        },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderByMap: Record<string, any> = {
      "prix-asc": { basePrice: "asc" },
      "prix-desc": { basePrice: "desc" },
      note: { rating: "desc" },
      nouveaute: { createdAt: "desc" },
      popularite: { orderCount: "desc" },
    };

    const orderBy = orderByMap[sort || ""] || [
      { isBoosted: "desc" },
      { views: "desc" },
    ];

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              country: true,
              plan: true,
              isVerified: true,
            },
          },
          media: { orderBy: { sortOrder: "asc" }, take: 5 },
          _count: { select: { orders: true, reviews: true } },
        },
        orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      services,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[API /feed GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des services" },
      { status: 500 }
    );
  }
}
