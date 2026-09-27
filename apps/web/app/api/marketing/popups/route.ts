// GET /api/marketing/popups?scope=public&instructeurId=…&shopId=… — pop-ups
// actifs d'UNE boutique, pour le rendu public (components/marketing/SmartPopupRenderer).
//
// Les écritures (création / modification / suppression) ne vivent PAS ici :
// elles passent par /api/formations/vendeur/marketing/popups, seul chemin qui
// filtre sur l'instructeur connecté. Les anciens POST/PUT/DELETE de ce fichier
// écrivaient sur des colonnes inexistantes (`type`, `triggerValue`,
// `impressions`…) : ils levaient une PrismaClientValidationError à chaque appel,
// masquée par un `@ts-nocheck`. Ils répondent désormais 410.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEPRECATED = {
  error: "Endpoint déprécié",
  message: "La gestion des pop-ups passe par /api/formations/vendeur/marketing/popups.",
  replacedBy: [
    "/api/formations/vendeur/marketing/popups",
    "/api/formations/vendeur/marketing/popups/[id]",
  ],
};

export async function GET(req: NextRequest) {
  try {
    // Un pop-up appartient à UN vendeur. Sans cette restriction, chaque vitrine
    // affichait les pop-ups actifs de tous les vendeurs — le code promo d'un
    // créateur s'ouvrait chez un autre (constaté le 2026-09-27 : 10 pop-ups
    // actifs, 7 vendeurs). Sans vendeur précisé, on ne renvoie rien : mieux vaut
    // aucun pop-up que ceux d'autrui.
    const instructeurId = req.nextUrl.searchParams.get("instructeurId");
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!instructeurId) return NextResponse.json({ popups: [] });

    const popupsRaw = await prisma.smartPopup.findMany({
      where: {
        isActive: true,
        instructeurId,
        // Un pop-up sans boutique vaut pour toutes celles du vendeur.
        ...(shopId ? { OR: [{ shopId: null }, { shopId }] } : {}),
      },
      select: {
        id: true,
        popupType: true,
        trigger: true,
        delaySeconds: true,
        scrollPercent: true,
        pageViewCount: true,
        headlineFr: true, headlineEn: true,
        bodyFr: true, bodyEn: true,
        ctaTextFr: true, ctaTextEn: true,
        imageBanner: true,
        discountCodeId: true,
        emailListTag: true,
        showOnPages: true,
        excludePages: true,
        showToNewOnly: true,
        maxShowsPerUser: true,
      },
      take: 20,
    });

    // Le code promo lié : un pop-up « DISCOUNT » sans code affiché ne sert à
    // rien (le visiteur n'a rien à copier). On résout le libellé du code, mais
    // UNIQUEMENT parmi les codes de ce vendeur, encore actifs, non expirés et
    // non épuisés — un identifiant pointant vers le code d'un autre créateur
    // (ou vers un code mort) ne doit jamais s'afficher.
    const codeIds = [...new Set(popupsRaw.map((p) => p.discountCodeId).filter((v): v is string => !!v))];
    const codesById = new Map<string, string>();
    if (codeIds.length > 0) {
      const now = new Date();
      const codes = await prisma.discountCode.findMany({
        where: {
          id: { in: codeIds },
          instructeurId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { id: true, code: true, maxUses: true, usedCount: true },
      });
      for (const c of codes) {
        if (c.maxUses !== null && c.usedCount >= c.maxUses) continue;
        codesById.set(c.id, c.code);
      }
    }

    // Forme attendue par SmartPopupRenderer.
    const popups = popupsRaw.map((p) => ({
      id: p.id,
      type: p.popupType,
      trigger: p.trigger,
      triggerValue: p.delaySeconds ?? p.scrollPercent ?? p.pageViewCount,
      headlineFr: p.headlineFr,
      headlineEn: p.headlineEn,
      bodyFr: p.bodyFr,
      bodyEn: p.bodyEn,
      ctaTextFr: p.ctaTextFr,
      ctaTextEn: p.ctaTextEn,
      imageBannerUrl: p.imageBanner,
      discountCode: p.discountCodeId ? codesById.get(p.discountCodeId) ?? null : null,
      emailCaptureTag: p.emailListTag,
      countdownEndsAt: null,
      upsellProductId: null,
      upsellOriginalPrice: null,
      upsellDiscountedPrice: null,
      ctaUrl: null,
      showOnPages: p.showOnPages,
      excludePages: p.excludePages,
      newVisitorsOnly: p.showToNewOnly,
      maxShowsPerUser: p.maxShowsPerUser,
    }));

    return NextResponse.json({ popups });
  } catch (error) {
    console.error("[GET /api/marketing/popups]", error);
    // Le rendu public ne doit jamais casser une vitrine pour un pop-up.
    return NextResponse.json({ popups: [] });
  }
}

export async function POST() {
  return NextResponse.json(DEPRECATED, { status: 410 });
}

export async function PUT() {
  return NextResponse.json(DEPRECATED, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json(DEPRECATED, { status: 410 });
}
