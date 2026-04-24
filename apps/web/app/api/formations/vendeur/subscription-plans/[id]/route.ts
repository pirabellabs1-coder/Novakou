import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
    });
    if (!plan) return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });

    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim().length >= 3) update.name = body.name.trim();
    if (typeof body.description === "string" && body.description.trim().length >= 10) update.description = body.description.trim();
    if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    if (Number.isFinite(Number(body.price)) && Number(body.price) >= 500) update.price = Number(body.price);
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    if (Array.isArray(body.linkedFormationIds)) update.linkedFormationIds = body.linkedFormationIds;
    if (Array.isArray(body.linkedProductIds)) update.linkedProductIds = body.linkedProductIds;

    const updated = await prisma.subscriptionPlan.update({ where: { id }, data: update });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[vendeur/subscription-plans PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    if (plan._count.subscriptions > 0) {
      // Ne pas supprimer si abonnes actifs : juste desactiver
      await prisma.subscriptionPlan.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ data: { deactivated: true, reason: "Plan avec abonnes, desactive plutot que supprime" } });
    }
    await prisma.subscriptionPlan.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[vendeur/subscription-plans DELETE]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
