import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] STRIPE_SECRET_KEY not configured");
}

// FIX: Unified API version across the codebase (matches webhook handler)
export const STRIPE_API_VERSION = "2026-02-25.clover" as Stripe.LatestApiVersion;

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  : null;
