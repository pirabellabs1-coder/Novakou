/**
 * FreelanceHigh — Discount Engine
 *
 * Logique de validation et d'application des codes de reduction.
 * Gere les codes promo classiques et les offres flash temporaires.
 *
 * En mode DEV (DEV_MODE=true), les donnees sont stockees dans des fichiers JSON.
 * En production, utilise Prisma (DiscountCode, DiscountUsage).
 */

import { IS_DEV } from "../prisma";
import fs from "fs";
import path from "path";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DiscountValidation {
  valid: boolean;
  error?: string;
  discountAmount: number;
  finalPrice: number;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  code?: string;
}

export interface DiscountCodeRecord {
  id: string;
  instructeurId: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  scope: "ALL" | "FORMATIONS" | "PRODUCTS" | "SPECIFIC";
  formationIds: string[];
  productIds: string[];
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  totalDiscounted: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountUsageRecord {
  id: string;
  discountId: string;
  userId: string;
  orderType: string;
  orderId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
}

export interface FlashOfferRecord {
  id: string;
  instructeurId: string;
  itemId: string;
  itemType: "formation" | "product";
  discountPct: number;
  originalPrice: number;
  flashPrice: number;
  startsAt: string;
  endsAt: string;
  maxSales: number | null;
  currentSales: number;
  isActive: boolean;
  createdAt: string;
}

export interface FlashOfferResult {
  active: boolean;
  discountPct: number;
  endsAt: Date;
  flashPrice: number;
  originalPrice: number;
}

// ── DEV Mode Store ───────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "lib", "dev");
const DISCOUNTS_FILE = path.join(DATA_DIR, "marketing-discounts.json");
const USAGES_FILE = path.join(DATA_DIR, "marketing-discount-usages.json");
const FLASH_OFFERS_FILE = path.join(DATA_DIR, "marketing-flash-offers.json");

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

// ── Seed Data ────────────────────────────────────────────────────────────────

const SEED_DISCOUNTS: DiscountCodeRecord[] = [
  {
    id: "disc-welcome10",
    instructeurId: "dev-instructeur-1",
    code: "WELCOME10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    scope: "ALL",
    formationIds: [],
    productIds: [],
    maxUses: 1000,
    usedCount: 42,
    maxUsesPerUser: 1,
    minOrderAmount: null,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    totalDiscounted: 420,
    revenue: 3780,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "disc-flash20",
    instructeurId: "dev-instructeur-1",
    code: "FLASH20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    scope: "FORMATIONS",
    formationIds: [],
    productIds: [],
    maxUses: 100,
    usedCount: 15,
    maxUsesPerUser: 1,
    minOrderAmount: 29,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    totalDiscounted: 300,
    revenue: 1200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "disc-fixed5",
    instructeurId: "dev-instructeur-1",
    code: "SAVE5EUR",
    discountType: "FIXED_AMOUNT",
    discountValue: 5,
    scope: "ALL",
    formationIds: [],
    productIds: [],
    maxUses: null,
    usedCount: 8,
    maxUsesPerUser: 3,
    minOrderAmount: 20,
    expiresAt: null,
    isActive: true,
    totalDiscounted: 40,
    revenue: 200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getDiscounts(): DiscountCodeRecord[] {
  const existing = readJson<DiscountCodeRecord[]>(DISCOUNTS_FILE, []);
  if (existing.length === 0) {
    writeJson(DISCOUNTS_FILE, SEED_DISCOUNTS);
    return SEED_DISCOUNTS;
  }
  return existing;
}

function saveDiscounts(discounts: DiscountCodeRecord[]): void {
  writeJson(DISCOUNTS_FILE, discounts);
}

function getUsages(): DiscountUsageRecord[] {
  return readJson<DiscountUsageRecord[]>(USAGES_FILE, []);
}

function saveUsages(usages: DiscountUsageRecord[]): void {
  writeJson(USAGES_FILE, usages);
}

function getFlashOffers(): FlashOfferRecord[] {
  return readJson<FlashOfferRecord[]>(FLASH_OFFERS_FILE, []);
}

function saveFlashOffers(offers: FlashOfferRecord[]): void {
  writeJson(FLASH_OFFERS_FILE, offers);
}

// ── Discount Validation ──────────────────────────────────────────────────────

/**
 * Validate a discount code against order parameters.
 * Returns whether the code is valid, the discount amount, and the final price.
 */
export async function validateDiscount(
  code: string,
  userId: string,
  orderAmount: number,
  orderType: string,
  itemId: string
): Promise<DiscountValidation> {
  const invalidResult = (error: string): DiscountValidation => ({
    valid: false,
    error,
    discountAmount: 0,
    finalPrice: orderAmount,
  });

  if (!code || code.trim().length === 0) {
    return invalidResult("Code de reduction requis.");
  }

  const normalizedCode = code.trim().toUpperCase();

  if (IS_DEV) {
    return validateDiscountDev(normalizedCode, userId, orderAmount, orderType, itemId);
  }

  // Production: use Prisma
  try {
    const prismaModule = await import("@freelancehigh/db");
    const prisma = prismaModule.prisma;

    const discount = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
      include: { usages: { where: { userId } } },
    });

    if (!discount) return invalidResult("Code de reduction invalide.");
    if (!discount.isActive) return invalidResult("Ce code n'est plus actif.");
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return invalidResult("Ce code a expire.");
    }
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return invalidResult("Ce code a atteint sa limite d'utilisation.");
    }
    if (discount.maxUsesPerUser !== null && discount.usages.length >= discount.maxUsesPerUser) {
      return invalidResult("Vous avez deja utilise ce code le nombre maximum de fois.");
    }
    if (discount.minOrderAmount !== null && orderAmount < discount.minOrderAmount) {
      return invalidResult(`Montant minimum requis : ${discount.minOrderAmount} EUR.`);
    }

