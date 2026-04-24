import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/formations/public/checkout-attempt
 *
 * Enregistre une tentative de paiement (reussie, echouee ou abandonnee).
 * Appele par le frontend checkout lors de :
 *   - START : ouverture du checkout (opt: enregistrer start pour analytics)
 *   - FAIL  : erreur retournee par Moneroo/provider
 *   - COMPLETE : paiement reussi (pour stats et dedoublonner les relances)
 *
 * Body: {
 *   action: "start" | "fail" | "complete" | "abandon",
 *   attemptId?: string (pour update),
 *   instructeurId?, shopId?, formationId?, productId?, funnelId?,
 *   visitorEmail?, visitorName?, visitorPhone?,
 *   amount: number, currency?: "XOF",
 *   paymentMethod?, failureReason?, failureCode?, providerRef?,
 *   metadata?: object
 * }
 *
 * Retourne: { id } pour que le frontend puisse mettre a jour le meme attempt.
 */
export const dynamic = "force-dynamic";

const VALID_ACTIONS = new Set(["start", "fail", "complete", "abandon"]);

type ActionToStatus = "STARTED" | "FAILED" | "COMPLETED" | "ABANDONED";
const ACTION_TO_STATUS: Record<string, ActionToStatus> = {
  start: "STARTED",
  fail: "FAILED",
  complete: "COMPLETED",
  abandon: "ABANDONED",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      attemptId,
      instructeurId,
      shopId,
      formationId,
      productId,
      funnelId,
      visitorEmail,
      visitorName,
      visitorPhone,
      amount,
      currency,
      paymentMethod,
      failureReason,
      failureCode,
      providerRef,
      metadata,
    } = body as {
      action?: string;
      attemptId?: string;
      instructeurId?: string;
      shopId?: string;
      formationId?: string;
      productId?: string;
      funnelId?: string;
      visitorEmail?: string;
      visitorName?: string;
      visitorPhone?: string;
      amount?: number;
      currency?: string;
      paymentMethod?: string;
      failureReason?: string;
      failureCode?: string;
      providerRef?: string;
      metadata?: Record<string, unknown>;
    };

    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "action requis : start | fail | complete | abandon" },
        { status: 400 },
      );
    }
    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "amount numerique requis" }, { status: 400 });
    }

    const status = ACTION_TO_STATUS[action];
    const now = new Date();

    // Si attemptId fourni → update l'existant
    if (attemptId) {
      try {
        const updated = await prisma.checkoutAttempt.update({
          where: { id: attemptId },
          data: {
            status,
            ...(typeof visitorEmail === "string" && { visitorEmail: visitorEmail.toLowerCase().trim() }),
            ...(typeof visitorName === "string" && { visitorName: visitorName.trim() }),
            ...(typeof visitorPhone === "string" && { visitorPhone: visitorPhone.trim() }),
            ...(typeof paymentMethod === "string" && { paymentMethod }),
            ...(typeof failureReason === "string" && { failureReason }),
            ...(typeof failureCode === "string" && { failureCode }),
            ...(typeof providerRef === "string" && { providerRef }),
            ...(action === "complete" && { recoveredAt: now }),
            ...(metadata && { metadata: metadata as never }),
          },
          select: { id: true, status: true },
        });
        return NextResponse.json({ data: updated });
      } catch {
        // Fallthrough : si l'id n'existe pas on cree un nouveau
      }
    }

    // Creation d'un nouvel attempt
    const created = await prisma.checkoutAttempt.create({
      data: {
        status,
        instructeurId: instructeurId ?? null,
        shopId: shopId ?? null,
        formationId: formationId ?? null,
        productId: productId ?? null,
        funnelId: funnelId ?? null,
        visitorEmail: visitorEmail?.toLowerCase().trim() ?? null,
        visitorName: visitorName?.trim() ?? null,
        visitorPhone: visitorPhone?.trim() ?? null,
        amount,
        currency: currency ?? "XOF",
        paymentMethod: paymentMethod ?? null,
        failureReason: failureReason ?? null,
        failureCode: failureCode ?? null,
        providerRef: providerRef ?? null,
        recoveredAt: action === "complete" ? now : null,
        metadata: (metadata as never) ?? null,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ data: created });
  } catch (err) {
    console.error("[public/checkout-attempt POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
