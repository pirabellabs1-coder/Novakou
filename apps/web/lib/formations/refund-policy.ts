/**
 * Refund policy — single source of truth for all refund eligibility checks.
 *
 * Rules (all configurable via FormationsConfig admin UI) :
 *  1. Window      : achat doit dater de < `refund_window_days` jours (default 7)
 *  2. Consumed    : leçons terminées <= `max_consumed_pct` (default 30%)
 *  3. Rate-limit  : acheteur a effectué < `max_refunds_per_buyer_30d` (default 1)
 *                   remboursements approuvés sur les 30 derniers jours
 *  4. Mentor      : annulation > `mentor_cancel_hours` avant la séance (default 24h)
 *  5. Auto-approve: si `auto_approve_refunds`=true ET toutes les conditions ci-dessus
 *                   sont remplies, le RefundRequest est créé en APPROVED et le
 *                   handler admin est appelé immédiatement
 *
 * Tous les checks tiennent compte du faux positif "déjà remboursé" (idempotence).
 */

import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────
export type RefundTarget =
  | { kind: "enrollment"; enrollmentId: string }
  | { kind: "product"; purchaseId: string }
  | { kind: "booking"; bookingId: string };

export interface RefundPolicyConfig {
  windowDays: number;
  maxConsumedPct: number;
  maxRefundsPerBuyer30d: number;
  mentorCancelHours: number;
  autoApprove: boolean;
}

export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  /** Diagnostic info (sent back to UI) */
  details: {
    purchasedAt?: Date;
    daysSincePurchase?: number;
    consumedPct?: number;
    recentRefundsCount?: number;
    hoursToSession?: number;
  };
  config: RefundPolicyConfig;
}

// ── Defaults ─────────────────────────────────────────────────────────────
const DEFAULTS: RefundPolicyConfig = {
  windowDays: 7,
  maxConsumedPct: 30,
  maxRefundsPerBuyer30d: 1,
  mentorCancelHours: 24,
  autoApprove: false,
};

