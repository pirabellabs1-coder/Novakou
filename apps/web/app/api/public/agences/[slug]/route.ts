import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { devStore } from "@/lib/dev/dev-store";
import { serviceStore, orderStore, reviewStore, profileStore } from "@/lib/dev/data-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // ── Dev mode ──
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const agency = devStore.getAll().find(
        (u) =>
          u.role === "agence" &&
          (u.id === slug || u.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase())
      );
      if (!agency) return NextResponse.json({ error: "Agence non trouvee" }, { status: 404 });

      const profile = profileStore.get(agency.id);
      const services = serviceStore.getAll()
        .filter((s) => s.userId === agency.id && s.status === "actif")
        .map((s) => ({ id: s.id, slug: s.slug, title: s.title, basePrice: s.basePrice, rating: s.rating, ratingCount: s.ratingCount, orderCount: s.orderCount, image: s.mainImage, categoryName: s.categoryName }));
      const reviews = reviewStore.getAll().filter((r) => r.freelanceId === agency.id);
      const allOrders = orderStore.getAll().filter((o) => o.freelanceId === agency.id);
      const completedOrders = allOrders.filter((o) => o.status === "termine").length;
      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      const team = profile?.team ?? [];
      const caseStudies = profile?.caseStudies ?? [];
      const workProcess = profile?.workProcess ?? [];

      return NextResponse.json({
        agency: {
          id: agency.id, name: agency.name, plan: agency.plan, kyc: agency.kyc, memberSince: agency.createdAt,
          team, caseStudies, workProcess,
          profile: profile ? { title: profile.title, bio: profile.bio, photo: profile.photo, coverPhoto: profile.coverPhoto, city: profile.city, country: profile.country, skills: profile.skills, languages: profile.languages, links: profile.links, badges: profile.badges } : null,
          isVerified: agency.kyc >= 3, services, reviews: reviews.slice(0, 10),
          stats: { completedOrders, avgRating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length, activeServices: services.length, teamSize: team.length > 0 ? team.length : 1 },
        },
      });
    }

    // ── Production: Prisma ──
    // Search by ID or slugified agencyName
    const slugLower = slug.toLowerCase();
    let agencyProfile = await prisma.agencyProfile.findUnique({
      where: { id: slug },
      include: {
        user: { select: { id: true, name: true, plan: true, kyc: true, createdAt: true, avatar: true, image: true } },
        members: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                id: true, name: true, avatar: true, image: true,
                freelancerProfile: { select: { skills: true, title: true } },
              },
            },
          },
        },
      },
    });

    // If not found by ID, search by slugified name
    if (!agencyProfile) {
      const allAgencies = await prisma.agencyProfile.findMany({
        where: {},
        select: { id: true, agencyName: true },
      });
      const match = allAgencies.find(
        (a) => a.agencyName.toLowerCase().replace(/\s+/g, "-") === slugLower
      );
      if (match) {
        agencyProfile = await prisma.agencyProfile.findUnique({
          where: { id: match.id },
          include: {
            user: { select: { id: true, name: true, plan: true, kyc: true, createdAt: true, avatar: true, image: true } },
            members: {
              where: { status: "ACTIVE" },
              include: {
                user: {
                  select: {
                    id: true, name: true, avatar: true, image: true,
                    freelancerProfile: { select: { skills: true, title: true } },
                  },
                },
              },
            },
          },
        });
      }
    }

    if (!agencyProfile) {
      return NextResponse.json({ error: "Agence non trouvee" }, { status: 404 });
    }

    // Services
    const services = await prisma.service.findMany({
      where: { agencyId: agencyProfile.id, status: { in: ["ACTIF", "VEDETTE"] } },
      take: 6,
      orderBy: { orderCount: "desc" },
      include: {
        category: { select: { name: true } },
        _count: { select: { reviews: true } },
      },
    });

    // Reviews from agency services
    const reviews = await prisma.review.findMany({
      where: { service: { agencyId: agencyProfile.id } },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, avatar: true, image: true, country: true, countryFlag: true } },
        service: { select: { title: true } },
      },
    });

    // Stats
    const [completedOrders, totalReviews, avgRatingAgg] = await Promise.all([
      prisma.order.count({ where: { agencyId: agencyProfile.id, status: "TERMINE" } }),
      prisma.review.count({ where: { service: { agencyId: agencyProfile.id } } }),
      prisma.review.aggregate({ where: { service: { agencyId: agencyProfile.id } }, _avg: { rating: true } }),
    ]);

    const avgRating = Math.round((avgRatingAgg._avg.rating ?? 0) * 10) / 10;

    // Build team from TeamMember model
    const team = agencyProfile.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      avatar: m.user.avatar || m.user.image || "",
      role: m.role.replace(/_/g, " ").toLowerCase(),
      skills: m.user.freelancerProfile?.skills || [],
      title: m.user.freelancerProfile?.title || "",
      joinedAt: m.joinedAt?.toISOString() || m.createdAt.toISOString(),
    }));

    // Case studies and work process from settings JSON (if stored there)
    const settings = (agencyProfile.settings as Record<string, unknown>) || {};
    const caseStudies = (settings.caseStudies as unknown[]) || [];
    const workProcess = (settings.workProcess as unknown[]) || [];

    return NextResponse.json({
      agency: {
        id: agencyProfile.id,
        name: agencyProfile.agencyName,
        logo: agencyProfile.logo || "",
        sector: agencyProfile.sector || "",
        size: agencyProfile.size || "",
        description: agencyProfile.description || "",
        website: agencyProfile.website || "",
        country: agencyProfile.country || agencyProfile.user.name || "",
        plan: agencyProfile.user.plan?.toLowerCase() || "gratuit",
        kyc: agencyProfile.user.kyc || 1,
        memberSince: agencyProfile.createdAt.toISOString(),
        isVerified: agencyProfile.verified,
        team,
        caseStudies,
        workProcess,
        profile: {
          title: agencyProfile.agencyName,
          bio: agencyProfile.description || "",
          photo: agencyProfile.logo || agencyProfile.user.avatar || agencyProfile.user.image || "",
          coverPhoto: "",
          city: "",
          country: agencyProfile.country || "",
          skills: [],
          languages: [],
          links: agencyProfile.website ? { website: agencyProfile.website } : {},
          badges: agencyProfile.verified ? ["Agence Verifiee"] : [],
        },
        services: services.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          basePrice: s.basePrice,
          rating: s.rating,
          ratingCount: s._count.reviews || s.ratingCount,
          orderCount: s.orderCount,
          image: (s.images as string[])?.[0] || "",
          categoryName: s.category?.name || "",
        })),
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || "",
          response: r.response || "",
          quality: r.quality,
          communication: r.communication,
          timeliness: r.timeliness,
          createdAt: r.createdAt.toISOString(),
          serviceTitle: r.service?.title || "",
          author: {
            name: r.author.name,
            avatar: r.author.avatar || r.author.image || "",
            country: r.author.country || "",
            countryFlag: r.author.countryFlag || "",
          },
        })),
        stats: {
          completedOrders,
          avgRating,
          totalReviews,
          activeServices: services.length,
          teamSize: team.length > 0 ? team.length : 1,
        },
      },
    });
  } catch (error) {
    console.error("[API /public/agences/[slug] GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation du profil agence" }, { status: 500 });
  }
}
