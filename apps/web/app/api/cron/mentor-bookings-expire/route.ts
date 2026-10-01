/**
 * Cron : expiration des réservations de mentorat abandonnées.
 *
 * Cas couvert : un apprenant ouvre le paiement d'une séance (la réservation
 * est créée en PAYMENT_PENDING) puis n'achève jamais le paiement. Aucun
 * webhook n'arrive, la réservation reste PAYMENT_PENDING indéfiniment. Depuis
 * que PAYMENT_PENDING tient le créneau (anti double-paiement, cf. lib/mentor/
 * slots.ts), une réservation abandonnée bloquerait le créneau à jamais sans
 * ce nettoyage. Un cas réel traînait depuis 3 jours (constaté le 2026-10-01).
 *
 * SÛRETÉ ABSOLUE — argent réel : on ne clôture QUE les réservations SANS la
 * moindre trace de paiement (pas de `paymentRef`, pas de `paidAt`, escrow
 * NONE). Une séance réellement payée n'est jamais touchée ; elle sera livrée
 * par la réconciliation même si le webhook a tardé.
 *
 * Délai : 2 h. Aucun paiement Mobile Money ne reste « en attente » 2 h ; un
 * créneau tenu au plus 2 h par un paiement abandonné est un compromis
 * acceptable face au risque, bien pire, d'un double-paiement du même créneau.
 *
 * Authentification : Bearer CRON_SECRET. Idempotent.
 * Cadence : toutes les 15 minutes.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // 2 heures

async function handle(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  const result = await prisma.mentorBooking.updateMany({
    where: {
      status: "PAYMENT_PENDING",
      createdAt: { lte: cutoff },
      // Aucune trace de paiement : on ne clôture que ce qui n'a rien encaissé.
      paymentRef: null,
      paidAt: null,
      escrowStatus: "NONE",
    },
    data: { status: "CANCELLED" },
  });

  if (result.count > 0) {
    console.log(`[mentor-bookings-expire] ${result.count} réservation(s) abandonnée(s) clôturée(s)`);
  }

  return NextResponse.json({
    ok: true,
    expiredCount: result.count,
    cutoff: cutoff.toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
