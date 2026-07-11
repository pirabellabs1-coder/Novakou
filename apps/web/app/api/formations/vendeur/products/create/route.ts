import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { DigitalProductType } from "@prisma/client";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function getOrCreateCategory(name: string) {
  const slug = slugify(name);
  const existing = await prisma.formationCategory.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.formationCategory.create({
    data: { name, slug, isActive: true },
  });
}

/**
 * POST /api/vendeur/products/create
 * Body: { kind: "formation" | "product", productType?, title, description, price, originalPrice?, category, thumbnail? }
 *  - kind="formation" (cours vidéo ou pack) → creates Formation
 *  - kind="product" (ebook, template, audio, software, bundle) → creates DigitalProduct
 * Returns { id, slug, kind, status }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Resolve the real active user (by id OR email fallback) AND ensure instructeur profile
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) {
      return NextResponse.json(
        { error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." },
        { status: 401 }
      );
    }
    const userId = ctx.userId;
    const profile = { id: ctx.instructeurId };

    // AUCUNE limite de création de produits/formations — quel que soit le plan
    // (Gratuit inclus). Tous les créateurs peuvent publier autant de produits
    // numériques, e-books, vidéos et formations qu'ils veulent. (Ancien plafond
    // du plan Gratuit retiré à la demande du fondateur — 2026-07.)
    void userId; void profile;

    // Multi-shop : tag the new product with the active shop
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const body = await request.json();
    const {
      kind,
      productType,
      title,
      description,
      shortDesc,
      price,
      originalPrice,
      category,
      thumbnail, // square vignette (~600×600) shown on marketplace cards
      banner,    // wide cover (~1280×720) shown on the product detail page
      publish,
      affiliateEnabled, // opt-in vendeur : produit promouvable par les affiliés
      affiliateCommissionPct, // % offert aux affiliés (null = taux du programme)
      modules, // For formations: [{ title, lessons: [{ title, duration }] }]
      fileUrl, // For digital products: backward-compat single-file URL
      files, // For digital products: [{ name, url, size?, mimeType? }]
    } = body;

    // Affiliation — normalisation serveur (jamais faire confiance au client).
    const affEnabled = affiliateEnabled === true;
    const affPctRaw = Number(affiliateCommissionPct);
    const affPct = affEnabled && Number.isFinite(affPctRaw)
      ? Math.max(1, Math.min(90, Math.round(affPctRaw)))
      : null;

    if (!kind || !title || price === undefined || price === null) {
      return NextResponse.json(
        { error: "kind, title et price sont requis" },
        { status: 400 }
      );
    }

    // V2.1 — server-side price validation (never trust client clamping)
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: "Le prix doit être un nombre positif ou nul." },
        { status: 400 }
      );
    }
    const isFreeFlag = priceNum === 0;
    if (!isFreeFlag && priceNum <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être strictement supérieur à 0 pour un produit payant." },
        { status: 400 }
      );
    }

    // V2.3 — originalPrice (prix barré) doit être > price si fourni
    let originalPriceNum: number | null = null;
    if (originalPrice !== undefined && originalPrice !== null && originalPrice !== "" && originalPrice !== 0) {
      const tmp = parseFloat(originalPrice);
      if (!Number.isFinite(tmp) || tmp <= priceNum) {
        return NextResponse.json(
          { error: "Le prix barré doit être strictement supérieur au prix de vente." },
          { status: 400 }
        );
      }
      originalPriceNum = tmp;
    }

    const baseSlug = slugify(title);
    let slug = baseSlug || `produit-${Date.now()}`;
    let suffix = 1;

    if (kind === "formation") {
      // Find unique slug
      while (await prisma.formation.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix++}`;
      }
      const cat = await getOrCreateCategory(category || "Divers");

      // Compute total duration from modules
      const validModules: Array<{
        title: string;
        lessons: Array<{ title: string; duration?: number; videoUrl?: string }>;
      }> = Array.isArray(modules) ? modules : [];
      const totalDuration = validModules.reduce(
        (sum, m) => sum + (Array.isArray(m.lessons) ? m.lessons.reduce((s, l) => s + (Number(l.duration) || 0), 0) : 0),
        0
      );

      const formation = await prisma.formation.create({
        data: {
          slug,
          title: title.trim(),
          shortDesc: shortDesc?.trim() || null,
          description: description?.trim() || null,
          customCategory: category || null,
          categoryId: cat.id,
          thumbnail: thumbnail || null,
          price: priceNum,
          originalPrice: originalPriceNum,
          isFree: isFreeFlag,
          affiliateEnabled: affEnabled,
          affiliateCommissionPct: affPct,
          duration: totalDuration,
          status: publish ? "ACTIF" : "BROUILLON",
          // V2.2 — stamp publishedAt when going live (null when staying as draft)
          publishedAt: publish ? new Date() : null,
          instructeurId: profile.id,
          shopId: activeShopId,
          sections: validModules.length > 0 ? {
            create: validModules
              .filter((m) => m.title?.trim())
              .map((m, mIdx) => ({
                title: m.title.trim(),
                order: mIdx,
                lessons: {
                  create: (Array.isArray(m.lessons) ? m.lessons : [])
                    .filter((l) => l.title?.trim())
                    .map((l, lIdx) => {
                      const url = typeof l.videoUrl === "string" ? l.videoUrl.trim() : "";
                      const safeUrl = url && /^https?:\/\//.test(url) ? url : null;
                      return {
                        title: l.title.trim(),
                        type: "VIDEO" as const,
                        duration: Number(l.duration) || null,
                        videoUrl: safeUrl,
                        order: lIdx,
                        isFree: mIdx === 0 && lIdx === 0,
                      };
                    }),
                },
              })),
          } : undefined,
        },
        include: { sections: { include: { lessons: true } } },
      });

      return NextResponse.json({
        data: {
          id: formation.id,
          slug: formation.slug,
          kind: "formation",
          status: formation.status,
          modules: formation.sections.length,
          lessons: formation.sections.reduce((s, m) => s + m.lessons.length, 0),
        },
      });
    }

    if (kind === "product") {
      while (await prisma.digitalProduct.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix++}`;
      }
      const cat = await getOrCreateCategory(category || "Divers");

      const validTypes: DigitalProductType[] = ["EBOOK", "PDF", "TEMPLATE", "AUDIO", "VIDEO", "LICENCE", "AUTRE"];
      const type: DigitalProductType = validTypes.includes(productType as DigitalProductType)
        ? (productType as DigitalProductType)
        : "EBOOK";

      const safeFiles = Array.isArray(files)
        ? (files as unknown[])
            .filter((f): f is { name?: string; url: string; size?: number; mimeType?: string } =>
              !!f && typeof f === "object" && typeof (f as { url?: unknown }).url === "string" && !!(f as { url?: string }).url,
            )
            .slice(0, 50)
            .map((f, idx) => ({
              name: typeof f.name === "string" && f.name.trim() ? f.name.trim() : `fichier-${idx + 1}`,
              url: f.url.trim(),
              size: typeof f.size === "number" ? f.size : null,
              mimeType: typeof f.mimeType === "string" ? f.mimeType : null,
              order: idx,
            }))
        : [];

      // Backward-compat: if no `files` array but legacy `fileUrl` is provided, seed one row.
      const filesToCreate = safeFiles.length > 0
        ? safeFiles
        : (typeof fileUrl === "string" && fileUrl.trim()
            ? [{ name: fileUrl.split("/").pop() ?? "fichier", url: fileUrl.trim(), size: null, mimeType: null, order: 0 }]
            : []);

      const product = await prisma.digitalProduct.create({
        data: {
          slug,
          title: title.trim(),
          description: description?.trim() || null,
          productType: type,
          categoryId: cat.id,
          // Backward-compat: legacy clients only sent `thumbnail` (which was
          // really the banner). Accept both names; fall back if either is
          // missing so single-image clients still get a banner.
          thumbnail: thumbnail || banner || null,
          banner: banner || thumbnail || null,
          fileUrl: filesToCreate[0]?.url ?? null,
          price: priceNum,
          originalPrice: originalPriceNum,
          isFree: isFreeFlag,
          affiliateEnabled: affEnabled,
          affiliateCommissionPct: affPct,
          status: publish ? "ACTIF" : "BROUILLON",
          instructeurId: profile.id,
          shopId: activeShopId,
          ...(filesToCreate.length > 0 ? { files: { create: filesToCreate } } : {}),
        },
      });

      return NextResponse.json({
        data: { id: product.id, slug: product.slug, kind: "product", status: product.status },
      });
    }

    return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  } catch (err) {
    console.error("[products/create]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
