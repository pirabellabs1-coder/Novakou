// POST /api/marketing/funnels/[id]/events — Record a funnel event (view, click, purchase, skip)
// GET /api/marketing/funnels/[id]/events — Get funnel analytics (views, conversions per step, revenue)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// -- Types ------------------------------------------------------------------

type FunnelEventType = "view" | "click" | "purchase" | "skip";

interface MockFunnelEvent {
  id: string;
  funnelId: string;
  stepIndex: number;
  stepType: string;
  eventType: FunnelEventType;
  visitorId: string;
  revenue: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface StepAnalytics {
  stepIndex: number;
  stepType: string;
  stepTitle: string;
  views: number;
  clicks: number;
  purchases: number;
  skips: number;
  revenue: number;
  conversionRate: number;
  dropOffRate: number;
}

// -- Mock event store --------------------------------------------------------

const devEvents: MockFunnelEvent[] = [
  // Funnel 001 events: simulate a realistic distribution
  ...generateMockEvents("funnel_001", [
    { stepIndex: 0, stepType: "LANDING", views: 1842, clicks: 923, purchases: 0, skips: 0 },
    { stepIndex: 1, stepType: "PRODUCT", views: 923, clicks: 412, purchases: 147, skips: 364 },
    { stepIndex: 2, stepType: "UPSELL", views: 147, clicks: 89, purchases: 52, skips: 95 },
    { stepIndex: 3, stepType: "DOWNSELL", views: 95, clicks: 43, purchases: 28, skips: 67 },
    { stepIndex: 4, stepType: "CONFIRMATION", views: 227, clicks: 227, purchases: 0, skips: 0 },
    { stepIndex: 5, stepType: "THANK_YOU", views: 227, clicks: 0, purchases: 0, skips: 0 },
  ]),
  // Funnel 002 events
  ...generateMockEvents("funnel_002", [
    { stepIndex: 0, stepType: "LANDING", views: 956, clicks: 412, purchases: 0, skips: 0 },
    { stepIndex: 1, stepType: "PRODUCT", views: 412, clicks: 198, purchases: 68, skips: 146 },
    { stepIndex: 2, stepType: "UPSELL", views: 68, clicks: 31, purchases: 19, skips: 49 },
    { stepIndex: 3, stepType: "CONFIRMATION", views: 87, clicks: 87, purchases: 0, skips: 0 },
    { stepIndex: 4, stepType: "THANK_YOU", views: 87, clicks: 0, purchases: 0, skips: 0 },
  ]),
];

function generateMockEvents(
  funnelId: string,
  stepData: Array<{ stepIndex: number; stepType: string; views: number; clicks: number; purchases: number; skips: number }>,
): MockFunnelEvent[] {
  const events: MockFunnelEvent[] = [];
  let counter = 0;

  for (const step of stepData) {
    for (let i = 0; i < Math.min(step.views, 5); i++) {
      events.push({
        id: `evt_${funnelId}_${counter++}`,
        funnelId,
        stepIndex: step.stepIndex,
        stepType: step.stepType,
        eventType: "view",
        visitorId: `visitor_${Math.random().toString(36).substring(2, 8)}`,
        revenue: 0,
        metadata: {},
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    for (let i = 0; i < Math.min(step.clicks, 3); i++) {
      events.push({
        id: `evt_${funnelId}_${counter++}`,
        funnelId,
        stepIndex: step.stepIndex,
        stepType: step.stepType,
        eventType: "click",
        visitorId: `visitor_${Math.random().toString(36).substring(2, 8)}`,
        revenue: 0,
        metadata: {},
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  return events;
}

// Step-level analytics data (pre-calculated for mock to avoid heavy computation)
const MOCK_STEP_ANALYTICS: Record<string, StepAnalytics[]> = {};

// -- GET — Funnel analytics --------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (DEV_MODE) {
      const stepAnalytics = MOCK_STEP_ANALYTICS[id];
      if (!stepAnalytics) {
        return NextResponse.json({ error: "Funnel non trouve" }, { status: 404 });
      }

      const totalViews = stepAnalytics[0]?.views || 0;
      const totalPurchases = stepAnalytics.reduce((sum: number, s: StepAnalytics) => sum + s.purchases, 0);
      const totalRevenue = stepAnalytics.reduce((sum: number, s: StepAnalytics) => sum + s.revenue, 0);

      return NextResponse.json({
        funnelId: id,
        summary: {
          totalViews,
          totalPurchases,
          totalRevenue,
          overallConversionRate: totalViews > 0 ? ((totalPurchases / totalViews) * 100).toFixed(2) : "0",
          avgOrderValue: totalPurchases > 0 ? (totalRevenue / totalPurchases).toFixed(2) : "0",
        },
        steps: stepAnalytics,
        recentEvents: devEvents
          .filter((e: MockFunnelEvent) => e.funnelId === id)
          .sort((a: MockFunnelEvent, b: MockFunnelEvent) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20),
      });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const funnel = await db.salesFunnel.findFirst({
      where: { id, instructeurId: instructeur.id },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (!funnel) {
      return NextResponse.json({ error: "Funnel non trouve" }, { status: 404 });
    }

    // Aggregate events by step
    const events = await db.salesFunnelEvent.findMany({
      where: { funnelId: id },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stepAnalytics: StepAnalytics[] = funnel.steps.map((step: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stepEvents = events.filter((e: any) => e.stepIndex === step.order);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const views = stepEvents.filter((e: any) => e.eventType === "view").length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clicks = stepEvents.filter((e: any) => e.eventType === "click").length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const purchases = stepEvents.filter((e: any) => e.eventType === "purchase").length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const skips = stepEvents.filter((e: any) => e.eventType === "skip").length;
      const revenue = stepEvents
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((e: any) => e.eventType === "purchase")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce((sum: number, e: any) => sum + (e.revenue || 0), 0);

      return {
        stepIndex: step.order,
        stepType: step.type,
        stepTitle: step.title,
        views,
        clicks,
        purchases,
        skips,
        revenue,
        conversionRate: views > 0 ? (clicks / views) * 100 : 0,
        dropOffRate: 0,
      };
    });

    // Calculate drop-off rates
    for (let i = 1; i < stepAnalytics.length; i++) {
      const prev = stepAnalytics[i - 1];
      const curr = stepAnalytics[i];
      curr.dropOffRate = prev.views > 0 ? ((prev.views - curr.views) / prev.views) * 100 : 0;
    }

    const totalViews = stepAnalytics[0]?.views || 0;
    const totalPurchases = stepAnalytics.reduce((sum: number, s: StepAnalytics) => sum + s.purchases, 0);
    const totalRevenue = stepAnalytics.reduce((sum: number, s: StepAnalytics) => sum + s.revenue, 0);

    return NextResponse.json({
      funnelId: id,
      summary: {
        totalViews,
        totalPurchases,
        totalRevenue,
        overallConversionRate: totalViews > 0 ? ((totalPurchases / totalViews) * 100).toFixed(2) : "0",
        avgOrderValue: totalPurchases > 0 ? (totalRevenue / totalPurchases).toFixed(2) : "0",
      },
      steps: stepAnalytics,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentEvents: events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20),
    });
  } catch (error) {
    console.error("[GET /api/marketing/funnels/[id]/events]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// -- POST — Record funnel event ----------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { stepIndex, stepType, eventType, visitorId, revenue, metadata } = body;

    // Validation
    const validEventTypes: FunnelEventType[] = ["view", "click", "purchase", "skip"];
    if (!eventType || !validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: "Type d'evenement invalide" }, { status: 400 });
    }

    if (typeof stepIndex !== "number" || stepIndex < 0) {
      return NextResponse.json({ error: "Index d'etape invalide" }, { status: 400 });
    }

    if (DEV_MODE) {
      const event: MockFunnelEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        funnelId: id,
        stepIndex,
        stepType: stepType || "UNKNOWN",
        eventType,
        visitorId: visitorId || `anon_${Math.random().toString(36).substring(2, 8)}`,
        revenue: revenue || 0,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
      };

      devEvents.push(event);

      // Update step analytics in mock store
      if (MOCK_STEP_ANALYTICS[id]) {
        const stepStats = MOCK_STEP_ANALYTICS[id].find((s: StepAnalytics) => s.stepIndex === stepIndex);
        if (stepStats) {
          if (eventType === "view") stepStats.views++;
          if (eventType === "click") stepStats.clicks++;
          if (eventType === "purchase") {
            stepStats.purchases++;
            stepStats.revenue += revenue || 0;
          }
          if (eventType === "skip") stepStats.skips++;
        }
      }

      return NextResponse.json({ event }, { status: 201 });
    }

    // Production
    const prisma = (await import("@freelancehigh/db")).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;

    const funnel = await db.salesFunnel.findUnique({ where: { id } });
    if (!funnel) {
      return NextResponse.json({ error: "Funnel non trouve" }, { status: 404 });
    }

    const event = await db.salesFunnelEvent.create({
      data: {
        funnelId: id,
        stepIndex,
        stepType: stepType || "UNKNOWN",
        eventType,
        visitorId: visitorId || `anon_${Math.random().toString(36).substring(2, 8)}`,
        revenue: revenue || 0,
        metadata: metadata || {},
      },
    });

    // Update funnel aggregate stats
    const updateData: Record<string, unknown> = {};
    if (eventType === "view") updateData.totalViews = { increment: 1 };
    if (eventType === "click") updateData.totalClicks = { increment: 1 };
    if (eventType === "purchase") {
      updateData.totalPurchases = { increment: 1 };
      updateData.totalRevenue = { increment: revenue || 0 };
    }
    if (eventType === "skip") updateData.totalSkips = { increment: 1 };

    await db.salesFunnel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/funnels/[id]/events]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
