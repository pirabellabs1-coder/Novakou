import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/formations/public/validate-discount
 * Body: { code: string, subTotal: number }
 * Returns: { valid: boolean, discountAmount, finalAmount, error?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const codeStr = String(body.code ?? "").trim().toUpperCase();
    const subTotal = Number(body.subTotal ?? 0);

    if (!codeStr) {
      return NextResponse.json({ valid: false, error: "Code requis" }, { status: 400 });
    }
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
