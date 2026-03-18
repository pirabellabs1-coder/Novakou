"use client";

import { Star } from "lucide-react";

/**
 * Format a duration in minutes to a human-readable string.
 * Examples: 90 -> "1h 30m", 60 -> "1h", 45 -> "45m"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format a price in EUR or show "Gratuit" / custom free label.
 * Uses non-breaking space before the euro sign.
 */
export function formatPrice(
  price: number,
  isFree: boolean,
  freeLabel: string = "Gratuit",
): string {
  if (isFree) return freeLabel;
  return `${price.toFixed(0)}\u00A0\u20AC`;
}

/**
 * Check whether a creation date is within the last 30 days.
 */
export function isNew(createdAt: string): boolean {
  const d = new Date(createdAt);
  const now = new Date();
  return now.getTime() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
}

/**
 * Compute the discount percentage between original and current price.
 * Returns null if there is no discount.
 */
export function discountPercent(
  price: number,
  originalPrice: number | null,
): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Render 5 stars with fill based on the rounded rating.
 * Supports light and dark mode via Tailwind classes.
 */
export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }`}
        />
      ))}
    </span>
  );
}
