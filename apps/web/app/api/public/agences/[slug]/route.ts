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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find agency by ID or name slug
  const agency = devStore.getAll().find(
    (u) =>
      u.role === "agence" &&
      (u.id === slug ||
        u.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase())
  );
  if (!agency)
    return NextResponse.json(
      { error: "Agence non trouvée" },
      { status: 404 }
    );

  const profile = profileStore.get(agency.id);

  const services = serviceStore
    .getAll()
    .filter((s) => s.userId === agency.id && s.status === "actif")
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

  const reviews = reviewStore
    .getAll()
    .filter((r) => r.freelanceId === agency.id);
  const allOrders = orderStore
    .getAll()
    .filter((o) => o.freelanceId === agency.id);
  const completedOrders = allOrders.filter(
    (o) => o.status === "termine"
  ).length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Team members, case studies, work process from profile
  const team = profile?.team ?? [];
  const caseStudies = profile?.caseStudies ?? [];
  const workProcess = profile?.workProcess ?? [];

  return NextResponse.json({
    agency: {
      id: agency.id,
      name: agency.name,
      plan: agency.plan,
      kyc: agency.kyc,
      memberSince: agency.createdAt,
      team,
      caseStudies,
      workProcess,
      profile: profile
        ? {
            title: profile.title,
            bio: profile.bio,
            photo: profile.photo,
            coverPhoto: profile.coverPhoto,
            city: profile.city,
            country: profile.country,
            skills: profile.skills,
            languages: profile.languages,
            links: profile.links,
            badges: profile.badges,
          }
        : null,
      isVerified: agency.kyc >= 3,
      services,
      reviews: reviews.slice(0, 10),
      stats: {
        completedOrders,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        activeServices: services.length,
        teamSize: 1, // placeholder
      },
    },
  });
}
