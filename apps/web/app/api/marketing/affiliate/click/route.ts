// POST /api/marketing/affiliate/click — Track a client-side affiliate click
//
// Called by the AffiliateTracker component when a user visits with ?ref=CODE.
// This is the client-side counterpart to the server-side GET /api/marketing/affiliate/track.
//
// Sets fh_aff_code + fh_aff_visitor cookies on the response so any future
// purchase within the cookie window credits this affiliate.

import { NextRequest, NextResponse } from "next/server";
import { trackClick } from "@/lib/marketing/affiliate-tracker";
import { prisma } from "@/lib/prisma";

const FALLBACK_COOKIE_DAYS = 30;

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

    // Track the click via the affiliate tracker module (writes AffiliateClick row)
    await trackClick(affiliateCode, visitorId, {
      ip,
      userAgent: userAgent || req.headers.get("user-agent") || "",
      referer: referer || req.headers.get("referer") || "",
      landingPage: landingPage || "",
    });

    // Look up program-specific cookieDays — fallback 30 if no profile/program
    let cookieDays = FALLBACK_COOKIE_DAYS;
    try {
      const profile = await prisma.affiliateProfile.findUnique({
        where: { affiliateCode },
        select: { program: { select: { cookieDays: true } } },
      });
      if (profile?.program?.cookieDays) cookieDays = profile.program.cookieDays;
    } catch {
      /* keep fallback */
    }

    const response = NextResponse.json({ success: true });
    const maxAge = cookieDays * 24 * 60 * 60;
    const secure = process.env.NODE_ENV === "production";

    // Set attribution cookies — used by checkout to credit commission
    response.cookies.set("fh_aff_code", affiliateCode, {
      maxAge, path: "/", httpOnly: true, secure, sameSite: "lax",
    });
    response.cookies.set("fh_aff_visitor", visitorId, {
      maxAge, path: "/", httpOnly: true, secure, sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[POST /api/marketing/affiliate/click]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
