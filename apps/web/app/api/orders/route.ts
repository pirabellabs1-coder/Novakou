import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore } from "@/lib/dev/data-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");

    let orders;
    if (session.user.role === "freelance") {
      orders = orderStore.getByFreelance(session.user.id);
    } else if (session.user.role === "client") {
      orders = orderStore.getByClient(session.user.id);
    } else {
      // Admin or agence — return all orders for the user across both roles
      const freelanceOrders = orderStore.getByFreelance(session.user.id);
      const clientOrders = orderStore.getByClient(session.user.id);
      const seen = new Set<string>();
      orders = [];
      for (const o of [...freelanceOrders, ...clientOrders]) {
        if (!seen.has(o.id)) {
          seen.add(o.id);
          orders.push(o);
        }
      }
    }

    if (statusFilter) {
      orders = orders.filter((o) => o.status === statusFilter);
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[API /orders GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des commandes" },
      { status: 500 }
    );
  }
}
