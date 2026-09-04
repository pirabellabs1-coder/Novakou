import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { revalidatePublicCatalog } from "@/lib/formations/revalidate-public";
import { decisionPublication, notifierMiseEnAttente } from "@/lib/formations/publication-gate";
import { resolveShopRelationUpdate } from "@/lib/formations/shop-assign";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;

    const formation = await prisma.formation.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
      select: {
        id: true, slug: true, title: true, shortDesc: true, description: true,
        thumbnail: true, previewVideo: true, price: true, originalPrice: true,
        isFree: true, customCategory: true, status: true, rating: true, studentsCount: true,
        reviewsCount: true, hiddenFromMarketplace: true, shopId: true, createdAt: true, updatedAt: true,
        sections: {
          orderBy: { order: "asc" },
          select: {
            id: true, title: true, desc: true, order: true,
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true, title: true, desc: true, type: true, duration: true,
                order: true, isFree: true, videoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!formation) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    return NextResponse.json({ data: formation });
  } catch (err) {
    console.error("[formations/[id] GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.formation.findFirst({ where: { id, instructeurId: ctx.instructeurId } });
    if (!existing) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

    const body = await request.json();
    // Si isFree=true → forcer price=0 (cohérence)
    const incomingIsFree = typeof body.isFree === "boolean" ? body.isFree : undefined;

    // V2.1 — server-side price validation on update
    let priceVal: number | undefined;
    if (body.price !== undefined) {
      const tmp = parseFloat(body.price);
      if (!Number.isFinite(tmp) || tmp < 0) {
        return NextResponse.json(
          { error: "Le prix doit être un nombre positif ou nul." },
          { status: 400 }
        );
      }
      priceVal = tmp;
    }
    if (incomingIsFree === true) priceVal = 0;
    // Si on bascule vers payant, exiger price > 0
    const effectiveIsFree =
      incomingIsFree !== undefined ? incomingIsFree : existing.isFree;
    const effectivePrice = priceVal !== undefined ? priceVal : existing.price;
    if (!effectiveIsFree && effectivePrice <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être strictement supérieur à 0 pour une formation payante." },
        { status: 400 }
      );
    }

    // V2.3 — originalPrice strictement supérieur au prix
    let originalPriceVal: number | null | undefined;
    if (body.originalPrice !== undefined) {
      if (body.originalPrice === null || body.originalPrice === "" || body.originalPrice === 0) {
        originalPriceVal = null;
      } else {
        const tmp = parseFloat(body.originalPrice);
        if (!Number.isFinite(tmp) || tmp <= effectivePrice) {
          return NextResponse.json(
            { error: "Le prix barré doit être strictement supérieur au prix de vente." },
            { status: 400 }
          );
        }
        originalPriceVal = tmp;
      }
    }

    // ── GARDE DE TRANSITION DE STATUT ────────────────────────────────────
    // Même règle que les produits : le vendeur choisit brouillon, publication
    // ou archive — jamais EN_ATTENTE, et il ne sort pas seul de la file de
    // validation.
    const statutDemande = typeof body.status === "string" ? body.status : undefined;
    if (statutDemande && !["BROUILLON", "ACTIF", "ARCHIVE"].includes(statutDemande)) {
      return NextResponse.json({ error: "Statut non autorisé." }, { status: 400 });
    }
    if (existing.status === "EN_ATTENTE" && statutDemande === "ACTIF") {
      return NextResponse.json(
        {
          error:
            "Cette formation est en cours de validation par l'équipe. Elle sera mise en ligne dès son approbation — vous pouvez la repasser en brouillon pour la modifier.",
          code: "EN_VALIDATION",
        },
        { status: 400 },
      );
    }

    // ── RÈGLES DE PUBLICATION (les formations n'en avaient AUCUNE) ───────
    // Mêmes règles que les produits, bannière exclue (pas de champ). Les
    // signaux (KYC, prix…) ne jouent qu'à la PUBLICATION, pas sur l'édition
    // d'une formation déjà en ligne.
    const publication = statutDemande === "ACTIF" && existing.status !== "ACTIF";
    const seraVisible = statutDemande === "ACTIF" || (statutDemande === undefined && existing.status === "ACTIF");
    let statutFinal: string | undefined = statutDemande;
    if (seraVisible) {
      const decision = await decisionPublication({
        userId: ctx.userId,
        titre: body.title !== undefined ? body.title : existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        prix: effectivePrice,
        vignetteUrl: body.thumbnail !== undefined ? body.thumbnail : existing.thumbnail,
        banniereUrl: null,
        exigerBanniere: false,
      });
      if (!decision.ok) {
        return NextResponse.json(
          {
            error: decision.error,
            code: decision.httpStatus === 403 ? "VENDEUR_SUSPENDU" : "FICHE_INCOMPLETE",
            problemes: decision.problemes ?? [],
          },
          { status: decision.httpStatus },
        );
      }
      if (publication) statutFinal = decision.statut;
    }

    // Boutique : une formation peut être déplacée d'une boutique à l'autre (ou
    // détachée). Appliqué seulement si `shopId` est présent dans le corps.
    let shopUpdate: { connect: { id: string } } | { disconnect: true } | undefined;
    try {
      shopUpdate = await resolveShopRelationUpdate(ctx.instructeurId, body.shopId);
    } catch {
      return NextResponse.json({ error: "Boutique invalide." }, { status: 400 });
    }

    // V2.2 — publishedAt: stamp lors du passage à ACTIF (si pas déjà set), null sur retour BROUILLON.
    // Un passage en EN_ATTENTE ne date rien : la mise en ligne sera l'approbation.
    let publishedAtVal: Date | null | undefined;
    if (statutFinal !== undefined && statutFinal !== existing.status) {
      if (statutFinal === "ACTIF") {
        publishedAtVal = existing.publishedAt ?? new Date();
      } else if (statutFinal === "BROUILLON") {
        publishedAtVal = null;
      }
    }

    const updated = await prisma.formation.update({
      where: { id },
      data: {
        title: body.title?.trim() || undefined,
        shortDesc: body.shortDesc !== undefined ? body.shortDesc?.trim() || null : undefined,
        description: body.description !== undefined ? body.description?.trim() || null : undefined,
        thumbnail: body.thumbnail !== undefined ? body.thumbnail || null : undefined,
        price: priceVal,
        originalPrice: originalPriceVal,
        isFree: incomingIsFree,
        status: (statutFinal as never) ?? undefined,
        publishedAt: publishedAtVal,
        hiddenFromMarketplace: typeof body.hiddenFromMarketplace === "boolean" ? body.hiddenFromMarketplace : undefined,
        ...(shopUpdate ? { shop: shopUpdate } : {}),
      },
    });

    if (publication && updated.status === "EN_ATTENTE") {
      await notifierMiseEnAttente({ userId: ctx.userId, titre: updated.title });
    }

    // Édition (prix, titre, statut…) → rafraîchir les pages publiques en cache.
    revalidatePublicCatalog();
    return NextResponse.json({ data: { ...updated, enAttente: updated.status === "EN_ATTENTE" } });
  } catch (err) {
    console.error("[formations/[id] PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.formation.findFirst({ where: { id, instructeurId: ctx.instructeurId } });
    if (!existing) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

    // ⚠️ NE JAMAIS hard-delete une formation qui a des inscrits : Enrollment est
    // en onDelete: Cascade → supprimer la formation effacerait les inscriptions
    // (les apprenants perdent leur accès, ventes/revenus disparus). On ARCHIVE.
    const enrollCount = await prisma.enrollment.count({ where: { formationId: id } });
    if (enrollCount > 0) {
      await prisma.formation.update({
        where: { id },
        data: { status: "BROUILLON", hiddenFromMarketplace: true },
      });
      revalidatePublicCatalog();
      return NextResponse.json({ data: { ok: true, archived: true, reason: "enrollments_exist" } });
    }

    await prisma.formation.delete({ where: { id } });
    revalidatePublicCatalog();
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error("[formations/[id] DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
