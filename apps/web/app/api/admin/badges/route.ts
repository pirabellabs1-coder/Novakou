import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { devStore } from "@/lib/dev/dev-store";
import { orderStore, reviewStore, profileStore } from "@/lib/dev/data-store";
import { computeBadges } from "@/lib/badges";

// GET /api/admin/badges — List users with their computed badges
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

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
  } catch (error) {
    console.error("[API /admin/badges GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/badges — Assign or remove a manual badge
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
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
  } catch (error) {
    console.error("[API /admin/badges POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
