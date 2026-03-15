import { NextRequest, NextResponse } from "next/server";
import { devStore } from "@/lib/dev/dev-store";
import {
  serviceStore,
  orderStore,
  reviewStore,
  profileStore,
} from "@/lib/dev/data-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Find user by ID or username slug
  const user = devStore.getAll().find(
    (u) =>
      u.id === username ||
      u.name.toLowerCase().replace(/\s+/g, "-") === username.toLowerCase()
  );
  if (!user || (user.role !== "freelance" && user.role !== "agence")) {
    return NextResponse.json(
      { error: "Freelance non trouvé" },
      { status: 404 }
    );
  }

  const profile = profileStore.get(user.id);

  // Get services
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
      image: s.mainImage,
      categoryName: s.categoryName,
    }));

  // Get reviews received
  const reviews = reviewStore
    .getAll()
    .filter((r) => r.freelanceId === user.id);

  // Stats
  const allOrders = orderStore
    .getAll()
    .filter((o) => o.freelanceId === user.id);
  const completedOrders = allOrders.filter(
    (o) => o.status === "termine"
  ).length;
  const totalOrders = allOrders.length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Determine badge
  let badge = "";
  if (avgRating >= 4.5 && completedOrders >= 5) badge = "ELITE";
  else if (avgRating >= 4.0) badge = "TOP RATED";
  else if (completedOrders >= 1) badge = "RISING TALENT";

  // Fetch formation certificates (query Prisma if available)
  let certificates: { id: string; code: string; formationTitle: string; instructorName: string; score: number; issuedAt: string }[] = [];
  try {
    const prisma = (await import("@freelancehigh/db")).default;
    const certs = await prisma.certificate.findMany({
      where: { userId: user.id, revokedAt: null },
      include: {
        enrollment: {
          include: {
            formation: {
              select: { titleFr: true, instructeur: { select: { user: { select: { name: true } } } } },
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
      formationTitle: c.enrollment?.formation?.titleFr ?? "Formation",
      instructorName: c.enrollment?.formation?.instructeur?.user?.name ?? "Instructeur",
      score: c.score,
      issuedAt: c.issuedAt.toISOString(),
    }));
  } catch {
    // DB not connected or no certificates — return empty array
  }

  return NextResponse.json({
    freelance: {
      id: user.id,
      name: user.name,
      role: user.role,
      status: user.status,
      memberSince: user.createdAt,
      profile: profile
        ? {
            title: profile.title,
            bio: profile.bio,
            photo: profile.photo,
            coverPhoto: profile.coverPhoto,
            city: profile.city,
            country: profile.country,
            hourlyRate: profile.hourlyRate,
            skills: profile.skills,
            languages: profile.languages,
            education: profile.education,
            links: profile.links,
            completionPercent: profile.completionPercent,
            badges: profile.badges,
            availability: profile.availability,
            vacationMode: profile.vacationMode,
          }
        : null,
      badge,
      services,
      reviews: reviews.slice(0, 10),
      certificates,
      stats: {
        completedOrders,
        totalOrders,
        completionRate:
          totalOrders > 0
            ? Math.round((completedOrders / totalOrders) * 100)
            : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        activeServices: services.length,
      },
    },
  });
}
