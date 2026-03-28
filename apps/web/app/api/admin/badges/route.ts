import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { devStore } from "@/lib/dev/dev-store";
import { orderStore, reviewStore, profileStore } from "@/lib/dev/data-store";
import { computeBadges } from "@/lib/badges";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

// GET /api/admin/badges — List users with their computed badges
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const users = devStore.getAll().filter((u) => u.role !== "admin" && u.status === "ACTIF");

      const usersWithBadges = users.map((user) => {
        const orders = orderStore.getByFreelance(user.id);
        const completedOrders = orders.filter((o) => o.status === "termine").length;
        const totalOrders = orders.filter((o) => o.status !== "annule").length;
        const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
        const reviews = reviewStore.getByFreelance(user.id);
        const avgRating = reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
          : 0;

        const badges = computeBadges({
          completedOrders,
          completionRate,
          avgRating,
          kycLevel: user.kyc,
          plan: user.plan,
        });

        const profile = profileStore.get(user.id);
        const manualBadges = (profile?.badges ?? []).filter((b: string) => !badges.includes(b));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          computedBadges: badges,
          manualBadges,
          allBadges: [...badges, ...manualBadges],
          stats: { completedOrders, completionRate, avgRating, reviewCount: reviews.length },
        };
      });

      // Sort by badge count (most badges first)
      usersWithBadges.sort((a, b) => b.allBadges.length - a.allBadges.length);

      return NextResponse.json({
        users: usersWithBadges.slice(0, 100),
        totalWithBadges: usersWithBadges.filter((u) => u.allBadges.length > 0).length,
        totalUsers: usersWithBadges.length,
      });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    try {
      const users = await prisma.user.findMany({
        where: { role: { in: ["FREELANCE", "AGENCE"] } },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          plan: true,
          status: true,
          freelancerProfile: { select: { badges: true } },
        },
        take: 100,
      });

      const usersWithBadges = users.map((user) => {
        const manualBadges = (user.freelancerProfile?.badges ?? []) as string[];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          computedBadges: [] as string[],
          manualBadges,
          allBadges: manualBadges,
          stats: { completedOrders: 0, completionRate: 0, avgRating: 0, reviewCount: 0 },
        };
      });

      usersWithBadges.sort((a, b) => b.allBadges.length - a.allBadges.length);

      return NextResponse.json({
        users: usersWithBadges,
        totalWithBadges: usersWithBadges.filter((u) => u.allBadges.length > 0).length,
        totalUsers: usersWithBadges.length,
      });
    } catch (dbError) {
      console.error("[API /admin/badges GET] Prisma error", dbError);
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /admin/badges GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/badges — Assign or remove a manual badge
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, badge, action } = body;

    if (!userId || !badge || !action) {
      return NextResponse.json({ error: "userId, badge et action requis" }, { status: 400 });
    }

    if (!["add", "remove"].includes(action)) {
      return NextResponse.json({ error: "Action invalide (add ou remove)" }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const profile = profileStore.get(userId);
      if (!profile) {
        return NextResponse.json({ error: "Profil utilisateur introuvable" }, { status: 404 });
      }

      const currentBadges = profile.badges || [];

      if (action === "add") {
        if (currentBadges.includes(badge)) {
          return NextResponse.json({ error: "Badge deja assigne" }, { status: 409 });
        }
        profileStore.update(userId, { badges: [...currentBadges, badge] });
      } else {
        profileStore.update(userId, { badges: currentBadges.filter((b: string) => b !== badge) });
      }

      return NextResponse.json({
        success: true,
        message: action === "add"
          ? `Badge "${badge}" ajoute a l'utilisateur`
          : `Badge "${badge}" retire de l'utilisateur`,
      });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    try {
      const profile = await prisma.freelancerProfile.findUnique({
        where: { userId },
        select: { badges: true },
      });

      if (!profile) {
        return NextResponse.json({ error: "Profil utilisateur introuvable" }, { status: 404 });
      }

      const currentBadges = (profile.badges ?? []) as string[];

      if (action === "add") {
        if (currentBadges.includes(badge)) {
          return NextResponse.json({ error: "Badge deja assigne" }, { status: 409 });
        }
        await prisma.freelancerProfile.update({
          where: { userId },
          data: { badges: [...currentBadges, badge] },
        });
      } else {
        await prisma.freelancerProfile.update({
          where: { userId },
          data: { badges: currentBadges.filter((b) => b !== badge) },
        });
      }

      return NextResponse.json({
        success: true,
        message: action === "add"
          ? `Badge "${badge}" ajoute a l'utilisateur`
          : `Badge "${badge}" retire de l'utilisateur`,
      });
    } catch (dbError) {
      console.error("[API /admin/badges POST] Prisma error", dbError);
      return NextResponse.json({ error: "Erreur base de données" }, { status: 500 });
    }
  } catch (error) {
    console.error("[API /admin/badges POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
