import { NextRequest, NextResponse } from "next/server";
import { serviceStore, boostStore } from "@/lib/dev/data-store";

export async function GET(req: NextRequest) {
  // Nettoyer les boosts expires a chaque listing
  boostStore.cleanupExpired();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;
  const sort = searchParams.get("sort") || "pertinence";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Number(searchParams.get("limit")) || 12);

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
