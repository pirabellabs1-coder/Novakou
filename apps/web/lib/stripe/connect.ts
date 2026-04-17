/**
 * Stripe Connect — Marketplace integration for Novakou
 *
 * Handles:
 * - Express connected accounts (freelance onboarding)
 * - Account links for onboarding flow
 * - Payment intents with manual capture (escrow hold)
 * - Capture / cancel payment intents (release / refund escrow)
 * - Checkout sessions for subscription plans
 */

import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ConnectedAccountResult {
  accountId: string;
  account: Stripe.Account;
}

export interface AccountLinkResult {
  url: string;
  expiresAt: number;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: Stripe.PaymentIntent.Status;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string | null;
}

// ── Connected Accounts ─────────────────────────────────────────────────────

/**
 * Create an Express connected account for a freelance.
 * Used during freelance onboarding to enable payouts.
 *
 * @param email - Freelance email address
 * @param country - ISO 3166-1 alpha-2 country code (e.g. "FR", "SN", "CI")
 * @returns The connected account ID and full account object, or null if Stripe is not configured
 */
export async function createConnectedAccount(
  email: string,
  country: string
): Promise<ConnectedAccountResult | null> {
  if (!stripe) {
    console.error("[Stripe Connect] Stripe not configured — cannot create connected account");
    return null;
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        platform: "freelancehigh",
        created_via: "onboarding",
      },
    });

    console.log(`[Stripe Connect] Connected account created: ${account.id} for ${email}`);

    return {
      accountId: account.id,
      account,
    };
  } catch (error) {
    console.error("[Stripe Connect] Error creating connected account:", error);
    throw error;
  }
}

/**
 * Create an account link for Express account onboarding.
 * Redirects the freelance to Stripe's hosted onboarding flow.
 *
 * @param accountId - Stripe connected account ID (acct_xxx)
 * @param refreshUrl - URL to redirect if link expires
 * @param returnUrl - URL to redirect after successful onboarding
 * @returns The onboarding URL and expiration, or null if Stripe is not configured
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<AccountLinkResult | null> {
  if (!stripe) {
    console.error("[Stripe Connect] Stripe not configured — cannot create account link");
    return null;
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return {
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
    };
  } catch (error) {
    console.error("[Stripe Connect] Error creating account link:", error);
    throw error;
  }
}

// ── Escrow Payment Intents ──────────────────────────────────────────────────

/**
 * Create a payment intent with manual capture for escrow hold.
 *
 * Funds are authorized but NOT captured — they are held until:
 * - The freelance delivers and the client validates → capturePaymentIntent()
 * - The order is cancelled → cancelPaymentIntent()
 * - A dispute is opened → funds remain held until admin verdict
 *
 * @param amount - Amount in the smallest currency unit (e.g. cents for EUR)
 * @param currency - ISO currency code (e.g. "eur", "usd", "xof")
 * @param freelanceStripeAccountId - Connected account ID for the freelance
 * @param orderId - Novakou order ID for tracking
 * @param vendorPlan - The vendor's subscription plan (for commission calculation)
 * @param metadata - Additional metadata for the payment
 * @returns Payment intent details, or null if Stripe is not configured
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  freelanceStripeAccountId: string,
  orderId: string,
  vendorPlan?: string,
  metadata?: Record<string, string>
): Promise<PaymentIntentResult | null> {
  if (!stripe) {
    console.error("[Stripe Connect] Stripe not configured — cannot create payment intent");
    return null;
  }

  try {
    // Calculate platform commission dynamically based on vendor's plan
    const { calculateCommission, normalizePlanName } = await import("@/lib/plans");
    const plan = normalizePlanName(vendorPlan);
    const applicationFeeAmount = calculateCommission(plan, amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      capture_method: "manual",
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: freelanceStripeAccountId,
      },
      metadata: {
        platform: "freelancehigh",
        order_id: orderId,
        freelance_account: freelanceStripeAccountId,
        ...metadata,
      },
    });

    console.log(
      `[Stripe Connect] Payment intent created: ${paymentIntent.id} for order ${orderId} (${amount} ${currency})`
    );

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe PaymentIntent missing client_secret");
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error("[Stripe Connect] Error creating payment intent:", error);
    throw error;
  }
}

/**
 * Capture a previously authorized payment intent — releases escrow funds.
 * Called when the client validates the delivery.
 *
 * @param paymentIntentId - The payment intent ID to capture
 * @returns The captured payment intent, or null if Stripe is not configured
 */
export async function capturePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    console.error("[Stripe Connect] Stripe not configured — cannot capture payment intent");
    return null;
  }

  try {
    const captured = await stripe.paymentIntents.capture(paymentIntentId);

    console.log(
      `[Stripe Connect] Payment intent captured: ${paymentIntentId} — ${captured.amount} ${captured.currency}`
    );

    return captured;
  } catch (error) {
    console.error("[Stripe Connect] Error capturing payment intent:", error);
    throw error;
  }
}

/**
 * Cancel a payment intent — refunds the authorized amount.
 * Called when the order is cancelled before delivery.
 *
 * @param paymentIntentId - The payment intent ID to cancel
 * @returns The cancelled payment intent, or null if Stripe is not configured
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    console.error("[Stripe Connect] Stripe not configured — cannot cancel payment intent");
    return null;
  }

  try {
    const cancelled = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: "requested_by_customer",
    });

    console.log(`[Stripe Connect] Payment intent cancelled: ${paymentIntentId}`);

    return cancelled;
  } catch (error) {
    console.error("[Stripe Connect] Error cancelling payment intent:", error);
    throw error;
  }
}

// ── Subscription Checkout ───────────────────────────────────────────────────

/**
 * Create a Checkout Session for subscription plan upgrades.
 *
 * @param priceId - Stripe Price ID for the subscription plan
 * @param customerId - Stripe Customer ID
 * @param successUrl - URL to redirect after successful payment
 * @param cancelUrl - URL to redirect if the user cancels
 * @returns Checkout session details, or null if Stripe is not configured
 */
export async function createCheckoutSession(
  priceId: string,
  customerId: string,
  successUrl: string,
  cancelUrl: string
): Promise<CheckoutSessionResult | null> {
  if (!stripe) {
    console.error("[Stripe Connect] Stripe not configured — cannot create checkout session");
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        platform: "freelancehigh",
        type: "subscription",
      },
    });

    console.log(`[Stripe Connect] Checkout session created: ${session.id} for customer ${customerId}`);

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error("[Stripe Connect] Error creating checkout session:", error);
    throw error;
  }
}