// ── Config loader ────────────────────────────────────────────────────────
let cachedConfig: { value: RefundPolicyConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 min

export async function loadRefundConfig(): Promise<RefundPolicyConfig> {
  const now = Date.now();
  if (cachedConfig && cachedConfig.expiresAt > now) return cachedConfig.value;

  try {
    const rows = await prisma.formationsConfig.findMany({
      where: {
        key: {
          in: [
            "refund_window_days",
            "max_consumed_pct",
            "max_refunds_per_buyer_30d",
            "mentor_cancel_hours",
            "auto_approve_refunds",
          ],
        },
      },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const cfg: RefundPolicyConfig = {
      windowDays: parseIntOr(map.get("refund_window_days"), DEFAULTS.windowDays),
      maxConsumedPct: parseIntOr(map.get("max_consumed_pct"), DEFAULTS.maxConsumedPct),
      maxRefundsPerBuyer30d: parseIntOr(
        map.get("max_refunds_per_buyer_30d"),
        DEFAULTS.maxRefundsPerBuyer30d,
      ),
      mentorCancelHours: parseIntOr(map.get("mentor_cancel_hours"), DEFAULTS.mentorCancelHours),
      autoApprove: (map.get("auto_approve_refunds") ?? "false").toLowerCase() === "true",
    };
    cachedConfig = { value: cfg, expiresAt: now + CACHE_TTL_MS };
    return cfg;
  } catch (err) {
    console.error("[refund-policy.loadRefundConfig]", err);
    return DEFAULTS;
  }
}

function parseIntOr(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// ── Eligibility check (the main entry point) ────────────────────────────
export async function checkRefundEligibility(
  userId: string,
  target: RefundTarget,
): Promise<RefundEligibility> {
  const config = await loadRefundConfig();
  const now = Date.now();

  // ── Rate-limit check (common to all kinds) ─────────────────────────
  const cutoff30d = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const recentRefundsCount = await prisma.refundRequest.count({
    where: {
      userId,
      status: { in: ["APPROVED"] },
      resolvedAt: { gte: cutoff30d },
    },
  });
  if (recentRefundsCount >= config.maxRefundsPerBuyer30d) {
    return {
      eligible: false,
      reason: `Limite atteinte : ${config.maxRefundsPerBuyer30d} remboursement${
        config.maxRefundsPerBuyer30d > 1 ? "s" : ""
      } par acheteur tous les 30 jours.`,
      details: { recentRefundsCount },
      config,
    };
  }

  // ── Per-kind checks ────────────────────────────────────────────────
  if (target.kind === "enrollment") {
    const enr = await prisma.enrollment.findUnique({
      where: { id: target.enrollmentId },
      select: {
        id: true,
        userId: true,
        formationId: true,
        progress: true,
        createdAt: true,
        refundedAt: true,
        refundRequested: true,
      },
    });
    if (!enr) return notEligible("Inscription introuvable.", config);
    if (enr.userId !== userId)
      return notEligible("Cette inscription ne vous appartient pas.", config);
    if (enr.refundedAt)
      return notEligible("Cette formation a déjà été remboursée.", config);
    if (enr.refundRequested)
      return notEligible("Une demande de remboursement est déjà en cours.", config);

    const purchasedAt = enr.createdAt;
    const daysSincePurchase = (now - purchasedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSincePurchase > config.windowDays) {
      return {
        eligible: false,
        reason: `La fenêtre de remboursement de ${config.windowDays} jours est dépassée.`,
        details: { purchasedAt, daysSincePurchase: Math.round(daysSincePurchase * 10) / 10, recentRefundsCount },
        config,
      };
    }

    const consumedPct = Math.round(enr.progress);
    if (consumedPct > config.maxConsumedPct) {
      return {
        eligible: false,
        reason: `Vous avez consommé ${consumedPct}% du contenu (plafond ${config.maxConsumedPct}%).`,
        details: { purchasedAt, daysSincePurchase, consumedPct, recentRefundsCount },
        config,
      };
    }

    return {
      eligible: true,
      details: {
        purchasedAt,
        daysSincePurchase: Math.round(daysSincePurchase * 10) / 10,
        consumedPct,
        recentRefundsCount,
      },
      config,
    };
  }

  if (target.kind === "product") {
    const purchase = await prisma.digitalProductPurchase.findUnique({
      where: { id: target.purchaseId },
      select: {
        id: true,
        userId: true,
        productId: true,
        createdAt: true,
        downloadCount: true,
      },
    });
    if (!purchase) return notEligible("Achat introuvable.", config);
    if (purchase.userId !== userId)
      return notEligible("Cet achat ne vous appartient pas.", config);

    // Idempotency: any prior approved RefundRequest for this purchase ?
    const prior = await prisma.refundRequest.findFirst({
      where: {
        userId,
        status: "APPROVED",
        // RefundRequest.enrollmentId is the only id field — for products we
        // store productId in adminNote or fall back to checking PlatformRevenue.
        // Here we use the metadata convention : adminNote includes "product:<id>"
      },
      select: { id: true, adminNote: true },
    });
    if (prior?.adminNote?.includes(`product:${purchase.productId}`)) {
      return notEligible("Ce produit a déjà été remboursé.", config);
    }

    const purchasedAt = purchase.createdAt;
    const daysSincePurchase = (now - purchasedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSincePurchase > config.windowDays) {
      return {
        eligible: false,
        reason: `La fenêtre de remboursement de ${config.windowDays} jours est dépassée.`,
        details: { purchasedAt, daysSincePurchase, recentRefundsCount },
        config,
      };
    }
    if (purchase.downloadCount > 0) {
      return {
        eligible: false,
        reason:
          "Le produit a déjà été téléchargé. Conformément aux CGV, le téléchargement vaut renonciation au droit de rétractation.",
        details: { purchasedAt, daysSincePurchase, recentRefundsCount },
        config,
      };
    }

    return {
      eligible: true,
      details: { purchasedAt, daysSincePurchase, recentRefundsCount },
      config,
    };
  }

  if (target.kind === "booking") {
    const booking = await prisma.mentorBooking.findUnique({
      where: { id: target.bookingId },
      select: {
        id: true,
        studentId: true,
        scheduledAt: true,
        status: true,
        escrowStatus: true,
      },
    });
    if (!booking) return notEligible("Réservation introuvable.", config);
    if (booking.studentId !== userId)
      return notEligible("Cette réservation ne vous appartient pas.", config);
    if (booking.escrowStatus === "REFUNDED")
      return notEligible("Cette séance a déjà été remboursée.", config);
    if (booking.status === "CANCELLED")
      return notEligible("Cette séance est déjà annulée.", config);
    if (!booking.scheduledAt)
      return notEligible("Date de séance non définie.", config);

    const hoursToSession = (booking.scheduledAt.getTime() - now) / (60 * 60 * 1000);
    if (hoursToSession < config.mentorCancelHours) {
      return {
        eligible: false,
        reason: `Préavis insuffisant : il reste ${Math.max(0, Math.round(hoursToSession))}h avant la séance, minimum requis ${config.mentorCancelHours}h.`,
        details: { hoursToSession, recentRefundsCount },
        config,
      };
    }
    return {
      eligible: true,
      details: { hoursToSession: Math.round(hoursToSession), recentRefundsCount },
      config,
    };
  }

  return notEligible("Type de demande non reconnu.", config);
}

function notEligible(reason: string, config: RefundPolicyConfig): RefundEligibility {
  return { eligible: false, reason, details: {}, config };
}

// ── Reset cache (called from config admin PATCH) ────────────────────────
export function invalidateRefundConfigCache() {
  cachedConfig = null;
}
