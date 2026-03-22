import { NextRequest, NextResponse } from "next/server";
import { trackingStore } from "@/lib/tracking/tracking-store";
import type { TrackingSession } from "@/lib/tracking/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, userId, deviceType, path, referrer, utmSource, utmMedium, utmCampaign } = body;

    if (!sessionId || !action) {
      // Return 200 with ok:false to avoid noisy client errors
      return NextResponse.json({ ok: false, reason: "Missing sessionId or action" });
    }

    const now = new Date().toISOString();

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
        };
        trackingStore.upsertSession(session);
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
          });
        }
        break;
      }
      case "end": {
        trackingStore.endSession(sessionId);
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
