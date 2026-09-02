import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { findForeignLinkedIds } from "@/lib/formations/verify-linked-ownership";

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
    if (body.bannerUrl !== undefined) update.bannerUrl = body.bannerUrl ? String(body.bannerUrl).trim() : null;
    if (Number.isFinite(Number(body.price)) && Number(body.price) >= 500) update.price = Number(body.price);
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    // Un vendeur ne peut lier QUE son propre contenu (sinon ses abonnés
    // obtiendraient l'accès au payant d'un autre vendeur via access.ts).
    const linkedF = Array.isArray(body.linkedFormationIds) ? body.linkedFormationIds.map(String) : null;
    const linkedP = Array.isArray(body.linkedProductIds) ? body.linkedProductIds.map(String) : null;
    if (linkedF || linkedP) {
      const foreign = await findForeignLinkedIds(ctx.instructeurId, linkedF ?? [], linkedP ?? []);
      if (foreign.foreignFormationIds.length > 0 || foreign.foreignProductIds.length > 0) {
        return NextResponse.json({ error: "Un ou plusieurs éléments liés ne vous appartiennent pas." }, { status: 403 });
      }
    }
    if (linkedF) update.linkedFormationIds = linkedF;
    if (linkedP) update.linkedProductIds = linkedP;
    // Champs auparavant ignorés au PATCH → l'édition (mensuel↔annuel, essai,
    // plafond) était silencieusement perdue malgré un « Plan mis à jour ✓ ».
    if (body.interval === "monthly" || body.interval === "yearly") update.interval = body.interval;
    if (body.trialDays !== undefined)
      update.trialDays = body.trialDays === null || body.trialDays === "" ? null : Math.max(0, Math.floor(Number(body.trialDays)) || 0);
    if (body.maxMembers !== undefined)
      update.maxMembers = body.maxMembers === null || body.maxMembers === "" ? null : Math.max(0, Math.floor(Number(body.maxMembers)) || 0);

    const updated = await prisma.subscriptionPlan.update({ where: { id }, data: update });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[vendeur/subscription-plans PATCH]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
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
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
