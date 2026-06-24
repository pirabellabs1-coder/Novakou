import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { kind, action } = body; // action: "approve" | "reject" | "archive"
    const reason: string | null = typeof body.reason === "string" ? body.reason : null;

    if (!kind || !action) return NextResponse.json({ error: "kind et action requis" }, { status: 400 });

    const actorId = (session.user as { id?: string }).id;

    if (kind === "formation") {
      const newStatus = action === "approve" ? "ACTIF" as const : "ARCHIVE" as const;
      await prisma.formation.update({ where: { id }, data: { status: newStatus } });

      if (actorId && (action === "approve" || action === "reject")) {
        await createAuditLog({
          actorId,
          action: action === "approve" ? "formation.approved" : "formation.rejected",
          targetType: "formation",
          targetId: id,
          details: { reason },
        }).catch(() => null);
      }
    } else if (kind === "product") {
      const newStatus = action === "approve" ? "ACTIF" as const : action === "reject" ? "REFUSE" as const : "ARCHIVE" as const;
      await prisma.digitalProduct.update({ where: { id }, data: { status: newStatus } });

      if (actorId && (action === "approve" || action === "reject")) {
        await createAuditLog({
          actorId,
          action: action === "approve" ? "product.approved" : "product.rejected",
          targetType: "product",
          targetId: id,
          details: { reason },
        }).catch(() => null);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/produits PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE — suppression d'un produit/formation par l'admin, AVEC MOTIF.
 *
 * Le motif est obligatoire et le vendeur en est notifié.
 *
 * Sécurité des données financières : supprimer en base cascade sur les achats
 * (DigitalProductPurchase / Enrollment) → cela détruirait l'accès des
 * acheteurs et la trace financière. Donc :
 *   - 0 achat        → suppression DÉFINITIVE (rien à préserver).
 *   - ≥ 1 achat       → retrait du marketplace (status ARCHIVE + masqué) en
 *                       conservant l'historique. Le produit n'est plus visible
 *                       ni achetable, les acheteurs gardent leur accès.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const kind: string | undefined = body.kind;
    const reason: string = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!kind) return NextResponse.json({ error: "kind requis" }, { status: 400 });
    if (reason.length < 3) {
      return NextResponse.json({ error: "Le motif de suppression est obligatoire." }, { status: 400 });
    }

    const actorId = (session.user as { id?: string }).id;

    // Récupère le vendeur + titre + nb d'achats pour décider hard vs soft delete
    let vendorUserId: string | null = null;
    let title = "votre produit";
    let hasPurchases = false;

    if (kind === "formation") {
      const f = await prisma.formation.findUnique({
        where: { id },
        select: {
          title: true,
          instructeur: { select: { user: { select: { id: true } } } },
          _count: { select: { enrollments: true } },
        },
      });
      if (!f) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
      vendorUserId = f.instructeur?.user?.id ?? null;
      title = f.title;
      hasPurchases = f._count.enrollments > 0;
    } else if (kind === "product") {
      const p = await prisma.digitalProduct.findUnique({
        where: { id },
        select: {
          title: true,
          instructeur: { select: { user: { select: { id: true } } } },
          _count: { select: { purchases: true } },
        },
      });
      if (!p) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
      vendorUserId = p.instructeur?.user?.id ?? null;
      title = p.title;
      hasPurchases = p._count.purchases > 0;
    } else {
      return NextResponse.json({ error: "kind invalide" }, { status: 400 });
    }

    // Notifie le vendeur : le produit n'est PAS détruit, il est remis en
    // brouillon pour qu'il puisse corriger le problème et le resoumettre.
    if (vendorUserId) {
      await createNotification({
        userId: vendorUserId,
        type: "system",
        title: "Produit remis en brouillon par la modération",
        message: `« ${title} » a été retiré du marketplace et remis en brouillon. Motif : ${reason}. Corrigez-le puis resoumettez-le à la validation.`,
        link: "/vendeur/produits",
      }).catch(() => null);
    }

    // On ne supprime JAMAIS : on repasse en BROUILLON + masqué du marketplace,
    // et on stocke le motif dans refuseReason (visible par le vendeur à
    // l'édition). Les acheteurs existants conservent leur accès (via leur
    // inscription/achat, indépendant du statut produit).
    if (kind === "formation") {
      await prisma.formation.update({
        where: { id },
        data: { status: "BROUILLON", hiddenFromMarketplace: true, refuseReason: reason },
      });
    } else {
      await prisma.digitalProduct.update({
        where: { id },
        data: { status: "BROUILLON", hiddenFromMarketplace: true, refuseReason: reason },
      });
    }

    if (actorId) {
      await createAuditLog({
        actorId,
        action: kind === "formation" ? "formation.unpublished" : "product.unpublished",
        targetType: kind,
        targetId: id,
        details: { reason, mode: "draft", hasPurchases },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, mode: "draft" });
  } catch (err) {
    console.error("[admin/produits DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
