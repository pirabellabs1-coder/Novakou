import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackingStore } from "@/lib/tracking/tracking-store";
import type { TrackingSession } from "@/lib/tracking/types";
import { getCountryFromRequest } from "@/lib/tracking/geo";

const BOT_UA_RE = /bot|crawl|spider|headless|facebookexternalhit|whatsapp|telegram|slack|linkedinbot|preview/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, userId, deviceType, path, referrer, utmSource, utmMedium, utmCampaign } = body;

    if (!sessionId || !action) {
      // Return 200 with ok:false to avoid noisy client errors
      return NextResponse.json({ ok: false, reason: "Missing sessionId or action" });
    }

    const now = new Date().toISOString();
    const country = getCountryFromRequest(req);
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const isBot = !userAgent || BOT_UA_RE.test(userAgent);

    switch (action) {
      case "start": {
        const session: TrackingSession = {
          id: sessionId,
          userId,
          startedAt: now,
          lastActiveAt: now,
          pageViews: 0,
          entryPath: path || "/",
          deviceType: deviceType || "desktop",
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          country,
        };
        trackingStore.upsertSession(session);
        // Persist to DB (best-effort)
        prisma.trackingSessionLog
          .upsert({
            where: { id: sessionId },
            create: {
              id: sessionId,
              userId: userId ?? null,
              entryPath: path || "/",
              deviceType: deviceType || "desktop",
              referrer: referrer ?? null,
              utmSource: utmSource ?? null,
              utmMedium: utmMedium ?? null,
              utmCampaign: utmCampaign ?? null,
              country: country ?? null,
              userAgent: userAgent ?? null,
              isBot,
            },
            update: { lastActiveAt: new Date(now) },
          })
          .catch(() => null);
        break;
      }
      case "heartbeat": {
        const sessions = trackingStore.getSessions();
        const existing = sessions.find((s) => s.id === sessionId);
        if (existing) {
          trackingStore.upsertSession({
            ...existing,
            lastActiveAt: now,
            // DO NOT increment pageViews on heartbeat — only update lastActiveAt and exitPath
            exitPath: path,
            userId: userId || existing.userId,
            country: existing.country || country,
          });
        }
        prisma.trackingSessionLog
          .update({
            where: { id: sessionId },
            data: {
              lastActiveAt: new Date(now),
              exitPath: path ?? undefined,
              userId: userId ?? undefined,
            },
          })
          .catch(() => null);
        break;
      }
      case "end": {
        trackingStore.endSession(sessionId);
        prisma.trackingSessionLog
          .update({
            where: { id: sessionId },
            data: { endedAt: new Date(now), exitPath: path ?? undefined },
          })
          .catch(() => null);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Return 200 silently to avoid polluting client console
    return NextResponse.json({ ok: false });
  }
}
