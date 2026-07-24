import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { computeCheckoutDiscount } from "@/lib/formations/checkout-discount";

/**
 * POST /api/formations/public/validate-discount
 * Body: { code: string, subTotal?: number, orderAmount?: number,
 *         formationIds?: string[], productIds?: string[] }
 * Returns: { valid, discountAmount, finalAmount, discountType, discountValue, error? }
 *
 * Aperçu live du code promo au checkout. Quand le panier (formationIds/
 * productIds) est fourni, on passe par computeCheckoutDiscount — EXACTEMENT la
 * même logique que le débit réel (propriétaire du code + portée + gardes) — pour
 * ne jamais afficher une remise que le checkout refuserait. Sinon, repli legacy
 * sur le sous-total brut (compat autres appelants).
 */

const REASON_FR: Record<string, string> = {
  invalid: "Code invalide",
  expired: "Code expiré",
  exhausted: "Code épuisé",
  not_applicable: "Code non applicable à votre panier",
  min_not_met: "Montant minimum non atteint",
  first_order_only: "Code réservé à la première commande",
  per_user_limit: "Limite d'utilisation atteinte pour ce compte",
  zero: "Ce code ne réduit pas cette commande",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const codeStr = String(body.code ?? "").trim().toUpperCase();
    const formationIds: string[] = Array.isArray(body.formationIds) ? body.formationIds.map(String) : [];
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds.map(String) : [];

    if (!codeStr) {
      return NextResponse.json({ valid: false, error: "Code requis" }, { status: 400 });
    }

    // ── Chemin panier-conscient : source de vérité identique au checkout ──
    if (formationIds.length > 0 || productIds.length > 0) {
      const [formations, products, session] = await Promise.all([
        formationIds.length > 0
          ? prisma.formation.findMany({
              where: { id: { in: formationIds }, status: "ACTIF" },
              select: { id: true, price: true, instructeurId: true },
            })
          : Promise.resolve([] as { id: string; price: number; instructeurId: string }[]),
        productIds.length > 0
          ? prisma.digitalProduct.findMany({
              where: { id: { in: productIds }, status: "ACTIF" },
              select: { id: true, price: true, instructeurId: true },
            })
          : Promise.resolve([] as { id: string; price: number; instructeurId: string }[]),
        getServerSession(authOptions),
      ]);

      const cartSubtotal =
        formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0);
      const userId = session?.user?.id ?? null;

      const disc = await computeCheckoutDiscount(codeStr, userId, [
        ...formations.map((f) => ({ id: f.id, kind: "formation" as const, price: f.price, instructeurId: f.instructeurId })),
        ...products.map((p) => ({ id: p.id, kind: "product" as const, price: p.price, instructeurId: p.instructeurId })),
      ]);

      if (!disc.applied) {
        return NextResponse.json({
          valid: false,
          error: REASON_FR[disc.reason ?? "invalid"] ?? "Code invalide",
        });
      }

      // Champs d'affichage (type / valeur) pour le libellé « -X% ».
      const meta = disc.codeId
        ? await prisma.discountCode.findUnique({
            where: { id: disc.codeId },
            select: { discountType: true, discountValue: true },
          })
        : null;

      return NextResponse.json({
        valid: true,
        code: disc.code,
        discountType: meta?.discountType ?? null,
        discountValue: meta?.discountValue ?? null,
        discountAmount: disc.discountAmount,
        finalAmount: Math.max(0, cartSubtotal - disc.discountAmount),
      });
    }

    // ── Repli legacy (aucune ligne fournie) : remise sur sous-total brut ──
    const subTotal = Number(body.subTotal ?? body.orderAmount ?? 0);
    if (subTotal <= 0) {
      return NextResponse.json({ valid: false, error: "Montant invalide" }, { status: 400 });
    }

    const code = await prisma.discountCode.findUnique({ where: { code: codeStr } });
    if (!code || !code.isActive) {
      return NextResponse.json({ valid: false, error: "Code invalide" });
    }
    if (code.expiresAt && code.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "Code expiré" });
    }
    if (code.maxUses && code.usedCount >= code.maxUses) {
      return NextResponse.json({ valid: false, error: "Code épuisé" });
    }
    if (code.minOrderAmount && subTotal < code.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        error: `Montant minimum : ${code.minOrderAmount.toLocaleString("fr-FR")} FCFA`,
      });
    }

    const discountAmount = code.discountType === "PERCENTAGE"
      ? Math.round(subTotal * (code.discountValue / 100))
      : Math.min(code.discountValue, subTotal);
    const finalAmount = Math.max(0, subTotal - discountAmount);

    return NextResponse.json({
      valid: true,
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue,
      discountAmount,
      finalAmount,
    });
  } catch (err) {
    console.error("[validate-discount]", err);
    return NextResponse.json({ valid: false, error: "Erreur serveur" }, { status: 500 });
  }
}
