// GET /api/marketing/popups — List popups (instructor gets all with stats, public gets active only)
// POST /api/marketing/popups — Create a new popup
// PUT /api/marketing/popups — Update a popup (toggle active, update content)
// DELETE /api/marketing/popups — Delete a popup

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// ── DEV MOCK DATA ──────────────────────────────────────────────────────────

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

type PopupType = "DISCOUNT" | "EMAIL_CAPTURE" | "ANNOUNCEMENT" | "UPSELL" | "COUNTDOWN";
type PopupTrigger = "EXIT_INTENT" | "TIME_DELAY" | "SCROLL_PERCENT" | "PAGE_VIEW_COUNT" | "MANUAL";

interface MockPopup {
  id: string;
  instructeurId: string;
  name: string;
  type: PopupType;
  trigger: PopupTrigger;
  triggerValue: number | null;
  headlineFr: string;
  headlineEn: string;
  bodyFr: string;
  bodyEn: string;
  ctaTextFr: string;
  ctaTextEn: string;
  imageBannerUrl: string | null;
  // Type-specific fields
  discountCode: string | null;
  emailCaptureTag: string | null;
  countdownEndsAt: string | null;
  upsellProductId: string | null;
  upsellOriginalPrice: number | null;
  upsellDiscountedPrice: number | null;
  ctaUrl: string | null;
  // Targeting
  showOnPages: string[];
  excludePages: string[];
  newVisitorsOnly: boolean;
  maxShowsPerUser: number;
  // Stats
  impressions: number;
  clicks: number;
  conversions: number;
  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const MOCK_POPUPS: MockPopup[] = [];

let devPopups = [...MOCK_POPUPS];

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope");

    if (DEV_MODE) {
      // Public scope: return only active popups with minimal data
      if (scope === "public") {
        const activePopups = devPopups
          .filter((p) => p.isActive)
          .map((p) => ({
            id: p.id,
            type: p.type,
            trigger: p.trigger,
            triggerValue: p.triggerValue,
            headlineFr: p.headlineFr,
            headlineEn: p.headlineEn,
            bodyFr: p.bodyFr,
            bodyEn: p.bodyEn,
            ctaTextFr: p.ctaTextFr,
            ctaTextEn: p.ctaTextEn,
            imageBannerUrl: p.imageBannerUrl,
            discountCode: p.discountCode,
            emailCaptureTag: p.emailCaptureTag,
            countdownEndsAt: p.countdownEndsAt,
            upsellProductId: p.upsellProductId,
            upsellOriginalPrice: p.upsellOriginalPrice,
            upsellDiscountedPrice: p.upsellDiscountedPrice,
            ctaUrl: p.ctaUrl,
            showOnPages: p.showOnPages,
            excludePages: p.excludePages,
            newVisitorsOnly: p.newVisitorsOnly,
            maxShowsPerUser: p.maxShowsPerUser,
          }));

        return NextResponse.json({ popups: activePopups });
      }

      // Instructor scope: return all popups with stats
      const totalImpressions = devPopups.reduce((s, p) => s + p.impressions, 0);
      const totalConversions = devPopups.reduce((s, p) => s + p.conversions, 0);

      return NextResponse.json({
        popups: devPopups,
        stats: {
          totalPopups: devPopups.length,
          activePopups: devPopups.filter((p) => p.isActive).length,
          totalImpressions,
          totalConversions,
          avgConversionRate:
            totalImpressions > 0
              ? ((totalConversions / totalImpressions) * 100).toFixed(1)
              : "0",
        },
      });
    }

    // Production
    const session = await getServerSession(authOptions);

