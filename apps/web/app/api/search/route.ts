import { NextRequest, NextResponse } from "next/server";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

// Semantic search API — In production: Postgres text search
// In dev: uses keyword matching against dev store data

import { devStore } from "@/lib/dev/dev-store";
import { serviceStore, reviewStore, profileStore } from "@/lib/dev/data-store";

interface SearchResult {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  location: string;
  skills: string[];
  bio: string;
  completionRate: number;
  responseTime: string;
  matchScore: number;
  type: "freelance" | "agence";
}

function buildSearchResults(): SearchResult[] {
  const results: SearchResult[] = [];

  // Get all active freelances
  const freelances = devStore.getAll().filter(
    (u) => u.role === "freelance" && u.status === "ACTIF"
  );

  // Get all active agences
  const agences = devStore.getAll().filter(
    (u) => u.role === "agence" && u.status === "ACTIF"
  );

  const allUsers = [
    ...freelances.map((u) => ({ ...u, type: "freelance" as const })),
    ...agences.map((u) => ({ ...u, type: "agence" as const })),
  ];

  for (const user of allUsers) {
    const services = serviceStore
      .getAll()
      .filter((s) => s.userId === user.id && s.status === "actif");
    const reviews = reviewStore
      .getAll()
      .filter((r) => r.freelanceId === user.id);
    const profile = profileStore.get(user.id);

    // Compute average rating from reviews, fall back to service ratings
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      avgRating = Math.round(avgRating * 10) / 10;
    } else if (services.length > 0) {
      const rated = services.filter((s) => s.ratingCount > 0);
      if (rated.length > 0) {
        avgRating =
          rated.reduce((sum, s) => sum + s.rating, 0) / rated.length;
        avgRating = Math.round(avgRating * 10) / 10;
      }
    }

    // Collect skills from service tags
    const skillSet = new Set<string>();
    for (const s of services) {
      for (const tag of s.tags) {
        skillSet.add(tag);
      }
    }
    // Also add skills from profile if available
    if (profile?.skills) {
      for (const sk of profile.skills) {
        skillSet.add(sk.name);
      }
    }

    // Determine title: profile title, first service category, or default
    const title =
      profile?.title ||
      (services.length > 0 ? services[0].categoryName : "") ||
      (user.type === "agence" ? "Agence" : "Freelance");

    // Determine hourly rate
    const hourlyRate =
      profile?.hourlyRate ||
      (services.length > 0 ? services[0].basePrice : 0);

    // Location from profile
    const location =
      profile
        ? [profile.city, profile.country].filter(Boolean).join(", ")
        : "";

    // Bio
    const bio = profile?.bio || "";

    // Completion rate from profile
    const completionRate = profile?.completionPercent || 0;

    // Response time placeholder
    const responseTime = "< 2h";

    results.push({
      id: user.id,
      name: user.name,
      avatar: profile?.photo || "",
      title,
      rating: avgRating,
      reviews: reviews.length,
      hourlyRate,
      location,
      skills: Array.from(skillSet).slice(0, 10),
      bio,
      completionRate,
      responseTime,
      matchScore: 0,
      type: user.type,
    });
  }

  return results;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const skills =
    req.nextUrl.searchParams
      .get("skills")
      ?.split(",")
      .filter(Boolean) || [];
  const budget = req.nextUrl.searchParams.get("budget");
  const type = req.nextUrl.searchParams.get("type"); // freelance | agence

  if (!q && skills.length === 0) {
    return NextResponse.json({
      results: [],
      entities: { skills: [], budget: null, type: null },
    });
  }

  // ── Dev store path ──
  if (IS_DEV && !USE_PRISMA_FOR_DATA) {
    const queryLower = q.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(Boolean);

    // Extract entities from the natural language query
    const extractedSkills: string[] = [];
    const allKnownSkills = [
      "react", "node.js", "typescript", "figma", "python", "aws", "docker",
      "wordpress", "seo", "ui", "ux", "flutter", "next.js", "postgresql",
      "devops", "cloud", "mobile", "web", "redaction", "copywriting",
      "javascript", "vue", "angular", "java", "php", "laravel", "django",
      "ruby", "go", "rust", "swift", "kotlin", "tailwind", "graphql",
    ];
    for (const skill of allKnownSkills) {
      if (queryLower.includes(skill)) extractedSkills.push(skill);
    }
    // Merge with explicit skills param
    const allSearchSkills = [
      ...new Set([
        ...extractedSkills,
        ...skills.map((s) => s.toLowerCase()),
      ]),
    ];

    let budgetExtracted: number | null = null;
    const budgetMatch = queryLower.match(/(\d+)\s*(?:€|eur|euro)/);
    if (budgetMatch) budgetExtracted = parseInt(budgetMatch[1]);
    if (budget) budgetExtracted = parseInt(budget);

    // Build results from real data
    const searchDB = buildSearchResults();

    // Score each result
    let results = searchDB.map((s) => {
      let score = 0;

      // Name match
      if (queryWords.some((w) => s.name.toLowerCase().includes(w))) score += 20;

      // Title match
      if (queryWords.some((w) => s.title.toLowerCase().includes(w))) score += 25;

      // Bio match
      const bioWords = queryWords.filter((w) =>
        s.bio.toLowerCase().includes(w)
      );
      score += bioWords.length * 10;

      // Skills match
      const matchedSkills = allSearchSkills.filter((sk) =>
        s.skills.some((ss) => ss.toLowerCase().includes(sk))
      );
      score += matchedSkills.length * 15;

      // Budget filter
      if (budgetExtracted && s.hourlyRate > budgetExtracted) score -= 20;

      // Type filter
      if (type && s.type !== type) score -= 50;

      // Base rating bonus
      score += s.rating * 5;

      return { ...s, matchScore: Math.max(0, Math.min(100, score)) };
    });

    // Filter out zero-score results unless no query
    if (q) {
      results = results.filter((r) => r.matchScore > 10);
    }

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      results,
      entities: {
        skills: allSearchSkills,
        budget: budgetExtracted,
        type: type || null,
      },
    });
  }

  // ── Production: Prisma text search ──
  try {
    const { prisma } = await import("@/lib/prisma");
    const queryWords = q.toLowerCase().split(/\s+/).filter(Boolean);

    // Search users (freelancers / agencies) by name and email
    const users = await prisma.user.findMany({
      where: {
        status: "ACTIF",
        role:
          type === "agence"
            ? "AGENCE"
            : type === "freelance"
            ? "FREELANCE"
            : { in: ["FREELANCE", "AGENCE"] },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          {
            freelancerProfile: {
              title: { contains: q, mode: "insensitive" },
            },
          },
          {
            freelancerProfile: { skills: { hasSome: queryWords } },
          },
        ],
      },
      include: {
        freelancerProfile: {
          select: { title: true, bio: true, skills: true, hourlyRate: true },
        },
        agencyProfile: { select: { agencyName: true, description: true } },
        _count: { select: { reviewsReceived: true, ordersAsFreelance: true } },
      },
      take: 20,
    });

    // Search services by title and description
    const services = await prisma.service.findMany({
      where: {
        status: "ACTIF",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { descriptionText: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, country: true, role: true, avatar: true },
        },
        category: { select: { name: true } },
      },
      take: 20,
      orderBy: { orderCount: "desc" },
    });

    // Build user results
    const userResults: SearchResult[] = users.map((u) => ({
      id: u.id,
      name:
        u.role === "AGENCE"
          ? u.agencyProfile?.agencyName || u.name
          : u.name,
      avatar: u.avatar || "",
      title:
        u.freelancerProfile?.title ||
        u.agencyProfile?.description?.slice(0, 60) ||
        "",
      rating: 0,
      reviews: u._count.reviewsReceived,
      hourlyRate: u.freelancerProfile?.hourlyRate || 0,
      location: u.country || "",
      skills: (u.freelancerProfile?.skills as string[]) || [],
      bio:
        u.freelancerProfile?.bio ||
        u.agencyProfile?.description ||
        "",
      completionRate: 0,
      responseTime: "< 2h",
      matchScore: 50,
      type: u.role === "AGENCE" ? ("agence" as const) : ("freelance" as const),
    }));

    // Merge service-owner profiles not already present
    const seenIds = new Set(userResults.map((r) => r.id));
    for (const svc of services) {
      if (seenIds.has(svc.user.id)) continue;
      seenIds.add(svc.user.id);
      userResults.push({
        id: svc.user.id,
        name: svc.user.name,
        avatar: svc.user.avatar || "",
        title: svc.category?.name || "",
        rating: 0,
        reviews: 0,
        hourlyRate: 0,
        location: svc.user.country || "",
        skills: [],
        bio: "",
        completionRate: 0,
        responseTime: "< 2h",
        matchScore: 40,
        type:
          svc.user.role === "AGENCE"
            ? ("agence" as const)
            : ("freelance" as const),
      });
    }

    return NextResponse.json({
      results: userResults,
      entities: {
        skills: queryWords,
        budget: budget ? parseInt(budget) : null,
        type: type || null,
      },
    });
  } catch (error) {
    console.error("[API /search GET] Prisma error:", error);
    return NextResponse.json({
      results: [],
      entities: { skills: [], budget: null, type: null },
    });
  }
}
