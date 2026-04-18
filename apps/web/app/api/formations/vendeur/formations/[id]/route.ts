import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

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
    let priceVal: number | undefined =
      body.price !== undefined ? parseFloat(body.price) : undefined;
    if (incomingIsFree === true) priceVal = 0;

    const updated = await prisma.formation.update({
      where: { id },
      data: {
        title: body.title?.trim() || undefined,
        shortDesc: body.shortDesc !== undefined ? body.shortDesc?.trim() || null : undefined,
        description: body.description !== undefined ? body.description?.trim() || null : undefined,
        thumbnail: body.thumbnail !== undefined ? body.thumbnail || null : undefined,
        price: priceVal,
        originalPrice: body.originalPrice !== undefined ? (body.originalPrice ? parseFloat(body.originalPrice) : null) : undefined,
        isFree: incomingIsFree,
        status: body.status ?? undefined,
        hiddenFromMarketplace: typeof body.hiddenFromMarketplace === "boolean" ? body.hiddenFromMarketplace : undefined,
      },
    });

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

    await prisma.formation.delete({ where: { id } });
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    console.error("[formations/[id] DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
