import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getClientInfoFromContext } from "@/lib/auth/client-info";
import { lookupIp, formatLocation } from "@/lib/auth/geo-lookup";

/**
 * GET /api/auth/sessions — recent login history for the current user.
 * Pulls from LoginAttempt (success=true), the last 10 entries, and annotates
 * each with a friendly location string (city, country) via IP geolocation.
 * The current request is flagged so the UI can label it "Actuelle".
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const attempts = await prisma.loginAttempt.findMany({
      where: { userId: session.user.id, success: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    const current = await getClientInfoFromContext();

    // Geo-enrich in parallel (cached for 6h in-process)
    const enriched = await Promise.all(
      attempts.map(async (a) => {
        const ip = a.ipAddress || "Unknown";
        const geo = await lookupIp(ip);
        return {
          id: a.id,
          ipAddress: ip,
          location: formatLocation({
            city: geo.city,
            region: geo.region,
            countryName: geo.countryName,
          }),
          country: geo.country,
          createdAt: a.createdAt.toISOString(),
          isCurrent: ip === current.ip,
        };
      }),
    );

    return NextResponse.json({
      data: {
        current: {
          ip: current.ip,
          browser: current.browser,
          os: current.os,
          device: current.device,
        },
        sessions: enriched,
      },
    });
  } catch (err) {
    console.error("[api/auth/sessions]", err);
    return NextResponse.json({ data: { current: null, sessions: [] } });
  }
}
