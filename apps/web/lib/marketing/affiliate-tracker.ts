/**
 * Novakou — Affiliate Tracker
 *
 * Fonctions utilitaires pour le suivi des affilies :
 * - Generation de codes affilies uniques
 * - Parsing des liens affilies
 * - Suivi des clics et conversions
 * - Calcul des commissions
 * - Gestion des cookies affilies (cote client)
 *
 * En mode DEV (DEV_MODE=true), les donnees sont stockees dans des fichiers JSON.
 * En production, utilise Prisma (AffiliateProfile, AffiliateClick, AffiliateCommission).
 */

import { IS_DEV } from "../prisma";
import fs from "fs";
import path from "path";

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

// ── DEV Mode Store ───────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "lib", "dev");
const CLICKS_FILE = path.join(DATA_DIR, "affiliate-clicks.json");
const CONVERSIONS_FILE = path.join(DATA_DIR, "affiliate-conversions.json");

function ensureDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    ensureDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

// ── Affiliate Code Generation ────────────────────────────────────────────────

/**
 * Generate a unique 8-character affiliate code based on user ID.
 * Format: 3 chars from userId hash + 5 random alphanumeric chars.
 */
export function generateAffiliateCode(userId: string): string {
  // Simple hash from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const hashPart = Math.abs(hash).toString(36).toUpperCase().padStart(3, "A").slice(0, 3);

  // Random 5-char alphanumeric
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (I/O/0/1)
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${hashPart}${randomPart}`;
}

// ── Link Parsing ─────────────────────────────────────────────────────────────

/**
 * Extract affiliate reference code from a URL.
 * Supports formats:
 *   - ?ref=CODE
 *   - ?affiliate=CODE
 *   - /a/CODE (path-based)
 */
export function parseAffiliateLink(url: string): string | null {
  try {
    const parsed = new URL(url, "https://novakou.com");

    // Check query parameters
    const ref = parsed.searchParams.get("ref") || parsed.searchParams.get("affiliate");
    if (ref && ref.length >= 6 && ref.length <= 12) return ref;

    // Check path-based: /a/CODE
    const pathMatch = parsed.pathname.match(/^\/a\/([A-Za-z0-9]{6,12})$/);
    if (pathMatch) return pathMatch[1];

    return null;
  } catch {
    return null;
  }
}

// ── Click Tracking ───────────────────────────────────────────────────────────

/**
 * Record an affiliate click.
 * Called when a visitor arrives via an affiliate link.
 */
export async function trackClick(
  affiliateCode: string,
  visitorId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  // Validate affiliate code format before recording
  if (!affiliateCode || affiliateCode.length < 6 || affiliateCode.length > 12) {
    console.warn(`[Affiliate] Invalid affiliate code format: "${affiliateCode}"`);
    return;
  }

  const click: AffiliateClickRecord = {
    id: `aclk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    affiliateCode,
    visitorId,
    ip: metadata.ip as string | undefined,
    userAgent: metadata.userAgent as string | undefined,
    referer: metadata.referer as string | undefined,
    landingPage: metadata.landingPage as string | undefined,
    converted: false,
    metadata,
    createdAt: new Date().toISOString(),
  };

  if (IS_DEV) {
    const clicks = readJson<AffiliateClickRecord[]>(CLICKS_FILE, []);
    clicks.push(click);
    // Keep last 5000 clicks
    const trimmed = clicks.slice(-5000);
    writeJson(CLICKS_FILE, trimmed);
    console.log(`[Affiliate] Click tracked: code=${affiliateCode}, visitor=${visitorId}`);
  } else {
    // Production: use Prisma
    try {
      const prismaModule = await import("@freelancehigh/db");
      const prisma = prismaModule.prisma;

      // Find the affiliate profile by code
      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { affiliateCode },
      });

      if (!affiliate) {
        console.warn(`[Affiliate] Unknown affiliate code: ${affiliateCode}`);
        return;
      }

      await prisma.affiliateClick.create({
        data: {
          affiliateId: affiliate.id,
          visitorId,
          ip: metadata.ip as string | undefined,
          userAgent: metadata.userAgent as string | undefined,
          referer: metadata.referer as string | undefined,
          landingPage: metadata.landingPage as string | undefined,
        },
      });

      // Increment total clicks counter
      await prisma.affiliateProfile.update({
        where: { id: affiliate.id },
        data: { totalClicks: { increment: 1 } },
      });
    } catch (err) {
      console.error("[Affiliate] Error recording click:", err);
    }
  }
}

// ── Conversion Tracking ──────────────────────────────────────────────────────

/**
 * Record an affiliate conversion (sale attributed to an affiliate).
 * Called when a purchase is completed and an affiliate cookie is present.
 */
