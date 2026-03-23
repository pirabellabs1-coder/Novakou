import { NextRequest, NextResponse } from "next/server";
import { IS_DEV } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (IS_DEV) {
    return handleDevMode(slug);
  }

  return handleProductionMode(slug);
}

// ── Production: Prisma ─────────────────────────────────────────────────────
async function handleProductionMode(slug: string) {
  const service = await prisma.service.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      status: "ACTIF",
    },
    include: {
      media: { orderBy: { order: "asc" } },
      options: true,
      category: true,
      user: {
        include: { freelancerProfile: true },
      },
    },
  });

  if (!service) {
    return NextResponse.json({ error: "Service non trouve" }, { status: 404 });
  }

  // Reviews
  const reviews = await prisma.review.findMany({
    where: { serviceId: service.id },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Vendor info
  const fp = service.user.freelancerProfile;
  const completedOrders = await prisma.order.count({
    where: { freelanceId: service.userId, status: "TERMINE" },
  });

  // Other services by same vendor
  const otherServices = await prisma.service.findMany({
    where: { userId: service.userId, id: { not: service.id }, status: "ACTIF" },
    include: { media: true },
    take: 4,
  });

  // Similar services in same category
  const similarServices = await prisma.service.findMany({
    where: { categoryId: service.categoryId, id: { not: service.id }, status: "ACTIF" },
    include: { media: true, user: { select: { name: true } } },
    take: 4,
  });

  // Build main image from media
  const primaryMedia = service.media?.find((m) => m.isPrimary);
  const mainImage = primaryMedia?.url || (service.images as string[])?.[0] || "";
  const imageMedia = service.media?.filter((m) => m.type === "IMAGE") || [];
  const videoMedia = service.media?.find((m) => m.type === "VIDEO");

  return NextResponse.json({
    service: {
      id: service.id,
      slug: service.slug,
      title: service.title,
      description: service.description,
      descriptionText: service.descriptionText,
      categoryId: service.categoryId,
      categoryName: service.category?.name || "",
      subCategoryId: service.subCategoryId,
      tags: service.tags,
      basePrice: service.basePrice,
      deliveryDays: service.deliveryDays,
      revisions: service.revisions,
      packages: service.packages,
      options: service.options,
      faq: service.faq,
      extras: service.extras,
      mainImage,
      images: imageMedia.map((m) => m.url),
      videoUrl: videoMedia?.url || "",
      rating: service.rating,
      ratingCount: service.ratingCount,
      status: service.status.toLowerCase(),
      createdAt: service.createdAt,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        clientName: r.author?.name || "Client",
        clientAvatar: r.author?.image || "",
        qualite: r.quality,
        communication: r.communication,
        delai: r.timeliness,
        reply: r.response,
        createdAt: r.createdAt,
      })),
      vendor: {
        name: service.user.name,
        avatar: service.user.image || "",
        username: service.user.email?.split("@")[0] || "",
        country: fp?.country || service.user.country || "",
        badges: fp?.badges || [],
        rating: service.rating,
        plan: service.user.plan?.toLowerCase() || "gratuit",
        title: fp?.title || "",
        bio: fp?.bio || "",
        completedOrders,
        memberSince: service.user.createdAt,
      },
      otherServices: otherServices.map((s) => {
        const pm = s.media?.find((m) => m.isPrimary);
        return {
          id: s.id,
          slug: s.slug,
          title: s.title,
          basePrice: s.basePrice,
          rating: s.rating,
          ratingCount: s.ratingCount,
          image: pm?.url || (s.images as string[])?.[0] || "",
        };
      }),
      similarServices: similarServices.map((s) => {
        const pm = s.media?.find((m) => m.isPrimary);
        return {
          id: s.id,
          slug: s.slug,
          title: s.title,
          basePrice: s.basePrice,
          rating: s.rating,
          ratingCount: s.ratingCount,
          image: pm?.url || (s.images as string[])?.[0] || "",
          vendorName: s.user?.name || "",
        };
      }),
    },
  });
}

// ── Dev mode: in-memory stores ─────────────────────────────────────────────
async function handleDevMode(slug: string) {
  const { serviceStore, reviewStore, orderStore, profileStore } = await import("@/lib/dev/data-store");

  const service = serviceStore
    .getAll()
    .find((s) => (s.id === slug || s.slug === slug) && s.status === "actif");
  if (!service)
    return NextResponse.json({ error: "Service non trouve" }, { status: 404 });

  const reviews = reviewStore.getAll().filter((r) => r.serviceId === service.id);
  const profile = profileStore.get(service.userId);

  const otherServices = serviceStore
    .getAll()
    .filter((s) => s.userId === service.userId && s.id !== service.id && s.status === "actif")
    .slice(0, 4)
    .map((s) => ({
      id: s.id, slug: s.slug, title: s.title, basePrice: s.basePrice,
      rating: s.rating, ratingCount: s.ratingCount, image: s.mainImage,
    }));

  const similarServices = serviceStore
    .getAll()
    .filter((s) => s.categoryId === service.categoryId && s.id !== service.id && s.status === "actif")
    .slice(0, 4)
    .map((s) => ({
      id: s.id, slug: s.slug, title: s.title, basePrice: s.basePrice,
      rating: s.rating, ratingCount: s.ratingCount, image: s.mainImage, vendorName: s.vendorName,
    }));

  const completedOrders = orderStore
    .getAll()
    .filter((o) => o.freelanceId === service.userId && o.status === "termine").length;

  return NextResponse.json({
    service: {
      ...service,
      reviews,
      vendor: {
        name: service.vendorName,
        avatar: service.vendorAvatar,
        username: service.vendorUsername,
        country: service.vendorCountry,
        badges: service.vendorBadges,
        rating: service.vendorRating,
        plan: service.vendorPlan,
        title: profile?.title || "",
        bio: profile?.bio || "",
        completedOrders,
        memberSince: undefined,
      },
      otherServices,
      similarServices,
    },
  });
}
