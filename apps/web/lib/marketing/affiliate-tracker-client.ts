/**
 * FreelanceHigh — Affiliate Tracker (Client-safe)
 *
 * Fonctions utilisables cote client (navigateur) :
 * - Gestion des cookies affilies
 * - Parsing des liens affilies
 * - Generation de codes affilies
 * - Calcul des commissions
 *
 * Ce fichier n'importe PAS de modules Node.js (fs, path)
 * et peut etre importe en toute securite dans des composants "use client".
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface AffiliateClickRecord {
  id: string;
  affiliateCode: string;
  affiliateId?: string;
  visitorId: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  landingPage?: string;
  converted: boolean;
  conversionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AffiliateConversionRecord {
  id: string;
  affiliateCode: string;
  affiliateId?: string;
  orderId: string;
  orderAmount: number;
  orderType: string;
  commissionPct: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  createdAt: string;
}

export interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalEarned: number;
  pendingEarnings: number;
}

// ── Client-side Cookie Helpers ───────────────────────────────────────────────

const AFFILIATE_COOKIE_NAME = "fh_ref";

/**
 * Get the affiliate code from the cookie (client-side only).
 * Returns null if not in a browser environment or no cookie found.
 */
export function getAffiliateCookie(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === AFFILIATE_COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Set the affiliate cookie (client-side only).
 * @param code - The affiliate code
 * @param days - Cookie expiry in days (default: 30)
 */
export function setAffiliateCookie(code: string, days: number = 30): void {
  if (typeof document === "undefined") return;

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(code)};expires=${expires};path=/;SameSite=Lax;Secure`;
}

/**
 * Clear the affiliate cookie (client-side only).
 */
export function clearAffiliateCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AFFILIATE_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// ── Affiliate Code Generation ────────────────────────────────────────────────

/**
 * Generate a unique 8-character affiliate code based on user ID.
 * Format: 3 chars from userId hash + 5 random alphanumeric chars.
 */
export function generateAffiliateCode(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hashPart = Math.abs(hash).toString(36).toUpperCase().padStart(3, "A").slice(0, 3);

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${hashPart}${randomPart}`;
}

// ── Link Parsing ─────────────────────────────────────────────────────────────

/**
 * Extract affiliate reference code from a URL.
 */
export function parseAffiliateLink(url: string): string | null {
  try {
    const parsed = new URL(url, "https://freelancehigh.com");

    const ref = parsed.searchParams.get("ref") || parsed.searchParams.get("affiliate");
    if (ref && ref.length >= 6 && ref.length <= 12) return ref;

    const pathMatch = parsed.pathname.match(/^\/a\/([A-Za-z0-9]{6,12})$/);
    if (pathMatch) return pathMatch[1];

    return null;
  } catch {
    return null;
  }
}

// ── Commission Calculation ───────────────────────────────────────────────────

/**
 * Calculate the commission amount from a sale.
 * Rounds to 2 decimal places.
 */
export function calculateCommission(amount: number, commissionPct: number): number {
  if (amount <= 0 || commissionPct <= 0) return 0;
  return Math.round((amount * commissionPct) / 100 * 100) / 100;
}
