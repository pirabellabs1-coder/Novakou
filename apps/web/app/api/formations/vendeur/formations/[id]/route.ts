import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { revalidatePublicCatalog } from "@/lib/formations/revalidate-public";

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
        reviewsCount: true, hiddenFromMarketplace: true, createdAt: true, updatedAt: true,
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

    // V2.2 — publishedAt: stamp lors du passage à ACTIF (si pas déjà set), null sur retour BROUILLON.
    let publishedAtVal: Date | null | undefined;
    if (body.status !== undefined && body.status !== existing.status) {
      if (body.status === "ACTIF") {
        publishedAtVal = existing.publishedAt ?? new Date();
      } else if (body.status === "BROUILLON") {
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
        status: body.status ?? undefined,
        publishedAt: publishedAtVal,
        hiddenFromMarketplace: typeof body.hiddenFromMarketplace === "boolean" ? body.hiddenFromMarketplace : undefined,
      },
    });

    // Édition (prix, titre, statut…) → rafraîchir les pages publiques en cache.
    revalidatePublicCatalog();
    return NextResponse.json({ data: updated });
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
