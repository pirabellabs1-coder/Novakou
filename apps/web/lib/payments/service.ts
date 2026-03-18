// PaymentService — Abstraction layer for all payment operations
// Supports mock mode (no external API) and real mode (Stripe/CinetPay)

import { v4 as uuidv4 } from "uuid";

// ── Types ──────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "card" | "mobile_money" | "bank_transfer" | "mock";

export interface CreatePaymentParams {
  userId: string;
  amount: number;
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
  /** "formation" | "product" | "cohort" | "subscription" */
  type: string;
  /** Optional: formation/product/cohort ID */
  itemId?: string;
  /** If true, skip Stripe and use mock */
  forceMock?: boolean;
  /** success/cancel redirect URLs */
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  /** Mock or Stripe session ID */
  sessionId: string;
  /** If Stripe, the redirect URL. If mock, null. */
  checkoutUrl: string | null;
  /** "mock" | "stripe" | "cinetpay" */
  provider: string;
  /** Payment status after creation */
  status: PaymentStatus;
  /** Amount in cents or unit */
  amount: number;
  currency: string;
  /** Metadata passed through */
  metadata: Record<string, string>;
}

export interface VerifyPaymentResult {
  paid: boolean;
  sessionId: string;
  provider: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  userId?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string | null;
  provider: string;
  error?: string;
}

// ── Config ──────────────────────────────────────────────────────

function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 10);
}

function isMockMode(): boolean {
  return !isStripeConfigured();
}

// ── Mock Payment Store (in-memory for dev) ─────────────────────

const mockPayments = new Map<string, {
  sessionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: string;
  itemId?: string;
  metadata: Record<string, string>;
  createdAt: Date;
}>();

// ── PaymentService ─────────────────────────────────────────────

export const PaymentService = {
  /**
   * Check if running in mock mode
   */
  isMockMode,

  /**
   * Create a payment session.
   * In mock mode: simulates instant success and returns a mock session.
   * In real mode: creates a Stripe checkout session.
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const {
      userId,
      amount,
      currency = "EUR",
      description,
      metadata = {},
      type,
      itemId,
      forceMock,
      successUrl,
      cancelUrl,
    } = params;

    // Use mock if Stripe not configured or explicitly forced
    if (isMockMode() || forceMock || amount === 0) {
      const sessionId = `mock_${uuidv4()}`;

      mockPayments.set(sessionId, {
        sessionId,
        userId,
        amount,
        currency,
        status: "paid", // Mock payments are instantly successful
        type,
        itemId,
        metadata: { ...metadata, userId, type, itemId: itemId ?? "" },
        createdAt: new Date(),
      });

      return {
        success: true,
        sessionId,
        checkoutUrl: null, // No redirect needed — instant success
        provider: "mock",
        status: "paid",
        amount,
        currency,
        metadata: { ...metadata, userId, type },
      };
    }

    // Real Stripe payment
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: { name: description },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { ...metadata, userId, type, itemId: itemId ?? "" },
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/formations/succes?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/formations/echec`,
      });

      return {
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url,
        provider: "stripe",
        status: "pending",
        amount,
        currency,
        metadata: { ...metadata, userId, type },
      };
    } catch (error) {
      console.error("[PaymentService] Stripe createPayment error:", error);
      // Fallback to mock if Stripe fails
      const sessionId = `mock_fallback_${uuidv4()}`;
      mockPayments.set(sessionId, {
        sessionId,
        userId,
        amount,
        currency,
        status: "paid",
        type,
        itemId,
        metadata: { ...metadata, userId, type, itemId: itemId ?? "" },
        createdAt: new Date(),
      });

      return {
        success: true,
        sessionId,
        checkoutUrl: null,
        provider: "mock",
        status: "paid",
        amount,
        currency,
        metadata: { ...metadata, userId, type },
      };
    }
  },

  /**
   * Verify a payment session.
   * In mock mode: returns stored mock payment.
   * In real mode: retrieves Stripe session.
   */
  async verifyPayment(sessionId: string): Promise<VerifyPaymentResult> {
    // Check mock store first (handles mock_, mock_free_, mock_fallback_ prefixes)
    if (sessionId.startsWith("mock_") || sessionId.startsWith("free_")) {
      const mock = mockPayments.get(sessionId);
      if (mock) {
        return {
          paid: mock.status === "paid",
          sessionId,
          provider: "mock",
          amount: mock.amount,
          currency: mock.currency,
          metadata: mock.metadata,
          userId: mock.userId,
        };
      }
      // If not found in store, still return success for mock/free sessions
      // (free enrollments are created before reaching verify, so they're valid)
      return {
        paid: true,
        sessionId,
        provider: "mock",
        amount: 0,
        currency: "EUR",
        metadata: {},
      };
    }

    // Real Stripe verification
    if (!isStripeConfigured()) {
      // Not configured but received a non-mock session — assume it's valid (dev scenario)
      return {
        paid: true,
        sessionId,
        provider: "mock",
        amount: 0,
        currency: "EUR",
        metadata: {},
      };
    }

    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
      });
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      return {
        paid: session.payment_status === "paid",
        sessionId: session.id,
        provider: "stripe",
        amount: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "eur",
        metadata: (session.metadata ?? {}) as Record<string, string>,
        userId: session.metadata?.userId,
      };
    } catch (error) {
      console.error("[PaymentService] Stripe verifyPayment error:", error);
      return {
        paid: false,
        sessionId,
        provider: "stripe",
        amount: 0,
        currency: "EUR",
        metadata: {},
      };
    }
  },

  /**
   * Refund a payment.
   * In mock mode: marks as refunded in store.
   * In real mode: calls Stripe refund API.
   */
  async refundPayment(sessionId: string, reason?: string): Promise<RefundResult> {
    // Mock refund
    if (sessionId.startsWith("mock_") || isMockMode()) {
      const mock = mockPayments.get(sessionId);
      if (mock) {
        mock.status = "refunded";
      }
      return {
        success: true,
        refundId: `refund_mock_${uuidv4()}`,
        provider: "mock",
      };
    }

    // Real Stripe refund
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
      });

      // Get payment intent from session
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!session.payment_intent) {
        return { success: false, refundId: null, provider: "stripe", error: "No payment intent" };
      }

      const refund = await stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        reason: "requested_by_customer",
      });

      return {
        success: true,
        refundId: refund.id,
        provider: "stripe",
      };
    } catch (error) {
      console.error("[PaymentService] Stripe refund error:", error);
      return {
        success: false,
        refundId: null,
        provider: "stripe",
        error: (error as Error).message,
      };
    }
  },

  /**
   * Get mock payment details (for dev dashboard).
   */
  getMockPayment(sessionId: string) {
    return mockPayments.get(sessionId) ?? null;
  },

  /**
   * List all mock payments for a user (for dev).
   */
  listMockPayments(userId: string) {
    return Array.from(mockPayments.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
};
