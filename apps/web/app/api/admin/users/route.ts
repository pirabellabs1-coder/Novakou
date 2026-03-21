import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { orderStore, transactionStore } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";
import { createAuditLog } from "@/lib/admin/audit";

// GET /api/admin/users — List all users with aggregated stats + server-side filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    // Parse query params for filtering
    const { searchParams } = request.nextUrl;
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const planFilter = searchParams.get("plan");
    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "200");

    if (IS_DEV) {
      const allUsers = devStore.getAll();
      const allOrders = orderStore.getAll();
      const allTransactions = transactionStore.getAll();

      let filtered = allUsers.filter((u) => u.role !== "admin");

      // Apply filters
      if (roleFilter) filtered = filtered.filter((u) => u.role.toLowerCase() === roleFilter.toLowerCase());
      if (statusFilter) filtered = filtered.filter((u) => u.status.toLowerCase() === statusFilter.toLowerCase());
      if (planFilter) filtered = filtered.filter((u) => u.plan.toLowerCase() === planFilter.toLowerCase());
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
        );
      }

      const users = filtered.map((u) => {
        const userOrders = allOrders.filter((o) => o.clientId === u.id || o.freelanceId === u.id);
        const userTransactions = allTransactions.filter((t) => t.userId === u.id && t.type === "vente" && t.status === "complete");
        const revenue = userTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalSpent = allOrders.filter((o) => o.clientId === u.id && o.status === "termine").reduce((sum, o) => sum + o.amount, 0);

        return {
          id: u.id, name: u.name, email: u.email,
          role: u.role.toLowerCase(), plan: u.plan.toLowerCase(),
          status: u.status.toLowerCase(), kycLevel: u.kyc, country: u.country || null,
          createdAt: u.createdAt, lastLoginAt: u.lastLoginAt ?? null,
          loginCount: u.loginCount, ordersCount: userOrders.length,
          revenue: Math.round(revenue * 100) / 100, totalSpent: Math.round(totalSpent * 100) / 100,
        };
      });

      return NextResponse.json({ users, total: filtered.length });
    }

    // Production: Prisma with server-side filtering
    const where: Record<string, unknown> = { role: { not: "ADMIN" } };

    if (roleFilter) where.role = roleFilter.toUpperCase();
    if (statusFilter) where.status = statusFilter.toUpperCase();
    if (planFilter) where.plan = planFilter.toUpperCase();
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          status: true,
          kyc: true,
          country: true,
          loginCount: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              ordersAsClient: true,
              ordersAsFreelance: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase(),
      plan: u.plan.toLowerCase(),
      status: u.status.toLowerCase(),
      kycLevel: u.kyc,
      country: u.country ?? null,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
      loginCount: u.loginCount,
      ordersCount: u._count.ordersAsClient + u._count.ordersAsFreelance,
      revenue: 0,
      totalSpent: 0,
    }));

    return NextResponse.json({ users: result, total });
  } catch (error) {
    console.error("[API /admin/users GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des utilisateurs" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users — Update user status (legacy — use /users/[id] instead)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id et status sont requis" }, { status: 400 });
    }

    if (IS_DEV) {
      const user = devStore.update(id, { status });
      if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      return NextResponse.json({ user });
    }

    const user = await prisma.user.update({ where: { id }, data: { status } });

    // Audit log for user status change
    await createAuditLog({
      actorId: session.user.id,
      action: `user.${status.toLowerCase()}`,
      targetUserId: id,
      details: { newStatus: status },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[API /admin/users PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de la mise a jour de l'utilisateur" }, { status: 500 });
  }
}
