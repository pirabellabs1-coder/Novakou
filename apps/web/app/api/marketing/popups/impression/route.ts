// POST /api/marketing/popups/impression — Record popup impression / interaction
// Body: { popupId, action: "view"|"click"|"close"|"convert", userId?, visitorId? }
// Increments popup stats counters

import { NextRequest, NextResponse } from "next/server";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// In-memory counters for dev mode
const devCounters: Record<string, { views: number; clicks: number; closes: number; conversions: number }> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { popupId, action, userId, visitorId } = body;

    if (!popupId || typeof popupId !== "string") {
      return NextResponse.json({ error: "popupId requis" }, { status: 400 });
    }

    const validActions = ["view", "click", "close", "convert"];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    if (DEV_MODE) {
      if (!devCounters[popupId]) {
        devCounters[popupId] = { views: 0, clicks: 0, closes: 0, conversions: 0 };
      }

      switch (action) {
        case "view":
          devCounters[popupId].views++;
          break;
        case "click":
          devCounters[popupId].clicks++;
          break;
        case "close":
          devCounters[popupId].closes++;
          break;
        case "convert":
          devCounters[popupId].conversions++;
          break;
      }

      return NextResponse.json({
        success: true,
        counters: devCounters[popupId],
      });
    }

    // Production: record impression and update popup counters atomically
    const prisma = (await import("@freelancehigh/db")).default;

    // Create impression record
    await prisma.popupImpression.create({
      data: {
        popupId,
        action,
        userId: userId || null,
        visitorId: visitorId || null,
      },
    });

    // Update popup stats counters
    const incrementField: Record<string, string> = {
      view: "impressions",
      click: "clicks",
      convert: "conversions",
    };

    const field = incrementField[action];
    if (field) {
      await prisma.marketingPopup.update({
        where: { id: popupId },
        data: {
          [field]: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/marketing/popups/impression]", error);
    // Fire-and-forget: return success even on error to avoid blocking the UI
    return NextResponse.json({ success: true });
  }
}
