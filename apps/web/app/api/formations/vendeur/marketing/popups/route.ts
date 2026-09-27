import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { PopupType, PopupTrigger } from "@prisma/client";

const TYPES: PopupType[] = ["DISCOUNT", "EMAIL_CAPTURE", "ANNOUNCEMENT", "UPSELL", "COUNTDOWN"];
const DECLENCHEURS: PopupTrigger[] = ["EXIT_INTENT", "TIME_DELAY", "SCROLL_PERCENT", "PAGE_VIEW_COUNT", "MANUAL"];

function estType(v: unknown): v is PopupType {
  return typeof v === "string" && (TYPES as string[]).includes(v);
}
function estDeclencheur(v: unknown): v is PopupTrigger {
  return typeof v === "string" && (DECLENCHEURS as string[]).includes(v);
}

/** Entier borné ; `null` si la valeur n'est pas exploitable. */
function borne(v: unknown, min: number, max: number, defaut: number): number | null {
  if (v === undefined || v === null || v === "") return defaut;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n)) return defaut;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Vérifie qu'un `discountCodeId` fourni par le client appartient bien au
 * vendeur. Renvoie l'identifiant validé, `null` si aucun code n'était
 * demandé, ou "INVALIDE" si le code n'est pas à lui.
 */
async function codePromoDuVendeur(
  discountCodeId: unknown,
  instructeurId: string,
): Promise<string | null | "INVALIDE"> {
  if (!discountCodeId || typeof discountCodeId !== "string") return null;
  const code = await prisma.discountCode.findFirst({
    where: { id: discountCodeId, instructeurId },
    select: { id: true },
  });
  return code ? code.id : "INVALIDE";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ data: [] });
    const pid = _ctx.instructeurId;

    const popups = await prisma.smartPopup.findMany({
      where: { instructeurId: pid, ...(activeShopId ? { OR: [{ shopId: activeShopId }, { shopId: null }] } : {}) },
      orderBy: { createdAt: "desc" },
    });

    // Statistiques réelles.
    //
    // Les compteurs `totalImpressions` / `totalClicks` / `totalConversions` du
    // modèle sont restés à zéro pendant toute la période où la route publique
    // écrivait sur des colonnes inexistantes : en base, des pop-ups affichent
    // 0 vue alors que PopupImpression contient des dizaines de lignes pour eux.
    // On recompte donc depuis la table d'évènements, et on garde le maximum des
    // deux (les très vieux pop-ups n'ont que le compteur).
    const idsPopups = popups.map((p) => p.id);
    const reels = new Map<string, { view: number; click: number; convert: number }>();
    if (idsPopups.length > 0) {
      const parAction = await prisma.popupImpression.groupBy({
        by: ["popupId", "action"],
        where: { popupId: { in: idsPopups } },
        _count: { _all: true },
      });
      for (const ligne of parAction) {
        const e = reels.get(ligne.popupId) ?? { view: 0, click: 0, convert: 0 };
        if (ligne.action === "view") e.view = ligne._count._all;
        else if (ligne.action === "click") e.click = ligne._count._all;
        else if (ligne.action === "convert") e.convert = ligne._count._all;
        reels.set(ligne.popupId, e);
      }
    }

    // Les adresses collectées par les pop-ups « capture email ». Elles sont
    // stockées dans PopupImpression.metadata à la conversion : sans les remonter
    // ici, le vendeur voyait un compteur de conversions sans jamais pouvoir
    // récupérer une seule adresse — tout l'intérêt de l'outil.
    const idsCapture = popups.filter((p) => p.popupType === "EMAIL_CAPTURE").map((p) => p.id);
    const leadsParPopup: Record<string, { email: string; date: string }[]> = {};
    if (idsCapture.length > 0) {
      const conversions = await prisma.popupImpression.findMany({
        where: { popupId: { in: idsCapture }, action: "convert" },
        orderBy: { createdAt: "desc" },
        take: 500,
        select: { popupId: true, metadata: true, createdAt: true },
      });
      for (const c of conversions) {
        const meta = c.metadata as { email?: unknown } | null;
        const email = meta && typeof meta.email === "string" ? meta.email : null;
        if (!email) continue;
        const liste = (leadsParPopup[c.popupId] ??= []);
        // Une même adresse peut arriver deux fois (visiteur qui revalide) :
        // on ne la compte qu'une fois.
        if (!liste.some((l) => l.email === email)) {
          liste.push({ email, date: c.createdAt.toISOString() });
        }
      }
    }

    const data = popups.map((p) => {
      const r = reels.get(p.id);
      return {
        ...p,
        totalImpressions: Math.max(p.totalImpressions, r?.view ?? 0),
        totalClicks: Math.max(p.totalClicks, r?.click ?? 0),
        totalConversions: Math.max(p.totalConversions, r?.convert ?? 0),
        leads: leadsParPopup[p.id] ?? [],
      };
    });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[popups GET]", err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
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

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Le nom doit contenir au moins 2 caractères" }, { status: 400 });
    }
    if (!estType(popupType)) {
      return NextResponse.json({ error: "Type de pop-up invalide" }, { status: 400 });
    }
    if (!estDeclencheur(trigger)) {
      return NextResponse.json({ error: "Déclencheur invalide" }, { status: 400 });
    }

    // Un délai / un pourcentage de défilement hors bornes donnait un pop-up
    // qui ne s'ouvrait jamais (ou immédiatement) : on borne côté serveur.
    const delai = trigger === "TIME_DELAY" ? borne(delaySeconds, 1, 600, 10) : null;
    const defilement = trigger === "SCROLL_PERCENT" ? borne(scrollPercent, 1, 100, 50) : null;

    // Le code promo attaché doit appartenir au vendeur : sinon un créateur
    // pouvait afficher (et donc divulguer) le code promo privé d'un autre
    // vendeur dans son propre pop-up.
    const codeId = await codePromoDuVendeur(discountCodeId, pid);
    if (codeId === "INVALIDE") {
      return NextResponse.json({ error: "Code promo introuvable" }, { status: 404 });
    }
    if (popupType === "DISCOUNT" && !codeId) {
      return NextResponse.json(
        { error: "Choisissez le code promo à afficher dans ce pop-up" },
        { status: 400 },
      );
    }

    const popup = await prisma.smartPopup.create({
      data: { instructeurId: pid, shopId: activeShopId,
        name: name.trim().slice(0, 120),
        popupType: popupType as PopupType,
        trigger: trigger as PopupTrigger,
        delaySeconds: delai,
        scrollPercent: defilement,
        headlineFr: headlineFr?.trim() || null,
        bodyFr: bodyFr?.trim() || null,
        ctaTextFr: ctaTextFr?.trim() || null,
        imageBanner: imageBanner?.trim() || null,
        discountCodeId: codeId,
        showToNewOnly: showToNewOnly ?? false,
        maxShowsPerUser: borne(maxShowsPerUser, 1, 10, 1) ?? 1,
        isActive: true,
      },
    });

    return NextResponse.json({ data: popup });
  } catch (err) {
    console.error("[popups POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
