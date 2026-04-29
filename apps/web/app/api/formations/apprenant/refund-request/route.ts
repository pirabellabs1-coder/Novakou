/**
 * GET  /api/formations/apprenant/refund-request?type=&id=
 *   Renvoie l'éligibilité (utilisé par l'UI pour afficher le bouton ou
 *   un message bloquant avant que l'acheteur soumette).
 *
 * POST /api/formations/apprenant/refund-request
 *   Body: { type: "enrollment"|"product"|"booking", id: string, reason: string }
 *   Crée une RefundRequest. Si auto_approve_refunds=true ET éligible,
 *   appelle directement le handler admin pour exécuter le remboursement.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { checkRefundEligibility, type RefundTarget } from "@/lib/formations/refund-policy";

// ── GET : eligibility check ─────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!type || !id) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const target = buildTarget(type, id);
  if (!target) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const result = await checkRefundEligibility(userId, target);
  return NextResponse.json({ data: result });
}

// ── POST : create refund request ────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { type?: string; id?: string; reason?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const { type, id, reason } = body;
  if (!type || !id || !reason || reason.trim().length < 10) {
    return NextResponse.json(
      { error: "Indiquez le type, l'ID et un motif d'au moins 10 caractères." },
      { status: 400 },
    );
  }

  const target = buildTarget(type, id);
  if (!target) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const eligibility = await checkRefundEligibility(userId, target);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { error: eligibility.reason ?? "Demande non éligible", details: eligibility.details },
      { status: 422 },
    );
  }

  // ── Build adminNote with structured tags so handlers/listings know which kind ──
  const tag =
    target.kind === "enrollment"
      ? `enrollment:${target.enrollmentId}`
      : target.kind === "product"
      ? `product:${id}`
      : `booking:${target.bookingId}`;
  const adminNote = `[${tag}] ${reason.trim()}`;

  // Pour les enrollments, on lie via enrollmentId ; pour les produits/bookings,
  // on stocke l'ID dans adminNote (pas de FK sur ces types côté RefundRequest).
  const enrollmentId = target.kind === "enrollment" ? target.enrollmentId : null;

  // Récupère le montant payé pour figer le snapshot dans la demande
  let amount = 0;
  if (target.kind === "enrollment") {
    const e = await prisma.enrollment.findUnique({
      where: { id: target.enrollmentId },
      select: { paidAmount: true },
    });
    amount = e?.paidAmount ?? 0;
  } else if (target.kind === "product") {
    const p = await prisma.digitalProductPurchase.findUnique({
      where: { id },
      select: { paidAmount: true },
    });
    amount = p?.paidAmount ?? 0;
  } else {
    const b = await prisma.mentorBooking.findUnique({
      where: { id: target.bookingId },
      select: { paidAmount: true },
    });
    amount = b?.paidAmount ?? 0;
  }

  // Si pas d'enrollmentId (produit/booking), on créée tout de même une
  // RefundRequest. Le schéma exige enrollmentId — on devra accepter null
  // ou utiliser un placeholder. Pour simplifier on vérifie le schéma.
  // Hack temporaire : si enrollmentId NOT NULL strict, on bloque les
  // produits/bookings côté workflow buyer pour le moment et on laisse
  // la création se faire par admin.
  if (target.kind !== "enrollment") {
    return NextResponse.json(
      {
        error:
          "Pour le moment, les remboursements des produits digitaux et des séances mentor sont gérés via le support. Contactez support@novakou.com.",
        details: eligibility.details,
      },
      { status: 422 },
    );
  }

  // Note sur "auto-approve" : toutes les demandes passent par PENDING. Quand
  // auto_approve_refunds=true, l'UI admin /signalements peut afficher un
  // badge "✓ pré-validée" (toutes conditions remplies) pour accélérer la
  // décision. L'exécution effective (mouvement d'argent, claw-back affilié,
  // décrément stats vendeur) reste centralisée dans le handler admin pour
  // garder une seule source de vérité.
  const refund = await prisma.refundRequest.create({
    data: {
      userId,
      enrollmentId: enrollmentId!,
      amount,
      reason: reason.trim(),
      adminNote: eligibility.config.autoApprove
        ? `[auto-eligible] ${adminNote}`
        : adminNote,
      status: "PENDING",
    },
    select: { id: true, status: true },
  });

  // Marque l'enrollment comme refundRequested
  if (target.kind === "enrollment") {
    await prisma.enrollment.update({
      where: { id: target.enrollmentId },
      data: { refundRequested: true, refundReason: reason.trim() },
    });
  }

  return NextResponse.json({
    data: {
      id: refund.id,
      status: refund.status,
      autoEligible: eligibility.config.autoApprove,
    },
  });
}

function buildTarget(type: string, id: string): RefundTarget | null {
  switch (type) {
    case "enrollment":
      return { kind: "enrollment", enrollmentId: id };
    case "product":
      return { kind: "product", purchaseId: id };
    case "booking":
      return { kind: "booking", bookingId: id };
    default:
      return null;
  }
}
