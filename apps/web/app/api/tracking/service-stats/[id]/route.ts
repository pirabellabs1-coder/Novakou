import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { trackingStore } from "@/lib/tracking/tracking-store";
import { prisma, IS_DEV } from "@/lib/prisma";
import { serviceStore } from "@/lib/dev/data-store";

// GET /api/tracking/service-stats/[id] — Get tracking stats for a specific service
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;

    // Get the service slug to build the correct URL path
    let serviceSlug = id; // Fallback to ID
    if (IS_DEV) {
      const svc = serviceStore.getById(id);
      if (svc?.slug) serviceSlug = svc.slug;
    } else {
      const svc = await prisma.service.findUnique({ where: { id }, select: { slug: true } });
      if (svc?.slug) serviceSlug = svc.slug;
    }

    const views = trackingStore.getServiceViews(id);
    const conversionData = trackingStore.getConversionRate(id);
    // Use the slug-based path that matches actual tracked URLs
    const avgTime = trackingStore.getAvgTimeOnPage(`/services/${serviceSlug}`);

    return NextResponse.json({
      serviceId: id,
      slug: serviceSlug,
      views,
      avgTimeOnPage: avgTime,
      orders: conversionData.orders,
      conversionRate: conversionData.rate,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
