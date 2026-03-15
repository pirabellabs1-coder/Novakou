import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { orderStore, transactionStore } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";

// GET /api/admin/users — List all users with aggregated stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    if (IS_DEV) {
      const allUsers = devStore.getAll();
      const allOrders = orderStore.getAll();
      const allTransactions = transactionStore.getAll();

      const users = allUsers.map((u) => {
        // Count orders where user is client or freelance
        const userOrders = allOrders.filter(
          (o) => o.clientId === u.id || o.freelanceId === u.id
        );

        // Calculate revenue from completed sales transactions
        const userTransactions = allTransactions.filter(
          (t) => t.userId === u.id && t.type === "vente" && t.status === "complete"
        );
        const revenue = userTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Total spent (for clients) — orders they placed
        const clientOrders = allOrders.filter((o) => o.clientId === u.id);
        const totalSpent = clientOrders
          .filter((o) => o.status === "termine")
          .reduce((sum, o) => sum + o.amount, 0);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          plan: u.plan,
          status: u.status,
          kycLevel: u.kyc,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt ?? null,
          loginCount: u.loginCount,
          ordersCount: userOrders.length,
          revenue: Math.round(revenue * 100) / 100,
          totalSpent: Math.round(totalSpent * 100) / 100,
        };
      });

      return NextResponse.json({ users });
    }

    // Production: Prisma
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        status: true,
        kyc: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            ordersAsClient: true,
            ordersAsFreelance: true,
          },
        },
      },
    });

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      status: u.status,
      kycLevel: u.kyc,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
      loginCount: 0,
      ordersCount: u._count.ordersAsClient + u._count.ordersAsFreelance,
      revenue: 0,
      totalSpent: 0,
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("[API /admin/users GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des utilisateurs" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users — Update user status
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id et status sont requis" },
        { status: 400 }
      );
    }

    if (IS_DEV) {
      const user = devStore.update(id, { status });
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 404 }
        );
      }
      return NextResponse.json({ user });
    }

    // Production: Prisma
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[API /admin/users PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de l'utilisateur" },
      { status: 500 }
    );
  }
}
