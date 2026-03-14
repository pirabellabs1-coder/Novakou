import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore } from "@/lib/dev/data-store";

// GET /api/admin/orders — List all platform orders
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const orders = orderStore.getAll();

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        serviceId: o.serviceId,
        serviceTitle: o.serviceTitle,
        category: o.category,
        clientId: o.clientId,
        clientName: o.clientName,
        clientCountry: o.clientCountry,
        freelanceId: o.freelanceId,
        status: o.status,
        amount: o.amount,
        commission: o.commission,
        packageType: o.packageType,
        deadline: o.deadline,
        deliveredAt: o.deliveredAt,
        completedAt: o.completedAt,
        progress: o.progress,
        revisionsLeft: o.revisionsLeft,
        reviewed: o.reviewed ?? false,
        messagesCount: o.messages.length,
        filesCount: o.files.length,
        timelineCount: o.timeline.length,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      total: orders.length,
    });
  } catch (error) {
    console.error("[API /admin/orders GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des commandes" },
      { status: 500 }
    );
  }
}
