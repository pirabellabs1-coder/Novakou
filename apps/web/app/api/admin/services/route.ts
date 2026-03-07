import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { serviceStore } from "@/lib/dev/data-store";

// GET /api/admin/services — List all services for admin moderation
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const services = serviceStore.getAll();

    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.descriptionText?.slice(0, 200) || "",
        category: s.categoryName,
        categoryId: s.categoryId,
        freelanceName: s.vendorName,
        freelanceId: s.userId,
        price: s.basePrice,
        status: s.status,
        views: s.views,
        orders: s.orderCount,
        rating: s.rating,
        refuseReason: s.refuseReason,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("[API /admin/services GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des services" },
      { status: 500 }
    );
  }
}
