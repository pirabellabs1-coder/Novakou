// ─────────────────────────────────────────────────────────────────────────
// Source UNIQUE de vérité pour le calcul des soldes retirables (vendeur +
// mentor). Avant, ce calcul était dupliqué dans 3 endroits avec des règles
// DIVERGENTES (wallet GET, wallet POST, cron auto-payout) → soldes incohérents,
// mentors jamais payés, fenêtre de 24 h après remboursement. Tout passe
// désormais par ce module.
// ─────────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/prisma";
import { VENDOR_NET_RATE } from "./constants";
import { HOLD_PERIOD_HOURS } from "./escrow";

const HOLD_MS = HOLD_PERIOD_HOURS * 3_600_000;

// Les revenus vendeur sont enregistrés à l'ACHAT (hold 24 h). On inclut les 4
// types vendables. Les lignes NÉGATIVES (réversions de remboursement) ne sont
// PAS soumises au hold : elles réduisent le solde immédiatement, sinon un
// vendeur peut retirer de l'argent déjà remboursé pendant 24 h.
export const VENDOR_ORDER_TYPES = ["formation", "product", "bundle", "subscription"] as const;

export interface VendorBalance {
  releasedNet: number;   // retirable (ventes > 24 h, moins remboursements)
  pendingNet: number;    // en attente (ventes < 24 h)
  withdrawnPending: number;
  withdrawnTreated: number;
  available: number;     // releasedNet - retraits (EN_ATTENTE + TRAITE)
}

/**
 * Solde vendeur (boutique) à partir de PlatformRevenue.vendorAmount (déjà net
 * de la commission plateforme + de la part affilié).
 */
export async function computeVendorBalance(
  instructeurId: string,
  opts: { shopId?: string | null } = {},
): Promise<VendorBalance> {
  const shopId = opts.shopId ?? undefined;

  const rows = await prisma.platformRevenue.findMany({
    where: {
      instructeurId,
      orderType: { in: [...VENDOR_ORDER_TYPES] },
      ...(shopId ? { shopId } : {}),
    },
    select: { vendorAmount: true, createdAt: true },
  });

  const now = Date.now();
  let releasedNet = 0;
  let pendingNet = 0;
  for (const r of rows) {
    const amt = r.vendorAmount;
    if (amt < 0) {
      // Réversion (remboursement) → impacte le solde immédiatement.
      releasedNet += amt;
    } else if (now - new Date(r.createdAt).getTime() >= HOLD_MS) {
      releasedNet += amt;
    } else {
      pendingNet += amt;
    }
  }

  const withdrawals = await prisma.instructorWithdrawal.findMany({
    where: {
      instructeurId,
      NOT: { method: { endsWith: "_mentor" } },
      ...(shopId ? { shopId } : {}),
      status: { in: ["EN_ATTENTE", "TRAITE"] },
    },
    select: { amount: true, status: true },
  });
  const withdrawnPending = withdrawals.filter((w) => w.status === "EN_ATTENTE").reduce((s, w) => s + w.amount, 0);
  const withdrawnTreated = withdrawals.filter((w) => w.status === "TRAITE").reduce((s, w) => s + w.amount, 0);

  const available = Math.max(0, releasedNet - withdrawnPending - withdrawnTreated);
  return { releasedNet: Math.max(0, releasedNet), pendingNet, withdrawnPending, withdrawnTreated, available };
}

export interface MentorBalance {
  netReleased: number;   // retirable (sessions escrow RELEASED × net)
  netPending: number;    // escrow HELD
  netDisputed: number;   // escrow DISPUTED (bloqué)
  withdrawnPending: number;
  withdrawnTreated: number;
  available: number;
}

/**
 * Solde mentor à partir de mentorBooking.escrowStatus (source de vérité du
 * système d'escrow mentor). On N'utilise PAS PlatformRevenue ici : les lignes
 * mentor n'ont pas d'instructeurId, donc introuvables par vendeur. Les fonds
 * RELEASED ont déjà passé le hold escrow → retirables immédiatement.
 */
export async function computeMentorBalance(
  mentorId: string,
  instructeurId: string | null,
): Promise<MentorBalance> {
  const bookings = await prisma.mentorBooking.findMany({
    where: { mentorId, escrowStatus: { in: ["HELD", "RELEASED", "DISPUTED"] } },
    select: { paidAmount: true, escrowStatus: true },
  });

  let grossReleased = 0;
  let grossPending = 0;
  let grossDisputed = 0;
  for (const b of bookings) {
    if (b.escrowStatus === "RELEASED") grossReleased += b.paidAmount;
    else if (b.escrowStatus === "HELD") grossPending += b.paidAmount;
    else if (b.escrowStatus === "DISPUTED") grossDisputed += b.paidAmount;
  }
  const netReleased = Math.round(grossReleased * VENDOR_NET_RATE);
  const netPending = Math.round(grossPending * VENDOR_NET_RATE);
  const netDisputed = Math.round(grossDisputed * VENDOR_NET_RATE);

  let withdrawnPending = 0;
  let withdrawnTreated = 0;
  if (instructeurId) {
    const ws = await prisma.instructorWithdrawal.findMany({
      where: { instructeurId, method: { endsWith: "_mentor" }, status: { in: ["EN_ATTENTE", "TRAITE"] } },
      select: { amount: true, status: true },
    });
    withdrawnPending = ws.filter((w) => w.status === "EN_ATTENTE").reduce((s, w) => s + w.amount, 0);
    withdrawnTreated = ws.filter((w) => w.status === "TRAITE").reduce((s, w) => s + w.amount, 0);
  }

  const available = Math.max(0, netReleased - withdrawnPending - withdrawnTreated);
  return { netReleased, netPending, netDisputed, withdrawnPending, withdrawnTreated, available };
}
