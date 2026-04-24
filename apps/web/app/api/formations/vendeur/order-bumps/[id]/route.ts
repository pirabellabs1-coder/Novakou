import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * PATCH /api/formations/vendeur/order-bumps/[id]
 * Met à jour un bump (title, description, prix, ciblage, isActive...)
 *
 * DELETE /api/formations/vendeur/order-bumps/[id]
 * Supprime un bump.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.orderBump.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
    });
    if (!existing) return NextResponse.json({ error: "Bump introuvable" }, { status: 404 });

    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim().length >= 3) update.title = body.title.trim();
    if (typeof body.description === "string" && body.description.trim().length >= 10) update.description = body.description.trim();
    if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    if (Number.isFinite(Number(body.price)) && Number(body.price) >= 100) update.price = Number(body.price);
    if (body.originalPrice !== undefined) update.originalPrice = body.originalPrice ? Number(body.originalPrice) : null;
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    if (typeof body.appliesToAll === "boolean") update.appliesToAll = body.appliesToAll;
    if (Array.isArray(body.targetFormationIds)) update.targetFormationIds = body.targetFormationIds;
    if (Array.isArray(body.targetProductIds)) update.targetProductIds = body.targetProductIds;

    const updated = await prisma.orderBump.update({
      where: { id },
      data: update,
      include: {
        bumpFormation: { select: { id: true, title: true, slug: true, thumbnail: true } },
        bumpProduct: { select: { id: true, title: true, slug: true, banner: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[vendeur/order-bumps PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.orderBump.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
    });
    if (!existing) return NextResponse.json({ error: "Bump introuvable" }, { status: 404 });

    await prisma.orderBump.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[vendeur/order-bumps DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