    // Scope check
    if (discount.scope === "FORMATIONS" && orderType !== "formation") {
      return invalidResult("Ce code est valable uniquement pour les formations.");
    }
    if (discount.scope === "PRODUCTS" && orderType !== "product") {
      return invalidResult("Ce code est valable uniquement pour les produits.");
    }
    if (discount.scope === "SPECIFIC") {
      const validIds = [...discount.formationIds, ...discount.productIds];
      if (!validIds.includes(itemId)) {
        return invalidResult("Ce code n'est pas valable pour cet article.");
      }
    }

    const discountAmount = computeDiscountAmount(
      orderAmount,
      discount.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discount.discountValue
    );

    return {
      valid: true,
      discountAmount,
      finalPrice: Math.max(0, orderAmount - discountAmount),
      discountType: discount.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discountValue: discount.discountValue,
      code: normalizedCode,
    };
  } catch (err) {
    console.error("[Discount] Validation error:", err);
    return invalidResult("Erreur lors de la validation du code.");
  }
}

function validateDiscountDev(
  code: string,
  userId: string,
  orderAmount: number,
  orderType: string,
  itemId: string
): DiscountValidation {
  const invalidResult = (error: string): DiscountValidation => ({
    valid: false,
    error,
    discountAmount: 0,
    finalPrice: orderAmount,
  });

  const discounts = getDiscounts();
  const discount = discounts.find((d) => d.code === code);

  if (!discount) return invalidResult("Code de reduction invalide.");
  if (!discount.isActive) return invalidResult("Ce code n'est plus actif.");
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return invalidResult("Ce code a expire.");
  }
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return invalidResult("Ce code a atteint sa limite d'utilisation.");
  }

  // Check per-user usage
  if (discount.maxUsesPerUser !== null) {
    const usages = getUsages();
    const userUsageCount = usages.filter(
      (u) => u.discountId === discount.id && u.userId === userId
    ).length;
    if (userUsageCount >= discount.maxUsesPerUser) {
      return invalidResult("Vous avez deja utilise ce code le nombre maximum de fois.");
    }
  }

  if (discount.minOrderAmount !== null && orderAmount < discount.minOrderAmount) {
    return invalidResult(`Montant minimum requis : ${discount.minOrderAmount} EUR.`);
  }

  // Scope
  if (discount.scope === "FORMATIONS" && orderType !== "formation") {
    return invalidResult("Ce code est valable uniquement pour les formations.");
  }
  if (discount.scope === "PRODUCTS" && orderType !== "product") {
    return invalidResult("Ce code est valable uniquement pour les produits.");
  }
  if (discount.scope === "SPECIFIC") {
    const validIds = [...discount.formationIds, ...discount.productIds];
    if (!validIds.includes(itemId)) {
      return invalidResult("Ce code n'est pas valable pour cet article.");
    }
  }

  const discountAmount = computeDiscountAmount(orderAmount, discount.discountType, discount.discountValue);

  return {
    valid: true,
    discountAmount,
    finalPrice: Math.max(0, orderAmount - discountAmount),
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    code,
  };
}

