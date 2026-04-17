// Novakou — Helpers escrow (période de "hold" de 24h après la vente/séance).
// Les fonds issus d'une vente récente (< HOLD_PERIOD_HOURS) ne sont pas encore
// retirables. Cela laisse le temps à l'acheteur de signaler un éventuel problème.

import { VENDOR_NET_RATE } from "./constants";

/** Durée (en heures) pendant laquelle les fonds d'une vente sont bloqués avant d'être retirables. */
export const HOLD_PERIOD_HOURS = 24;

/**
 * Seuil de date : toute vente dont le timestamp est < threshold est "released".
 * Toute vente avec timestamp >= threshold est "pendingHold".
 */
export function holdThreshold(now: Date = new Date()): Date {
  return new Date(now.getTime() - HOLD_PERIOD_HOURS * 60 * 60 * 1000);
}

/** Une vente minimale (formation, produit digital, ou booking mentor). */
export interface SaleLike {
  paidAmount: number;
  /** Date utilisée pour le calcul du hold (createdAt pour enrollments/purchases, completedAt pour MentorBooking). */
  timestamp: Date;
}

export interface HoldStatus {
  released: SaleLike[];
  pendingHold: SaleLike[];
  grossReleased: number;
  grossPending: number;
  netReleased: number;
  netPending: number;
}

/**
 * Sépare les ventes en "released" (>24h, retirables) et "pendingHold" (<24h).
 * Calcule les totaux bruts et nets (après commission plateforme 5%).
 */
export function computeHoldStatus(sales: SaleLike[], now: Date = new Date()): HoldStatus {
  const threshold = holdThreshold(now);
  const released: SaleLike[] = [];
  const pendingHold: SaleLike[] = [];
  for (const s of sales) {
    if (s.timestamp < threshold) released.push(s);
    else pendingHold.push(s);
  }
  const grossReleased = released.reduce((a, s) => a + s.paidAmount, 0);
  const grossPending = pendingHold.reduce((a, s) => a + s.paidAmount, 0);
  const netReleased = Math.round(grossReleased * VENDOR_NET_RATE);
  const netPending = Math.round(grossPending * VENDOR_NET_RATE);
  return { released, pendingHold, grossReleased, grossPending, netReleased, netPending };
}
