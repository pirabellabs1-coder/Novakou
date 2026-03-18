// POST /api/marketing/affiliate/click — Track a client-side affiliate click
//
// Called by the AffiliateTracker component when a user visits with ?ref=CODE.
// This is the client-side counterpart to the server-side GET /api/marketing/affiliate/track.

import { NextRequest, NextResponse } from "next/server";
import { trackClick } from "@/lib/marketing/affiliate-tracker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      affiliateCode,
      visitorId,
      landingPage,
      referer,
      userAgent,
    } = body;

    if (!affiliateCode || !visitorId) {
      return NextResponse.json(
        { error: "affiliateCode et visitorId sont requis" },
        { status: 400 }
      );
    }

    // Validate affiliate code format
    if (
      typeof affiliateCode !== "string" ||
      affiliateCode.length < 6 ||
      affiliateCode.length > 12
    ) {
      return NextResponse.json(
        { error: "Code affilie invalide" },
        { status: 400 }
      );
    }

    // Extract IP from request headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Track the click via the affiliate tracker module
    await trackClick(affiliateCode, visitorId, {
      ip,
      userAgent: userAgent || req.headers.get("user-agent") || "",
      referer: referer || req.headers.get("referer") || "",
      landingPage: landingPage || "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/marketing/affiliate/click]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