export async function trackConversion(
  affiliateCode: string,
  orderId: string,
  orderAmount: number,
  orderType: string
): Promise<void> {
  // Validate inputs
  if (!affiliateCode || affiliateCode.length < 6 || affiliateCode.length > 12) {
    console.warn(`[Affiliate] Invalid affiliate code for conversion: "${affiliateCode}"`);
    return;
  }
  if (orderAmount <= 0) {
    console.warn(`[Affiliate] Invalid order amount for conversion: ${orderAmount}`);
    return;
  }

  // Default commission rate; in production, read from AffiliateProgram
  const DEFAULT_COMMISSION_PCT = 20;

  if (IS_DEV) {
    // Find if there are clicks for this code
    const clicks = readJson<AffiliateClickRecord[]>(CLICKS_FILE, []);
    const matchingClicks = clicks.filter(
      (c) => c.affiliateCode === affiliateCode && !c.converted
    );

    // Mark the most recent unmatched click as converted
    if (matchingClicks.length > 0) {
      const lastClick = matchingClicks[matchingClicks.length - 1];
      lastClick.converted = true;
      lastClick.conversionId = orderId;
      writeJson(CLICKS_FILE, clicks);
    }

    const commissionAmount = calculateCommission(orderAmount, DEFAULT_COMMISSION_PCT);

    const conversion: AffiliateConversionRecord = {
      id: `aconv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      affiliateCode,
      orderId,
      orderAmount,
      orderType,
      commissionPct: DEFAULT_COMMISSION_PCT,
      commissionAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const conversions = readJson<AffiliateConversionRecord[]>(CONVERSIONS_FILE, []);
    conversions.push(conversion);
    writeJson(CONVERSIONS_FILE, conversions);

    console.log(
      `[Affiliate] Conversion tracked: code=${affiliateCode}, order=${orderId}, amount=${orderAmount}, commission=${commissionAmount}`
    );
  } else {
    // Production: use Prisma
    try {
      const prismaModule = await import("@freelancehigh/db");
      const prisma = prismaModule.prisma;

      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { affiliateCode },
        include: { program: true },
      });

      if (!affiliate) {
        console.warn(`[Affiliate] Unknown affiliate code for conversion: ${affiliateCode}`);
        return;
      }

      const commissionPct = affiliate.program.commissionPct;
      const commissionAmount = calculateCommission(orderAmount, commissionPct);

      await prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliate.id,
          orderId,
          orderType,
          orderAmount,
          commissionPct,
          commissionAmount,
          status: "PENDING",
        },
      });

      // Update affiliate profile counters
      await prisma.affiliateProfile.update({
        where: { id: affiliate.id },
        data: {
          totalConversions: { increment: 1 },
          totalEarned: { increment: commissionAmount },
          pendingEarnings: { increment: commissionAmount },
          conversionRate: affiliate.totalClicks > 0
            ? ((affiliate.totalConversions + 1) / affiliate.totalClicks) * 100
            : 0,
        },
      });

      // Mark related click as converted
      const latestClick = await prisma.affiliateClick.findFirst({
        where: { affiliateId: affiliate.id, converted: false },
        orderBy: { createdAt: "desc" },
      });

      if (latestClick) {
        await prisma.affiliateClick.update({
          where: { id: latestClick.id },
          data: { converted: true, conversionId: orderId },
        });
      }
    } catch (err) {
      console.error("[Affiliate] Error recording conversion:", err);
    }
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

// ── Affiliate Stats ──────────────────────────────────────────────────────────

/**
 * Get aggregate stats for an affiliate code.
 */
export function getAffiliateStats(affiliateCode: string): AffiliateStats {
  if (IS_DEV) {
    const clicks = readJson<AffiliateClickRecord[]>(CLICKS_FILE, []);
    const conversions = readJson<AffiliateConversionRecord[]>(CONVERSIONS_FILE, []);

    const codeClicks = clicks.filter((c) => c.affiliateCode === affiliateCode);
    const codeConversions = conversions.filter((c) => c.affiliateCode === affiliateCode);

    const totalClicks = codeClicks.length;
    const totalConversions = codeConversions.length;
    const totalEarned = codeConversions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingEarnings = codeConversions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    return {
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      totalEarned: Math.round(totalEarned * 100) / 100,
      pendingEarnings: Math.round(pendingEarnings * 100) / 100,
    };
  }

  return { totalClicks: 0, totalConversions: 0, conversionRate: 0, totalEarned: 0, pendingEarnings: 0 };
}

// ── Client-side Cookie Helpers ───────────────────────────────────────────────
// These functions are meant to be called from client components (browser only).

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

// ── Dev Helpers ──────────────────────────────────────────────────────────────

/**
 * Get all clicks for dev inspection.
 */
export function getAllClicks(): AffiliateClickRecord[] {
  return readJson<AffiliateClickRecord[]>(CLICKS_FILE, []);
}

/**
 * Get all conversions for dev inspection.
 */
export function getAllConversions(): AffiliateConversionRecord[] {
  return readJson<AffiliateConversionRecord[]>(CONVERSIONS_FILE, []);
}