// ── Discount Application ─────────────────────────────────────────────────────

/**
 * Apply a discount code to an order. Records usage and updates counters.
 * Should be called AFTER validateDiscount confirms validity.
 */
export async function applyDiscount(
  code: string,
  userId: string,
  orderId: string,
  orderType: string,
  originalAmount: number
): Promise<{ discountAmount: number; finalPrice: number }> {
  const normalizedCode = code.trim().toUpperCase();

  if (IS_DEV) {
    return applyDiscountDev(normalizedCode, userId, orderId, orderType, originalAmount);
  }

  // Production: use Prisma
  try {
    const prismaModule = await import("@freelancehigh/db");
    const prisma = prismaModule.prisma;

    const discount = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!discount) throw new Error("Discount code not found");

    const discountAmount = computeDiscountAmount(
      originalAmount,
      discount.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      discount.discountValue
    );
    const finalPrice = Math.max(0, originalAmount - discountAmount);

    // Record usage
    await prisma.discountUsage.create({
      data: {
        discountId: discount.id,
        userId,
        orderType,
        orderId,
        originalAmount,
        discountAmount,
        finalAmount: finalPrice,
      },
    });

    // Update counters
    await prisma.discountCode.update({
      where: { id: discount.id },
      data: {
        usedCount: { increment: 1 },
        totalDiscounted: { increment: discountAmount },
        revenue: { increment: finalPrice },
      },
    });

    console.log(
      `[Discount] Applied ${normalizedCode}: -${discountAmount} EUR on order ${orderId}`
    );

    return { discountAmount, finalPrice };
  } catch (err) {
    console.error("[Discount] Error applying discount:", err);
    throw err;
  }
}

