import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { devStore } from "@/lib/dev/dev-store";
import { serviceStore, orderStore, reviewStore } from "@/lib/dev/data-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get("limit") || "3", 10), 12);

    if (IS_DEV) {
      const users = devStore.getAll().filter((u) => u.role === "freelance" && u.status === "ACTIF");
      const allServices = serviceStore.getAll();
      const allOrders = orderStore.getAll();
      const allReviews = reviewStore.getAll();

      // Score each freelance
      const scored = users.map((user) => {
        const userServices = allServices.filter((s) => s.userId === user.id && s.status === "actif");
        const userOrders = allOrders.filter((o) => o.freelanceId === user.id);
        const userReviews = allReviews.filter((r) => r.freelanceId === user.id);
        const completedOrders = userOrders.filter((o) => o.status === "livre" || o.status === "termine");

        const avgRating = userReviews.length > 0
          ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
          : 0;
        const completionRate = userOrders.length > 0
          ? completedOrders.length / userOrders.length
          : 0;

        // Pick the top service's price as daily rate proxy
        const topService = userServices.sort((a, b) => b.revenue - a.revenue)[0];
        const dailyRateEur = topService ? topService.basePrice : 0;

        // Extract skills from service tags
        const skills = [...new Set(userServices.flatMap((s) => s.tags))].slice(0, 3);

        const score =
          (avgRating / 5) * 0.35 +
          Math.min(completedOrders.length / 20, 1) * 0.25 +
          completionRate * 0.2 +
          Math.min(userReviews.length / 30, 1) * 0.1 +
          Math.min(userServices.length / 5, 1) * 0.1;

        return {
          user,
          score,
          avgRating: Math.round(avgRating * 10) / 10,
          completedOrders: completedOrders.length,
          reviewCount: userReviews.length,
          skills,
          dailyRateEur,
          serviceCount: userServices.length,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, limit).map((item) => ({
        id: item.user.id,
        // Use ID as username — guaranteed to match in public freelance API
        username: item.user.id,
        name: item.user.name,
        title: item.skills.length > 0 ? item.skills[0] : "Freelance",
        rating: item.avgRating,
        skills: item.skills,
        dailyRateEur: item.dailyRateEur,
        completedOrders: item.completedOrders,
        reviewCount: item.reviewCount,
        badge: item.avgRating >= 4.5 && item.completedOrders >= 5 ? "ELITE" : item.avgRating >= 4.0 ? "TOP RATED" : "",
        image: "",
        location: "",
      }));

      return NextResponse.json({ freelances: top });
    }

    // Production: Prisma
    const users = await prisma.user.findMany({
      where: { role: "FREELANCE", status: "ACTIF" },
      include: {
        freelancerProfile: true,
        services: { where: { status: "ACTIF" } },
        reviewsReceived: true,
        ordersAsFreelance: {
          where: { status: "TERMINE" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const top = users.map((u) => {
      const avgRating = u.reviewsReceived.length > 0
        ? Math.round(
            (u.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / u.reviewsReceived.length) * 10
          ) / 10
        : 0;
      const completedOrders = u.ordersAsFreelance.length;
      const skills = u.freelancerProfile?.skills?.slice(0, 3) ?? [];

      return {
        id: u.id,
        // Use ID as username fallback — the public freelance API searches by ID, name slug, AND email prefix
        username: u.id,
        name: u.name,
        title: u.freelancerProfile?.title ?? "Freelance",
        rating: avgRating,
        skills,
        dailyRateEur: u.freelancerProfile?.hourlyRate ?? 0,
        completedOrders,
        reviewCount: u.reviewsReceived.length,
        badge: avgRating >= 4.5 && completedOrders >= 5 ? "ELITE" : avgRating >= 4.0 ? "TOP RATED" : "",
        image: u.image ?? "",
        location: u.country ?? "",
      };
    });

    return NextResponse.json({ freelances: top });
  } catch (error) {
    console.error("[API /public/top-freelances GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des top freelances" },
      { status: 500 }
    );
  }
}
