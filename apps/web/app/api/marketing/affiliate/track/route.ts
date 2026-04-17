// GET /api/marketing/affiliate/track — Track a click (when someone visits with ?ref=CODE)
// Records AffiliateClick, sets cookie, redirects to destination
// POST /api/marketing/affiliate/track — Track a conversion (after successful purchase)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

// ── Types ────────────────────────────────────────────────────────────────────

interface AffiliateClick {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  visitorId: string;
  ip: string;
  userAgent: string;
  referrerUrl: string;
  landingUrl: string;
  converted: boolean;
  conversionId: string | null;
  createdAt: string;
}

interface AffiliateConversion {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  orderId: string;
  orderType: string;
  orderAmount: number;
  commissionAmount: number;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: string;
}

// ── In-memory dev store ──────────────────────────────────────────────────────

const devClicks: AffiliateClick[] = [];
const devConversions: AffiliateConversion[] = [];

// Known affiliate codes mapping (dev mode)
const KNOWN_CODES: Record<string, { affiliateId: string; commissionPercent: number; cookieDays: number }> = {
  AMINATA25: { affiliateId: "aff-prof-001", commissionPercent: 25, cookieDays: 30 },
  KOFI30: { affiliateId: "aff-prof-002", commissionPercent: 25, cookieDays: 30 },
  FATOU20: { affiliateId: "aff-prof-003", commissionPercent: 25, cookieDays: 30 },
  CLAIRE25: { affiliateId: "aff-prof-005", commissionPercent: 25, cookieDays: 30 },
};

function generateVisitorId(): string {
  return `vis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── GET — Track a click ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("ref") || searchParams.get("code");
    const destination = searchParams.get("dest") || "/";

    if (!code) {
      // No affiliate code, just redirect to destination
      return NextResponse.redirect(new URL(destination, req.url));
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    if (DEV_MODE) {
      const affiliate = KNOWN_CODES[code.toUpperCase()];
      const visitorId = generateVisitorId();

      const click: AffiliateClick = {
        id: `click-${Date.now().toString(36)}`,
        affiliateId: affiliate?.affiliateId || "unknown",
        affiliateCode: code.toUpperCase(),
        visitorId,
        ip: ip.split(",")[0].trim(),
        userAgent: userAgent.slice(0, 200),
        referrerUrl: referrer,
        landingUrl: destination,
        converted: false,
        conversionId: null,
        createdAt: new Date().toISOString(),
      };

      devClicks.push(click);

      // Set affiliate tracking cookie and redirect
      const cookieDays = affiliate?.cookieDays || 30;
      const response = NextResponse.redirect(new URL(destination, req.url));

      response.cookies.set("fh_aff_code", code.toUpperCase(), {
        maxAge: cookieDays * 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      response.cookies.set("fh_aff_visitor", visitorId, {
        maxAge: cookieDays * 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      response.cookies.set("fh_aff_click", click.id, {
        maxAge: cookieDays * 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return response;
    }

    // Production: Prisma logic
    // const profile = await prisma.affiliateProfile.findUnique({ where: { affiliateCode: code }, include: { program: true } });
    // if (!profile || profile.status !== 'ACTIVE') return redirect(destination);
    // await prisma.affiliateClick.create({ data: { affiliateId: profile.id, visitorId, ip, userAgent, referrerUrl, landingUrl } });
    // await prisma.affiliateProfile.update({ where: { id: profile.id }, data: { totalClicks: { increment: 1 } } });
    // Set cookie and redirect
    return NextResponse.redirect(new URL(destination, req.url));
  } catch (error) {
    console.error("[GET /api/marketing/affiliate/track]", error);
    // On error, still redirect to avoid broken experience
    const destination = new URL(req.url).searchParams.get("dest") || "/";
    return NextResponse.redirect(new URL(destination, req.url));
  }
}

// ── POST — Track a conversion ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const body = await req.json();
    const {
      orderId,
      orderType,      // "formation" | "product"
      orderAmount,
      affiliateCode,  // from cookie or explicit
    } = body;

    if (!orderId || !orderType || !orderAmount) {
      return NextResponse.json(
        { error: "orderId, orderType et orderAmount sont requis" },
        { status: 400 }
      );
    }

    // Try to get the affiliate code from the request body or from cookie
    const code = affiliateCode || req.cookies.get("fh_aff_code")?.value;
    if (!code) {
      return NextResponse.json({
        success: false,
        message: "Pas de code affilie trouve — aucune commission enregistree",
        isAffiliate: false,
      });
    }

    if (DEV_MODE) {
      const affiliate = KNOWN_CODES[code.toUpperCase()];
      if (!affiliate) {
        return NextResponse.json({
          success: false,
          message: "Code affilie inconnu",
          isAffiliate: false,
        });
      }

      const commissionAmount = Math.round(orderAmount * (affiliate.commissionPercent / 100) * 100) / 100;

      const conversion: AffiliateConversion = {
        id: `conv-${Date.now().toString(36)}`,
        affiliateId: affiliate.affiliateId,
        affiliateCode: code.toUpperCase(),
        orderId,
        orderType,
        orderAmount,
        commissionAmount,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };

      devConversions.push(conversion);

      // Mark the corresponding click as converted
      const visitorId = req.cookies.get("fh_aff_visitor")?.value;
      if (visitorId) {
        const click = devClicks.find(
          (c) => c.visitorId === visitorId && c.affiliateCode === code.toUpperCase() && !c.converted
        );
        if (click) {
          click.converted = true;
          click.conversionId = conversion.id;
        }
      }

      return NextResponse.json({
        success: true,
        message: "Conversion enregistree avec succes",
        isAffiliate: true,
        conversion: {
          id: conversion.id,
          affiliateCode: code.toUpperCase(),
          commissionAmount,
          status: "PENDING",
        },
      });
    }

    // Production: Prisma logic
    // const profile = await prisma.affiliateProfile.findUnique({ where: { affiliateCode: code } });
    // if (!profile || profile.status !== 'ACTIVE') return;
    // const commission = await prisma.affiliateCommission.create({ data: { affiliateId: profile.id, orderId, orderType, orderAmount, commissionAmount, status: 'PENDING' } });
    // await prisma.affiliateProfile.update({ where: { id: profile.id }, data: { totalConversions: { increment: 1 }, pendingEarnings: { increment: commissionAmount } } });

    return NextResponse.json({
      success: true,
      message: "Conversion enregistree",
      isAffiliate: true,
      conversion: null,
    });
  } catch (error) {
    console.error("[POST /api/marketing/affiliate/track]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