    if (scope === "public") {
      try {
        const prisma = (await import("@freelancehigh/db")).default;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const popups = await (prisma as any).marketingPopup.findMany({
          where: { isActive: true },
          select: {
            id: true, type: true, trigger: true, triggerValue: true,
            headlineFr: true, headlineEn: true, bodyFr: true, bodyEn: true,
            ctaTextFr: true, ctaTextEn: true, imageBannerUrl: true,
            discountCode: true, emailCaptureTag: true, countdownEndsAt: true,
            upsellProductId: true, upsellOriginalPrice: true, upsellDiscountedPrice: true,
            ctaUrl: true, showOnPages: true, excludePages: true,
            newVisitorsOnly: true, maxShowsPerUser: true,
          },
        });
        return NextResponse.json({ popups });
      } catch {
        // Model may not exist yet in production schema — return empty
        return NextResponse.json({ popups: [] });
      }
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const popups = await prisma.marketingPopup.findMany({
      where: { instructeurId: instructeur.id },
      orderBy: { createdAt: "desc" },
    });

    const totalImpressions = popups.reduce((s, p) => s + p.impressions, 0);
    const totalConversions = popups.reduce((s, p) => s + p.conversions, 0);

    return NextResponse.json({
      popups,
      stats: {
        totalPopups: popups.length,
        activePopups: popups.filter((p) => p.isActive).length,
        totalImpressions,
        totalConversions,
        avgConversionRate:
          totalImpressions > 0
            ? ((totalConversions / totalImpressions) * 100).toFixed(1)
            : "0",
      },
    });
  } catch (error) {
    console.error("[GET /api/marketing/popups]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      type,
      trigger,
      triggerValue,
      headlineFr,
      headlineEn,
      bodyFr,
      bodyEn,
      ctaTextFr,
      ctaTextEn,
      imageBannerUrl,
      discountCode,
      emailCaptureTag,
      countdownEndsAt,
      upsellProductId,
      upsellOriginalPrice,
      upsellDiscountedPrice,
      ctaUrl,
      showOnPages,
      excludePages,
      newVisitorsOnly,
      maxShowsPerUser,
    } = body;

    // Validation
    if (!name || typeof name !== "string" || name.length < 2) {
      return NextResponse.json(
        { error: "Le nom du popup doit contenir au moins 2 caracteres" },
        { status: 400 },
      );
    }

    const validTypes: PopupType[] = ["DISCOUNT", "EMAIL_CAPTURE", "ANNOUNCEMENT", "UPSELL", "COUNTDOWN"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: "Type de popup invalide" }, { status: 400 });
    }

    const validTriggers: PopupTrigger[] = ["EXIT_INTENT", "TIME_DELAY", "SCROLL_PERCENT", "PAGE_VIEW_COUNT", "MANUAL"];
    if (!trigger || !validTriggers.includes(trigger)) {
      return NextResponse.json({ error: "Declencheur invalide" }, { status: 400 });
    }

    if (["TIME_DELAY", "SCROLL_PERCENT", "PAGE_VIEW_COUNT"].includes(trigger)) {
      if (typeof triggerValue !== "number" || triggerValue <= 0) {
        return NextResponse.json(
          { error: "La valeur du declencheur doit etre un nombre positif" },
          { status: 400 },
        );
      }
    }

    if (!headlineFr || !ctaTextFr) {
      return NextResponse.json(
        { error: "Le titre et le texte du CTA en francais sont obligatoires" },
        { status: 400 },
      );
    }

    if (type === "DISCOUNT" && !discountCode) {
      return NextResponse.json(
        { error: "Un code de reduction est requis pour un popup de type DISCOUNT" },
        { status: 400 },
      );
    }

    if (type === "EMAIL_CAPTURE" && !emailCaptureTag) {
      return NextResponse.json(
        { error: "Un tag de capture est requis pour un popup de type EMAIL_CAPTURE" },
        { status: 400 },
      );
    }

    if (type === "COUNTDOWN" && !countdownEndsAt) {
      return NextResponse.json(
        { error: "Une date de fin est requise pour un popup de type COUNTDOWN" },
        { status: 400 },
      );
    }

    if (DEV_MODE) {
      const newPopup: MockPopup = {
        id: `popup_${String(devPopups.length + 1).padStart(3, "0")}`,
        instructeurId: "inst_001",
        name,
        type,
        trigger,
        triggerValue: triggerValue ?? null,
        headlineFr,
        headlineEn: headlineEn || "",
        bodyFr: bodyFr || "",
        bodyEn: bodyEn || "",
        ctaTextFr,
        ctaTextEn: ctaTextEn || "",
        imageBannerUrl: imageBannerUrl || null,
        discountCode: discountCode || null,
        emailCaptureTag: emailCaptureTag || null,
        countdownEndsAt: countdownEndsAt || null,
        upsellProductId: upsellProductId || null,
        upsellOriginalPrice: upsellOriginalPrice || null,
        upsellDiscountedPrice: upsellDiscountedPrice || null,
        ctaUrl: ctaUrl || null,
        showOnPages: showOnPages || [],
        excludePages: excludePages || [],
        newVisitorsOnly: newVisitorsOnly ?? false,
        maxShowsPerUser: maxShowsPerUser ?? 3,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      devPopups.push(newPopup);
      return NextResponse.json({ popup: newPopup }, { status: 201 });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const popup = await prisma.marketingPopup.create({
      data: {
        instructeurId: instructeur.id,
        name,
        type,
        trigger,
        triggerValue: triggerValue ?? null,
        headlineFr,
        headlineEn: headlineEn || "",
        bodyFr: bodyFr || "",
        bodyEn: bodyEn || "",
        ctaTextFr,
        ctaTextEn: ctaTextEn || "",
        imageBannerUrl: imageBannerUrl || null,
        discountCode: discountCode || null,
        emailCaptureTag: emailCaptureTag || null,
        countdownEndsAt: countdownEndsAt ? new Date(countdownEndsAt) : null,
        upsellProductId: upsellProductId || null,
        upsellOriginalPrice: upsellOriginalPrice || null,
        upsellDiscountedPrice: upsellDiscountedPrice || null,
        ctaUrl: ctaUrl || null,
        showOnPages: showOnPages || [],
        excludePages: excludePages || [],
        newVisitorsOnly: newVisitorsOnly ?? false,
        maxShowsPerUser: maxShowsPerUser ?? 3,
      },
    });

    return NextResponse.json({ popup }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/popups]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID du popup requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const idx = devPopups.findIndex((p) => p.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Popup non trouve" }, { status: 404 });
      }

      devPopups[idx] = {
        ...devPopups[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ popup: devPopups[idx] });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const existing = await prisma.marketingPopup.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Popup non trouve" }, { status: 404 });
    }

    // Build safe update object
    const allowedFields = [
      "name", "type", "trigger", "triggerValue",
      "headlineFr", "headlineEn", "bodyFr", "bodyEn",
      "ctaTextFr", "ctaTextEn", "imageBannerUrl",
      "discountCode", "emailCaptureTag", "countdownEndsAt",
      "upsellProductId", "upsellOriginalPrice", "upsellDiscountedPrice",
      "ctaUrl", "showOnPages", "excludePages",
      "newVisitorsOnly", "maxShowsPerUser", "isActive",
    ];

    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    if (safeUpdates.countdownEndsAt && typeof safeUpdates.countdownEndsAt === "string") {
      safeUpdates.countdownEndsAt = new Date(safeUpdates.countdownEndsAt as string);
    }

    const popup = await prisma.marketingPopup.update({
      where: { id },
      data: safeUpdates,
    });

    return NextResponse.json({ popup });
  } catch (error) {
    console.error("[PUT /api/marketing/popups]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID du popup requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const idx = devPopups.findIndex((p) => p.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Popup non trouve" }, { status: 404 });
      }

      devPopups.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const existing = await prisma.marketingPopup.findFirst({
      where: { id, instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Popup non trouve" }, { status: 404 });
    }

    await prisma.marketingPopup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/popups]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
