import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { PopupType, PopupTrigger } from "@prisma/client";

import { getInstructeurId as _gii } from "@/lib/formations/instructeur";
async function getProfileId(userId: string) { return _gii(userId); }

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const pid = await getProfileId(userId);
    if (!pid) return NextResponse.json({ data: [] });

    const popups = await prisma.smartPopup.findMany({
      where: { instructeurId: pid },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: popups });
  } catch (err) {
    console.error("[popups GET]", err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const body = await request.json();
    const {
      name, popupType, trigger, delaySeconds, scrollPercent,
      headlineFr, bodyFr, ctaTextFr, imageBanner,
      discountCodeId, showToNewOnly, maxShowsPerUser,
    } = body;

    if (!name || !popupType || !trigger) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const popup = await prisma.smartPopup.create({
      data: {
        instructeurId: pid,
        name: name.trim(),
        popupType: popupType as PopupType,
        trigger: trigger as PopupTrigger,
        delaySeconds: delaySeconds ? parseInt(delaySeconds) : null,
        scrollPercent: scrollPercent ? parseInt(scrollPercent) : null,
        headlineFr: headlineFr?.trim() || null,
        bodyFr: bodyFr?.trim() || null,
        ctaTextFr: ctaTextFr?.trim() || null,
        imageBanner: imageBanner?.trim() || null,
        discountCodeId: discountCodeId || null,
        showToNewOnly: showToNewOnly ?? false,
        maxShowsPerUser: maxShowsPerUser ? parseInt(maxShowsPerUser) : 1,
        isActive: false,
      },
    });

    return NextResponse.json({ data: popup });
  } catch (err) {
    console.error("[popups POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
