import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { serviceStore } from "@/lib/dev/data-store";
import { createAuditLog } from "@/lib/admin/audit";

// GET /api/admin/services — List all services for admin moderation
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV) {
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
    }

    // Production: Prisma — return ALL services for admin moderation (not just EN_ATTENTE)
    const services = await prisma.service.findMany({
      include: {
        user: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.descriptionText?.slice(0, 200) || "",
        category: s.category?.name ?? "",
        categoryId: s.categoryId,
        freelanceName: s.user?.name ?? "",
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

// PATCH /api/admin/services — Approve or refuse a service
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, refuseReason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id et status sont requis" },
        { status: 400 }
      );
    }

    if (IS_DEV) {
      const service = serviceStore.update(id, { status, refuseReason });
      if (!service) {
        return NextResponse.json(
          { error: "Service introuvable" },
          { status: 404 }
        );
      }
      return NextResponse.json({ service });
    }

    // Production: Prisma
    const data: Record<string, unknown> = { status };
    if (refuseReason) {
      data.refuseReason = refuseReason;
    }

    const service = await prisma.service.update({
      where: { id },
      data,
    });

    // Audit log for service moderation
    await createAuditLog({
      actorId: session.user.id,
      action: `service.${status.toLowerCase()}`,
      targetType: "service",
      targetId: id,
      details: { status, refuseReason },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("[API /admin/services PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour du service" },
      { status: 500 }
    );
  }
}
