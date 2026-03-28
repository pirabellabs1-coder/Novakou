import { NextRequest, NextResponse } from "next/server";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      return handleDevMode(username);
    }

    return handleProductionMode(username);
  } catch (error) {
    console.error("[API /public/freelances/[username] GET]", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement du profil" },
      { status: 500 }
    );
  }
}

// ── Production: Prisma ─────────────────────────────────────────────────────
async function handleProductionMode(username: string) {
  // Find user by ID or name slug
  let user = await prisma.user.findUnique({
    where: { id: username },
    include: { freelancerProfile: true },
  });

  if (!user) {
    // Try by name slug or email prefix (username)
    const allUsers = await prisma.user.findMany({
      where: { role: { in: ["FREELANCE", "AGENCE"] }, status: "ACTIF" },
      include: { freelancerProfile: true },
    });
    const searchLower = username.toLowerCase();
    user = allUsers.find(
      (u) =>
        u.name.toLowerCase().replace(/\s+/g, "-") === searchLower ||
        (u.email && u.email.split("@")[0].toLowerCase() === searchLower)
    ) || null;
  }

  if (!user || (user.role !== "FREELANCE" && user.role !== "AGENCE")) {
    return NextResponse.json({ error: "Freelance non trouve" }, { status: 404 });
  }

  const fp = user.freelancerProfile;

  // Get active services
  const services = await prisma.service.findMany({
    where: { userId: user.id, status: "ACTIF" },
    include: { media: true, category: true },
  });

  const serviceList = services.map((s) => {
    const primaryMedia = s.media?.find((m) => m.isPrimary);
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      basePrice: s.basePrice,
      rating: s.rating,
      ratingCount: s.ratingCount,
      orderCount: s.orderCount,
      image: primaryMedia?.url || (s.images as string[])?.[0] || "",
      categoryName: s.category?.name || "",
    };
  });

  // Get reviews (Review uses targetId, not freelanceId; author is the reviewer)
  const reviews = await prisma.review.findMany({
    where: { targetId: user.id },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Stats
  const completedOrders = await prisma.order.count({
    where: { freelanceId: user.id, status: "TERMINE" },
  });
  const totalOrders = await prisma.order.count({
    where: { freelanceId: user.id, status: { not: "ANNULE" } },
  });
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Determine badge
  let badge = "";
  if (avgRating >= 4.5 && completedOrders >= 5) badge = "ELITE";
  else if (avgRating >= 4.0) badge = "TOP RATED";
  else if (completedOrders >= 1) badge = "RISING TALENT";

  // Certificates
  let certificates: { id: string; code: string; formationTitle: string; instructorName: string; score: number; issuedAt: string }[] = [];
  try {
    const certs = await prisma.certificate.findMany({
      where: { userId: user.id, revokedAt: null },
      include: {
        enrollment: {
          include: {
            formation: {
              select: { title: true, instructeur: { select: { user: { select: { name: true } } } } },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
      take: 20,
    });
    certificates = certs.map((c) => ({
      id: c.id,
      code: c.code,
      formationTitle: c.enrollment?.formation?.title ?? "Formation",
      instructorName: c.enrollment?.formation?.instructeur?.user?.name ?? "Instructeur",
      score: c.score,
      issuedAt: c.issuedAt.toISOString(),
    }));
  } catch {
    // No certificates table or error — return empty
  }

  return NextResponse.json({
    freelance: {
      id: user.id,
      name: user.name,
      role: user.role.toLowerCase(),
      status: user.status,
      memberSince: user.createdAt,
      portfolio: fp?.portfolio || [],
      profile: {
        title: fp?.title || "",
        bio: fp?.bio || "",
        photo: user.image || null,
        coverPhoto: fp?.coverPhoto || null,
        city: fp?.city || user.city || "",
        country: fp?.country || user.country || "",
        hourlyRate: fp?.hourlyRate || null,
        skills: fp?.skills || [],
        languages: fp?.languages || [],
        education: fp?.education || [],
        links: fp?.links || {},
        completionPercent: fp?.completionPercent || 0,
        badges: fp?.badges || [],
        availability: fp?.availability || { availableNow: true },
        vacationMode: fp?.vacationMode || false,
      },
      badge,
      services: serviceList,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        clientName: r.author?.name || "Client",
        clientAvatar: r.author?.image || "",
        clientId: r.authorId,
        createdAt: r.createdAt,
      })),
      certificates,
      stats: {
        completedOrders,
        totalOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        activeServices: serviceList.length,
      },
    },
  });
}

// ── Dev mode: in-memory stores ─────────────────────────────────────────────
async function handleDevMode(username: string) {
  const { devStore } = await import("@/lib/dev/dev-store");
  const { serviceStore, orderStore, reviewStore, profileStore } = await import("@/lib/dev/data-store");

  const searchLower = username.toLowerCase();
  const user = devStore.getAll().find(
    (u) =>
      u.id === searchLower ||
      u.id === username ||
      u.name.toLowerCase().replace(/\s+/g, "-") === searchLower ||
      (u.email && u.email.split("@")[0].toLowerCase() === searchLower)
  );
  if (!user || (user.role !== "freelance" && user.role !== "agence")) {
    return NextResponse.json({ error: "Freelance non trouve" }, { status: 404 });
  }

  const profile = profileStore.get(user.id);

  const services = serviceStore
    .getAll()
    .filter((s) => s.userId === user.id && s.status === "actif")
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      basePrice: s.basePrice,
      rating: s.rating,
      ratingCount: s.ratingCount,
      orderCount: s.orderCount ?? 0,
      image: s.mainImage,
      categoryName: s.categoryName,
    }));

  const reviews = reviewStore.getAll().filter((r) => r.freelanceId === user.id);

  const allOrders = orderStore.getAll().filter((o) => o.freelanceId === user.id);
  const completedOrders = allOrders.filter((o) => o.status === "termine").length;
  const totalOrders = allOrders.length;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  let badge = "";
  if (avgRating >= 4.5 && completedOrders >= 5) badge = "ELITE";
  else if (avgRating >= 4.0) badge = "TOP RATED";
  else if (completedOrders >= 1) badge = "RISING TALENT";

  const portfolio = profile?.portfolio ?? [];

  return NextResponse.json({
    freelance: {
      id: user.id,
      name: user.name,
      role: user.role,
      status: user.status,
      memberSince: user.createdAt,
      portfolio,
      profile: {
        title: profile?.title || "",
        bio: profile?.bio || "",
        photo: profile?.photo || null,
        coverPhoto: profile?.coverPhoto || null,
        city: profile?.city || user.country || "",
        country: profile?.country || user.country || "",
        hourlyRate: profile?.hourlyRate || null,
        skills: profile?.skills || [],
        languages: profile?.languages || [],
        education: profile?.education || [],
        links: profile?.links || {},
        completionPercent: profile?.completionPercent || 0,
        badges: profile?.badges || [],
        availability: profile?.availability || { availableNow: true },
        vacationMode: profile?.vacationMode || false,
      },
      badge,
      services,
      reviews: reviews.slice(0, 10),
      certificates: [],
      stats: {
        completedOrders,
        totalOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        activeServices: services.length,
      },
    },
  });
}