function applyDiscountDev(
  code: string,
  userId: string,
  orderId: string,
  orderType: string,
  originalAmount: number
): { discountAmount: number; finalPrice: number } {
  const discounts = getDiscounts();
  const discount = discounts.find((d) => d.code === code);

  if (!discount) throw new Error("Discount code not found");

  const discountAmount = computeDiscountAmount(originalAmount, discount.discountType, discount.discountValue);
  const finalPrice = Math.max(0, originalAmount - discountAmount);

  // Record usage
  const usages = getUsages();
  usages.push({
    id: `du-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    discountId: discount.id,
    userId,
    orderType,
    orderId,
    originalAmount,
    discountAmount,
    finalAmount: finalPrice,
    createdAt: new Date().toISOString(),
  });
  saveUsages(usages);

  // Update counters
  discount.usedCount += 1;
  discount.totalDiscounted += discountAmount;
  discount.revenue += finalPrice;
  discount.updatedAt = new Date().toISOString();
  saveDiscounts(discounts);

  console.log(`[Discount] Applied ${code}: -${discountAmount} EUR on order ${orderId}`);

  return { discountAmount, finalPrice };
}

// ── Flash Offers ─────────────────────────────────────────────────────────────

/**
 * Check if there is an active flash offer for a given item.
 * Returns the flash offer details if active, null otherwise.
 */
export async function checkFlashOffer(
  itemId: string,
  itemType: string
): Promise<FlashOfferResult | null> {
  const now = new Date();

  if (IS_DEV) {
    const offers = getFlashOffers();
    const match = offers.find(
      (o) =>
        o.itemId === itemId &&
        o.itemType === itemType &&
        o.isActive &&
        new Date(o.startsAt) <= now &&
        new Date(o.endsAt) > now &&
        (o.maxSales === null || o.currentSales < o.maxSales)
    );

    if (!match) return null;

    return {
      active: true,
      discountPct: match.discountPct,
      endsAt: new Date(match.endsAt),
      flashPrice: match.flashPrice,
      originalPrice: match.originalPrice,
    };
  }

  // Production: query the DB (flash offers would be stored in a dedicated table)
  // For now, delegate to dev store as fallback
  try {
    const offers = getFlashOffers();
    const match = offers.find(
      (o) =>
        o.itemId === itemId &&
        o.itemType === itemType &&
        o.isActive &&
        new Date(o.startsAt) <= now &&
        new Date(o.endsAt) > now &&
        (o.maxSales === null || o.currentSales < o.maxSales)
    );

    if (!match) return null;

    return {
      active: true,
      discountPct: match.discountPct,
      endsAt: new Date(match.endsAt),
      flashPrice: match.flashPrice,
      originalPrice: match.originalPrice,
    };
  } catch {
    return null;
  }
}

// ── Flash Offer Management (DEV) ─────────────────────────────────────────────

export function createFlashOffer(data: Omit<FlashOfferRecord, "id" | "currentSales" | "createdAt">): FlashOfferRecord {
  const offer: FlashOfferRecord = {
    ...data,
    id: `flash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    currentSales: 0,
    createdAt: new Date().toISOString(),
  };

  const offers = getFlashOffers();
  offers.push(offer);
  saveFlashOffers(offers);
  return offer;
}

export function incrementFlashOfferSales(offerId: string): void {
  const offers = getFlashOffers();
  const offer = offers.find((o) => o.id === offerId);
  if (offer) {
    offer.currentSales += 1;
    saveFlashOffers(offers);
  }
}

export function getAllFlashOffers(): FlashOfferRecord[] {
  return getFlashOffers();
}

// ── Discount Code Management (DEV) ──────────────────────────────────────────

export function createDiscountCode(
  data: Omit<DiscountCodeRecord, "id" | "usedCount" | "totalDiscounted" | "revenue" | "createdAt" | "updatedAt">
): DiscountCodeRecord {
  const record: DiscountCodeRecord = {
    ...data,
    id: `disc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    usedCount: 0,
    totalDiscounted: 0,
    revenue: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const discounts = getDiscounts();
  discounts.push(record);
  saveDiscounts(discounts);
  return record;
}

export function getDiscountByCode(code: string): DiscountCodeRecord | null {
  const discounts = getDiscounts();
  return discounts.find((d) => d.code === code.toUpperCase()) ?? null;
}

export function getAllDiscountCodes(instructeurId?: string): DiscountCodeRecord[] {
  const discounts = getDiscounts();
  if (instructeurId) {
    return discounts.filter((d) => d.instructeurId === instructeurId);
  }
  return discounts;
}

export function getDiscountUsages(discountId: string): DiscountUsageRecord[] {
  const usages = getUsages();
  return usages.filter((u) => u.discountId === discountId);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeDiscountAmount(
  orderAmount: number,
  discountType: "PERCENTAGE" | "FIXED_AMOUNT",
  discountValue: number
): number {
  if (discountType === "PERCENTAGE") {
    const amount = (orderAmount * Math.min(discountValue, 100)) / 100;
    return Math.round(amount * 100) / 100;
  }
  // FIXED_AMOUNT: cannot exceed order total
  return Math.min(discountValue, orderAmount);
}
