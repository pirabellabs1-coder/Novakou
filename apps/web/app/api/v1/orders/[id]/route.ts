import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import { apiError, apiSuccess } from "@/lib/api/v1-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/orders/:id
 *
 * Détail d'une commande (Enrollment OU DigitalProductPurchase).
 * Le vendeur ne voit que ses propres commandes.
 *
 * Scope requis : read:orders
 */
export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:orders" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;

    const enrollment = await prisma.enrollment.findFirst({
      where: { id, formation: { instructeurId: ctx.instructeurId } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        formation: {
          select: { id: true, slug: true, title: true, price: true },
        },
      },
    });
    if (enrollment) {
      return apiSuccess({
        id: enrollment.id,
        kind: "formation" as const,
        productId: enrollment.formationId,
        productSlug: enrollment.formation.slug,
        productTitle: enrollment.formation.title,
        buyer: enrollment.user,
        amount: enrollment.paidAmount,
        currency: "XOF",
        status: enrollment.refundedAt
          ? ("REFUNDED" as const)
          : ("PAID" as const),
        progress: enrollment.progress,
        completedAt: enrollment.completedAt,
        refundRequested: enrollment.refundRequested,
        refundReason: enrollment.refundReason,
        refundedAt: enrollment.refundedAt,
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
      });
    }

    const purchase = await prisma.digitalProductPurchase.findFirst({
      where: { id, product: { instructeurId: ctx.instructeurId } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            productType: true,
            price: true,
          },
        },
      },
    });
    if (purchase) {
      return apiSuccess({
        id: purchase.id,
        kind: "product" as const,
        productId: purchase.productId,
        productSlug: purchase.product.slug,
        productTitle: purchase.product.title,
        productType: purchase.product.productType,
        buyer: purchase.user,
        amount: purchase.paidAmount,
        currency: "XOF",
        status: "PAID" as const,
        downloadCount: purchase.downloadCount,
        maxDownloads: purchase.maxDownloads,
        licenseKey: purchase.licenseKey,
        createdAt: purchase.createdAt,
      });
    }

    return apiError("NOT_FOUND", "Commande introuvable", 404);
  } catch (err) {
    console.error("[v1/orders/:id GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}

/**
 * PATCH /api/v1/orders/:id
 *
 * Met à jour une commande. Actions limitées :
 *   - Pour formation (Enrollment) : initier un remboursement
 *     Body: { action: "refund", reason?: string }
 *   - Pour digital product : aucune action de modification supportée pour l'instant
 *
 * NB : le remboursement effectif (transfert d'argent) reste manuel côté admin.
 * Cette action marque l'inscription comme remboursée.
 *
 * Scope requis : write:orders
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "write:orders" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("INVALID_PARAMS", "Body JSON invalide", 400);
    }

    const action = (body as Record<string, unknown>).action;
    const reason = (body as Record<string, unknown>).reason;

    if (action !== "refund") {
      return apiError(
        "INVALID_PARAMS",
        "Action non supportée. Seul 'refund' est accepté pour les enrollments.",
        400,
      );
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { id, formation: { instructeurId: ctx.instructeurId } },
      select: { id: true, refundedAt: true },
    });
    if (!enrollment) {
      return apiError(
        "NOT_FOUND",
        "Commande introuvable ou non remboursable via cet endpoint",
        404,
      );
    }
    if (enrollment.refundedAt) {
      return apiError(
        "INVALID_PARAMS",
        "Cette commande a déjà été remboursée",
        400,
      );
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        refundRequested: true,
        refundReason: typeof reason === "string" ? reason.slice(0, 500) : null,
        refundedAt: new Date(),
      },
      select: { id: true, refundedAt: true, refundReason: true },
    });

    return apiSuccess({
      id: updated.id,
      kind: "formation",
      status: "REFUNDED",
      refundedAt: updated.refundedAt,
      refundReason: updated.refundReason,
    });
  } catch (err) {
    console.error("[v1/orders/:id PATCH]", err);
    return apiError(
      "SERVER_ERROR",
      err instanceof Error ? err.message : "Erreur serveur",
      500,
    );
  }
}
