// GET /api/marketing/campaigns/[slug] — Redirect handler with click tracking
// Records: IP, user-agent, referer, timestamp. Sets visitor cookie for attribution.

import { NextRequest, NextResponse } from "next/server";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// ── Mock campaign lookup (references same data as parent route) ──────────────

interface MockCampaign {
  id: string;
  slug: string;
  name: string;
  destinationUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  isActive: boolean;
}

const MOCK_CAMPAIGNS: MockCampaign[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDestinationUrl(
  origin: string,
  destinationUrl: string,
  utmSource: string,
  utmMedium: string,
  utmCampaign: string,
  utmContent: string | null,
): string {
  // Build full URL with UTM parameters
  const isAbsolute = destinationUrl.startsWith("http");
  const baseUrl = isAbsolute ? destinationUrl : `${origin}${destinationUrl}`;

  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", utmSource);
  url.searchParams.set("utm_medium", utmMedium);
  url.searchParams.set("utm_campaign", utmCampaign);
  if (utmContent) {
    url.searchParams.set("utm_content", utmContent);
  }

  return url.toString();
}

function getVisitorId(req: NextRequest): string | null {
  return req.cookies.get("fh_visitor")?.value || null;
}

function generateVisitorId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "v_";
  for (let i = 0; i < 16; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// ── GET (redirect with tracking) ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const origin = new URL(req.url).origin;

    // Extract tracking info
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referer = req.headers.get("referer") || null;
    const timestamp = new Date().toISOString();
    let visitorId = getVisitorId(req);
    const isNewVisitor = !visitorId;
    if (!visitorId) {
      visitorId = generateVisitorId();
    }

    if (DEV_MODE) {
      const campaign = MOCK_CAMPAIGNS.find((c) => c.slug === slug);

      if (!campaign) {
        // Campaign not found, redirect to homepage
        return NextResponse.redirect(new URL("/", origin));
      }

      if (!campaign.isActive) {
        // Campaign inactive, redirect to destination without tracking
        const destUrl = campaign.destinationUrl.startsWith("http")
          ? campaign.destinationUrl
          : `${origin}${campaign.destinationUrl}`;
        return NextResponse.redirect(new URL(destUrl));
      }

      // Log click (dev mode)
      console.log(`[Campaign Click] slug=${slug} ip=${ip} ua=${userAgent.substring(0, 50)} ref=${referer} visitor=${visitorId} new=${isNewVisitor} at=${timestamp}`);

      // Build destination URL with UTM params
      const redirectUrl = buildDestinationUrl(
        origin,
        campaign.destinationUrl,
        campaign.utmSource,
        campaign.utmMedium,
        campaign.utmCampaign,
        campaign.utmContent,
      );

      const response = NextResponse.redirect(new URL(redirectUrl));

      // Set visitor cookie for attribution (30 days)
      response.cookies.set("fh_visitor", visitorId, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });

      // Set campaign attribution cookie (7 days)
      response.cookies.set("fh_campaign", JSON.stringify({
        id: campaign.id,
        slug: campaign.slug,
        source: campaign.utmSource,
        medium: campaign.utmMedium,
        campaign: campaign.utmCampaign,
        content: campaign.utmContent,
        clickedAt: timestamp,
      }), {
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }

    // ── Production ──
    const prisma = (await import("@freelancehigh/db")).default;

    const campaign = await prisma.campaignTracker.findUnique({
      where: { slug },
    });

    if (!campaign) {
      return NextResponse.redirect(new URL("/", origin));
    }

    if (!campaign.isActive) {
      const destUrl = campaign.destinationUrl.startsWith("http")
        ? campaign.destinationUrl
        : `${origin}${campaign.destinationUrl}`;
      return NextResponse.redirect(new URL(destUrl));
    }

    // Record click
    await prisma.campaignClick.create({
      data: {
        campaignId: campaign.id,
        visitorId,
        ip,
        userAgent,
        referer,
      },
    });

    // Update last click timestamp
    await prisma.campaignTracker.update({
      where: { id: campaign.id },
      data: { lastClickAt: new Date() },
    });

    // Build destination URL with UTM params
    const redirectUrl = buildDestinationUrl(
      origin,
      campaign.destinationUrl,
      campaign.utmSource,
      campaign.utmMedium,
      campaign.utmCampaign,
      campaign.utmContent,
    );

    const response = NextResponse.redirect(new URL(redirectUrl));

    // Set visitor cookie
    response.cookies.set("fh_visitor", visitorId, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    // Set campaign attribution cookie
    response.cookies.set("fh_campaign", JSON.stringify({
      id: campaign.id,
      slug: campaign.slug,
      source: campaign.utmSource,
      medium: campaign.utmMedium,
      campaign: campaign.utmCampaign,
      content: campaign.utmContent,
      clickedAt: timestamp,
    }), {
      maxAge: 7 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("[GET /api/marketing/campaigns/[slug]]", error);
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(new URL("/", origin));
  }
}
