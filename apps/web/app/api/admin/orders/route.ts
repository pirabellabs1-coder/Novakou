import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { orderStore } from "@/lib/dev/data-store";

// GET /api/admin/orders — List all platform orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      let orders = orderStore.getAll();
      if (statusFilter) {
        orders = orders.filter((o) => o.status === statusFilter);
      }

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
          freelanceName: o.freelanceName,
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
    }

    // Production: Prisma
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (statusFilter) {
      where.status = statusFilter.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          service: { select: { title: true, categoryId: true, category: { select: { name: true } } } },
          client: { select: { id: true, name: true, country: true, image: true } },
          freelance: { select: { id: true, name: true, country: true, image: true } },
          _count: { select: { reviews: true, payments: true, revisions: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        serviceId: o.serviceId,
        serviceTitle: o.service?.title || o.title || "",
        category: o.service?.category?.name || "",
        clientId: o.clientId,
        clientName: o.client?.name || "",
        clientCountry: o.client?.country || "",
        freelanceId: o.freelanceId,
        freelanceName: o.freelance?.name || "",
        status: o.status.toLowerCase(),
        escrowStatus: o.escrowStatus?.toLowerCase() || null,
        amount: o.amount,
        commission: o.commission || o.platformFee || 0,
        platformFee: o.platformFee || 0,
        freelancerPayout: o.freelancerPayout || 0,
        packageType: o.packageType || "",
        deadline: o.deadline?.toISOString() || null,
        deliveredAt: o.deliveredAt?.toISOString() || null,
        completedAt: o.completedAt?.toISOString() || null,
        progress: o.progress || 0,
        revisionsLeft: o.revisionsLeft ?? 0,
        reviewed: o._count.reviews > 0,
        messagesCount: 0,
        filesCount: 0,
        timelineCount: 0,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
      total,
    });
  } catch (error) {
    console.error("[API /admin/orders GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des commandes" },
      { status: 500 }
    );
  }
}
