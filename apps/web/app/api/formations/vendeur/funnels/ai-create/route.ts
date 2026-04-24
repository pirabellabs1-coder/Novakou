import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

/**
 * POST /api/formations/vendeur/funnels/ai-create
 *
 * Cree un funnel complet a partir d'un JSON genere par l'IA (Claude via Puter.js).
 *
 * Body: {
 *   name: string,
 *   description?: string,
 *   theme?: { primaryColor, accentColor, textColor, bgColor, font },
 *   productId?: string,
 *   formationId?: string,
 *   steps: Array<{
 *     stepType: "LANDING" | "PRODUCT" | "CHECKOUT" | "UPSELL" | "DOWNSELL" | "CONFIRMATION" | "THANK_YOU",
 *     title: string,
 *     headlineFr?: string,
 *     descriptionFr?: string,
 *     ctaTextFr?: string,
 *     discountPct?: number,
 *     blocks?: Array<{ id, type, data }>
 *   }>
 * }
 *
 * Retourne le funnel cree (pour redirection vers l'editeur).
 */
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const VALID_STEP_TYPES = new Set([
  "LANDING",
  "PRODUCT",
  "CHECKOUT",
  "UPSELL",
  "DOWNSELL",
  "CONFIRMATION",
  "THANK_YOU",
]);

const VALID_BLOCK_TYPES = new Set([
  "hero",
  "features",
  "countdown",
  "testimonials",
  "faq",
  "cta",
  "heading",
  "text",
  "pricing",
  "stats",
  "image",
  "button",
  "divider",
  "spacer",
  "video",
  "list",
  "icon-box",
  "content-box",
]);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

type BlockInput = { id?: string; type?: string; data?: Record<string, unknown> };
type StepInput = {
  stepType?: string;
  title?: string;
  headlineFr?: string;
  descriptionFr?: string;
  ctaTextFr?: string;
  discountPct?: number;
  blocks?: BlockInput[];
};

// Nettoie et valide les blocks — assure qu'on ne stocke que des types reconnus
// par l'editeur visuel. Genere un id stable si manquant.
function sanitizeBlocks(blocks: BlockInput[] | undefined): Array<{ id: string; type: string; data: Record<string, unknown> }> {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b && typeof b.type === "string" && VALID_BLOCK_TYPES.has(b.type))
    .map((b, i) => ({
      id: typeof b.id === "string" && b.id.length > 0 ? b.id : `${b.type}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      type: b.type!,
      data: (b.data && typeof b.data === "object") ? b.data : {},
    }));
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) {
      return NextResponse.json(
        { error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." },
        { status: 401 }
      );
    }
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const body = await request.json();
    const {
      name,
      description,
      theme,
      productId,
      formationId,
      steps,
    } = body as {
      name?: string;
      description?: string;
      theme?: Record<string, unknown>;
      productId?: string;
      formationId?: string;
      steps?: StepInput[];
    };

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "Nom requis (min 3 caractères)" }, { status: 400 });
    }
    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "Au moins 1 étape requise" }, { status: 400 });
    }

    // Slug unique
    const baseSlug = slugify(name);
    let slug = baseSlug || "funnel";
    let counter = 0;
    while (await prisma.salesFunnel.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Theme par defaut Novakou (vert)
    const defaultTheme = {
      primaryColor: "#006e2f",
      accentColor: "#22c55e",
      textColor: "#191c1e",
      bgColor: "#f7f9fb",
      font: "Manrope",
    };
    const mergedTheme = { ...defaultTheme, ...(theme && typeof theme === "object" ? theme : {}) };

    // Prepare les etapes (reorder + valid type)
    const prepared = steps
      .filter((s): s is StepInput & { stepType: string } =>
        !!s && typeof s.stepType === "string" && VALID_STEP_TYPES.has(s.stepType),
      )
      .map((s, index) => ({
        stepOrder: index + 1,
        stepType: s.stepType as
          | "LANDING"
          | "PRODUCT"
          | "CHECKOUT"
          | "UPSELL"
          | "DOWNSELL"
          | "CONFIRMATION"
          | "THANK_YOU",
        title: (s.title ?? s.stepType).toString().slice(0, 100),
        formationId: formationId ?? null,
        productId: productId ?? null,
        headlineFr: s.headlineFr?.toString().slice(0, 500) ?? null,
        descriptionFr: s.descriptionFr?.toString().slice(0, 3000) ?? null,
        ctaTextFr: s.ctaTextFr?.toString().slice(0, 100) ?? null,
        discountPct:
          typeof s.discountPct === "number" && s.discountPct >= 0 && s.discountPct <= 99
            ? s.discountPct
            : null,
        blocks: sanitizeBlocks(s.blocks),
      }));

    if (prepared.length === 0) {
      return NextResponse.json({ error: "Aucune étape valide (stepType doit être LANDING/PRODUCT/UPSELL/THANK_YOU/...)" }, { status: 400 });
    }

    const funnel = await prisma.salesFunnel.create({
      data: {
        instructeurId: ctx.instructeurId,
        shopId: activeShopId,
        name: name.trim(),
        slug,
        description: description?.toString().slice(0, 1000) ?? null,
        theme: mergedTheme,
        isActive: false, // brouillon par defaut, le vendeur active apres relecture
        steps: {
          create: prepared.map((p) => ({
            stepOrder: p.stepOrder,
            stepType: p.stepType,
            title: p.title,
            formationId: p.formationId,
            productId: p.productId,
            headlineFr: p.headlineFr,
            descriptionFr: p.descriptionFr,
            ctaTextFr: p.ctaTextFr,
            discountPct: p.discountPct,
            // Prisma attend un JsonValue — on re-serialise pour eliminer les "unknown"
            blocks: p.blocks as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json({ data: funnel });
  } catch (err) {
    console.error("[vendeur/funnels/ai-create POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
