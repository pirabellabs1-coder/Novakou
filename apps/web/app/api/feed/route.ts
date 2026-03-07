import { NextRequest, NextResponse } from "next/server";
import { serviceStore } from "@/lib/dev/data-store";

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

    return NextResponse.json({ services });
  } catch (error) {
    console.error("[API /feed GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des services" },
      { status: 500 }
    );
  }
}
