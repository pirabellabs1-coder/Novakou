// CinetPay API client for FreelanceHigh
// Handles Mobile Money payments for 17 African countries
// Orange Money, Wave, MTN MoMo, Moov Money
//
// Supported currencies: XOF (FCFA UEMOA), XAF (FCFA CEMAC), USD, EUR
// Supported channels: MOBILE_MONEY, CREDIT_CARD, WALLET, ALL
//
// API docs: https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation

const CINETPAY_API_URL = "https://api-checkout.cinetpay.com/v2";
const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY || "";
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID || "";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CinetPayInitParams {
  amount: number;
  currency: "XOF" | "XAF" | "USD" | "EUR";
  transactionId: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  customerName?: string;
  customerSurname?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCountry?: string;
  channels?: "MOBILE_MONEY" | "CREDIT_CARD" | "WALLET" | "ALL";
  metadata?: string;
  lang?: "fr" | "en";
}

export interface CinetPayInitResponse {
  code: string;
  message: string;
  description: string;
  data: {
    payment_token: string;
    payment_url: string;
  };
  api_response_id: string;
}

export interface CinetPayCheckResponse {
  code: string;
  message: string;
  data: {
    amount: string;
    currency: string;
    status: "ACCEPTED" | "REFUSED" | "WAITING_FOR_CUSTOMER" | "CANCELLED";
    payment_method: string;
    description: string;
    metadata: string | null;
    operator_id: string | null;
    payment_date: string;
    fund_availability_date: string;
  };
  api_response_id: string;
}

// ── Configuration check ────────────────────────────────────────────────────

export function isCinetPayConfigured(): boolean {
  return Boolean(CINETPAY_API_KEY && CINETPAY_SITE_ID);
}

// ── initPayment — Initiate a Mobile Money or card payment ──────────────────

export async function initPayment(
  params: CinetPayInitParams
): Promise<CinetPayInitResponse | null> {
  if (!isCinetPayConfigured()) {
    console.warn("[CinetPay] API not configured — missing CINETPAY_API_KEY or CINETPAY_SITE_ID");
    return null;
  }

  try {
    const response = await fetch(`${CINETPAY_API_URL}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: params.transactionId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        return_url: params.returnUrl,
        notify_url: params.notifyUrl,
        customer_name: params.customerName || "",
        customer_surname: params.customerSurname || "",
        customer_email: params.customerEmail || "",
        customer_phone_number: params.customerPhone || "",
        customer_country: params.customerCountry || "",
        channels: params.channels || "ALL",
        metadata: params.metadata || "",
        lang: params.lang || "fr",
      }),
    });

    if (!response.ok) {
      console.error(
        `[CinetPay] HTTP error ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const data: CinetPayInitResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[CinetPay] initPayment error:", error);
    return null;
  }
}

// ── checkPaymentStatus — Verify a transaction status ───────────────────────
// CinetPay recommends always verifying via this endpoint rather than trusting
// the notify_url alone, to prevent replay attacks and spoofed notifications.

export async function checkPaymentStatus(
  transactionId: string
): Promise<CinetPayCheckResponse | null> {
  if (!isCinetPayConfigured()) {
    console.warn("[CinetPay] API not configured — cannot check payment status");
    return null;
  }

  try {
    const response = await fetch(`${CINETPAY_API_URL}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        site_id: CINETPAY_SITE_ID,
        transaction_id: transactionId,
      }),
    });

    if (!response.ok) {
      console.error(
        `[CinetPay] HTTP error ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const data: CinetPayCheckResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[CinetPay] checkPaymentStatus error:", error);
    return null;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a CinetPay status response indicates a successful payment.
 * CinetPay uses code "00" for success.
 */
export function isPaymentSuccessful(response: CinetPayCheckResponse): boolean {
  return response.code === "00" && response.data.status === "ACCEPTED";
}

/**
 * Check if a CinetPay status response indicates a failed/refused payment.
 */
export function isPaymentFailed(response: CinetPayCheckResponse): boolean {
  return (
    response.data.status === "REFUSED" ||
    response.data.status === "CANCELLED"
  );
}

/**
 * Generate a unique transaction ID for CinetPay.
 * Format: FH-{orderId}-{timestamp} to ensure uniqueness and traceability.
 */
export function generateTransactionId(orderId: string): string {
  return `FH-${orderId}-${Date.now()}`;
}
