import { NextRequest, NextResponse } from "next/server";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { serviceStore, boostStore } from "@/lib/dev/data-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;
  const sort = searchParams.get("sort") || "pertinence";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Number(searchParams.get("limit")) || 12);

  // Production mode or Vercel: Prisma (dev stores are ephemeral on serverless)
  if (!IS_DEV || USE_PRISMA_FOR_DATA) {
    return handleProductionMode({ q, category, minPrice, maxPrice, sort, page, limit });
  }

  // Dev mode local only: in-memory stores
  boostStore.cleanupExpired();
  let services = serviceStore.getAll().filter((s) => s.status === "actif");

  // Filters
  if (q)
    services = services.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.descriptionText.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  if (category)
    services = services.filter(
      (s) =>
        s.categoryId === category ||
        s.categoryName.toLowerCase() === category.toLowerCase()
    );
  services = services.filter(
    (s) =>
      s.basePrice >= minPrice &&
      (maxPrice === Infinity || s.basePrice <= maxPrice)
  );

  // Sort
  switch (sort) {
    case "prix_asc":
      services.sort((a, b) => a.basePrice - b.basePrice);
      break;
    case "prix_desc":
      services.sort((a, b) => b.basePrice - a.basePrice);
      break;
    case "note":
      services.sort((a, b) => b.rating - a.rating);
      break;
    case "nouveau":
      services.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "populaire":
      services.sort((a, b) => b.orderCount - a.orderCount);
      break;
    default:
      // pertinence - boosted first, then by score
      services.sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return b.rating * b.orderCount - (a.rating * a.orderCount);
      });
  }

  const total = services.length;
  const offset = (page - 1) * limit;
  const paginated = services.slice(offset, offset + limit);

  return NextResponse.json({
    services: paginated.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      category: s.categoryName,
      categoryId: s.categoryId,
      basePrice: s.basePrice,
      deliveryDays: s.deliveryDays,
      rating: s.rating,
      ratingCount: s.ratingCount,
      orderCount: s.orderCount,
      image: s.mainImage,
      images: s.images,
      vendorName: s.vendorName,
      vendorAvatar: s.vendorAvatar,
      vendorUsername: s.vendorUsername,
      vendorCountry: s.vendorCountry,
      vendorBadges: s.vendorBadges,
      isBoosted: s.isBoosted,
      tags: s.tags,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// ── Production: Prisma ─────────────────────────────────────────────────────
async function handleProductionMode(params: {
  q: string; category: string; minPrice: number; maxPrice: number;
  sort: string; page: number; limit: number;
}) {
  const { q, category, minPrice, maxPrice, sort, page, limit } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { status: "ACTIF" };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { descriptionText: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: [q] } },
    ];
  }
  if (category) {
    where.OR = [
      ...(where.OR || []),
      { categoryId: category },
    ];
    if (!where.OR?.length) {
      where.categoryId = category;
      delete where.OR;
    }
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
        user: { select: { name: true, image: true, country: true, plan: true } },
      },
    }),
    prisma.service.count({ where }),
  ]);

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
      ratingCount: s.ratingCount,
      orderCount: s.orderCount,
      image: s.media?.[0]?.url || (s.images as string[])?.[0] || "",
      images: s.images || [],
      vendorName: s.user?.name || "",
      vendorAvatar: s.user?.image || "",
      vendorUsername: "",
      vendorCountry: s.user?.country || "",
      vendorBadges: [],
      isBoosted: s.isBoosted,
      tags: s.tags || [],
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
