// POST /api/webhooks/cinetpay — CinetPay payment notification handler
// Called by CinetPay when a payment status changes (success, failure, cancel).
//
// Security: CinetPay does not sign webhooks, so we always verify the
// transaction status via the checkPaymentStatus API before trusting the
// notification. This prevents spoofed/replayed webhook calls.

import { NextRequest, NextResponse } from "next/server";
import {
  checkPaymentStatus,
  isPaymentSuccessful,
  isPaymentFailed,
  isCinetPayConfigured,
} from "@/lib/cinetpay";
import { orderStore, transactionStore } from "@/lib/dev/data-store";
import { emitEvent } from "@/lib/events/dispatcher";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    // ── Parse the notification body ─────────────────────────────────────
    // CinetPay sends: cpm_trans_id, cpm_site_id, cpm_trans_date, cpm_amount,
    // cpm_currency, cpm_payment_config, cpm_page_action, cpm_version,
    // cpm_language, cpm_trans_status, cpm_designation, cpm_error_message
    const body = await req.json().catch(() => null);

    // CinetPay may also send form-encoded data; handle both
    let transactionId: string | null = null;

    if (body && typeof body === "object") {
      transactionId = body.cpm_trans_id || body.transaction_id || null;
    }

    if (!transactionId) {
      // Try to extract from URL search params as fallback
      transactionId = req.nextUrl.searchParams.get("cpm_trans_id");
    }

    if (!transactionId) {
      console.error("[CinetPay Webhook] No transaction ID in notification");
      return NextResponse.json(
        { error: "transaction_id manquant" },
        { status: 400 }
      );
    }

    console.log(
      `[CinetPay Webhook] Notification received for transaction: ${transactionId}`
    );

    // ── Extract orderId from transaction ID ─────────────────────────────
    // Our transaction IDs follow the format: FH-{orderId}-{timestamp}
    const orderId = extractOrderId(transactionId);

    if (!orderId) {
      console.error(
        `[CinetPay Webhook] Could not extract orderId from transactionId: ${transactionId}`
      );
      return NextResponse.json(
        { error: "Format de transaction_id non reconnu" },
        { status: 400 }
      );
    }

    // ── Verify payment status with CinetPay API ─────────────────────────
    // This is the recommended approach per CinetPay docs: never trust the
    // webhook payload alone, always verify server-to-server.
    if (!isCinetPayConfigured()) {
      if (IS_DEV && !USE_PRISMA_FOR_DATA) {
        console.warn("[CinetPay Webhook] API not configured — simulating success in dev mode");
        await handlePaymentSuccessDev(orderId, transactionId, "SIMULATED", "DEV_MODE");
        return NextResponse.json({ received: true, devMode: true });
      }
      // Production: refuse webhook if CinetPay is not configured — prevents free money
      console.error("[CinetPay Webhook] REJECTED — CinetPay not configured in production");
      return NextResponse.json({ error: "CinetPay non configure" }, { status: 503 });
    }

    const status = await checkPaymentStatus(transactionId);

    if (!status) {
      console.error(
        `[CinetPay Webhook] Could not verify transaction status: ${transactionId}`
      );
      // Return 200 to acknowledge receipt — we'll retry verification via a job later
      return NextResponse.json({
        received: true,
        verified: false,
        message: "Impossible de verifier le statut — sera retente",
      });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // ── DEV: Process based on verified status ──────────────────────────
      if (isPaymentSuccessful(status)) {
        await handlePaymentSuccessDev(
          orderId,
          transactionId,
          status.data.payment_method,
          status.data.amount
        );

        console.log(
          `[CinetPay Webhook] Payment ACCEPTED (dev): orderId=${orderId}, txId=${transactionId}, ` +
            `method=${status.data.payment_method}, amount=${status.data.amount} ${status.data.currency}`
        );
      } else if (isPaymentFailed(status)) {
        await handlePaymentFailureDev(
          orderId,
          transactionId,
          status.data.status,
          status.message
        );

        console.log(
          `[CinetPay Webhook] Payment REFUSED/CANCELLED (dev): orderId=${orderId}, txId=${transactionId}, ` +
            `status=${status.data.status}, reason=${status.message}`
        );
      } else {
        // Payment is still pending (WAITING_FOR_CUSTOMER, etc.)
        console.log(
          `[CinetPay Webhook] Payment pending (dev): orderId=${orderId}, txId=${transactionId}, ` +
            `status=${status.data.status}`
        );
      }
    } else {
      // ── Production: Process based on verified status ───────────────────
      if (isPaymentSuccessful(status)) {
        await handlePaymentSuccessPrisma(
          orderId,
          transactionId,
          status.data.payment_method,
          status.data.amount
        );

        console.log(
          `[CinetPay Webhook] Payment ACCEPTED: orderId=${orderId}, txId=${transactionId}, ` +
            `method=${status.data.payment_method}, amount=${status.data.amount} ${status.data.currency}`
        );
      } else if (isPaymentFailed(status)) {
        await handlePaymentFailurePrisma(
          orderId,
          transactionId,
          status.data.status,
          status.message
        );

        console.log(
          `[CinetPay Webhook] Payment REFUSED/CANCELLED: orderId=${orderId}, txId=${transactionId}, ` +
            `status=${status.data.status}, reason=${status.message}`
        );
      } else {
        // Payment is still pending (WAITING_FOR_CUSTOMER, etc.)
        console.log(
          `[CinetPay Webhook] Payment pending: orderId=${orderId}, txId=${transactionId}, ` +
            `status=${status.data.status}`
        );
      }
    }

    // Always return 200 to CinetPay to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[CinetPay Webhook] Error:", error);
    // Return 200 anyway to prevent CinetPay from retrying indefinitely
    return NextResponse.json({ received: true, error: "Erreur interne" });
  }
}

// ── Dev-store Handlers ────────────────────────────────────────────────────────

async function handlePaymentSuccessDev(
  orderId: string,
  transactionId: string,
  paymentMethod: string,
  amount: string
): Promise<void> {
  const order = orderStore.getById(orderId);
  if (!order) {
    console.error(`[CinetPay Webhook] Order not found: ${orderId}`);
    return;
  }

  // Idempotency: skip if order is already paid/in progress
  if (order.status === "en_cours" || order.status === "termine") {
    console.log(
      `[CinetPay Webhook] Order ${orderId} already processed (status=${order.status}), skipping`
    );
    return;
  }

  // Update order status: payment confirmed, order is now active
  orderStore.update(orderId, {
    status: "en_cours",
    progress: 10,
  });

  // Add system message to order
  orderStore.addMessage(orderId, {
    sender: "client",
    senderName: "Systeme",
    content: `Paiement confirme via ${formatPaymentMethod(paymentMethod)} (ref: ${transactionId})`,
    timestamp: new Date().toISOString(),
    type: "system",
  });

  // Record transaction in finances (escrow: held until delivery validation)
  transactionStore.add({
    userId: order.freelanceId,
    type: "vente",
    description: `Paiement Mobile Money — ${order.serviceTitle}`,
    amount: order.amount - order.commission,
    status: "en_attente", // Escrow: held until delivery is validated
    date: new Date().toISOString(),
    orderId: order.id,
    method: `CinetPay (${formatPaymentMethod(paymentMethod)})`,
  });

  // Emit payment.success event (notifications + emails)
  emitEvent("payment.success", {
    userId: order.freelanceId,
    userName: "",
    userEmail: "",
    amount: order.amount,
    serviceTitle: order.serviceTitle,
    orderId,
    method: `CinetPay (${formatPaymentMethod(paymentMethod)})`,
  }).catch(() => {});
}

async function handlePaymentFailureDev(
  orderId: string,
  transactionId: string,
  status: string,
  reason: string
): Promise<void> {
  const order = orderStore.getById(orderId);
  if (!order) {
    console.error(`[CinetPay Webhook] Order not found: ${orderId}`);
    return;
  }

  // Don't revert orders that are already in progress or completed
  if (order.status === "en_cours" || order.status === "termine") {
    console.log(
      `[CinetPay Webhook] Order ${orderId} already active (status=${order.status}), not reverting`
    );
    return;
  }

  // Add system message about the failure
  orderStore.addMessage(orderId, {
    sender: "client",
    senderName: "Systeme",
    content: `Paiement echoue (${status}): ${reason}. Veuillez reessayer.`,
    timestamp: new Date().toISOString(),
    type: "system",
  });

  // Record the failed transaction
  transactionStore.add({
    userId: order.clientId,
    type: "vente",
    description: `Paiement Mobile Money echoue — ${order.serviceTitle}`,
    amount: order.amount,
    status: "echoue",
    date: new Date().toISOString(),
    orderId: order.id,
    method: `CinetPay`,
  });

  // Emit payment.failed event
  emitEvent("payment.failed", {
    userId: order.clientId,
    userName: order.clientName,
    userEmail: "",
    amount: order.amount,
    serviceTitle: order.serviceTitle,
    orderId,
    reason,
  }).catch(() => {});
}

// ── Prisma (Production) Handlers ──────────────────────────────────────────────

async function handlePaymentSuccessPrisma(
  orderId: string,
  transactionId: string,
  paymentMethod: string,
  amount: string
): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { service: true, freelance: true, client: true },
    });

    if (!order) {
      console.error(`[CinetPay Webhook] Order not found in DB: ${orderId}`);
      return;
    }

    // Idempotency: skip if order is already paid/in progress
    if (order.status === "EN_COURS" || order.status === "TERMINE" || order.status === "LIVRE") {
      console.log(
        `[CinetPay Webhook] Order ${orderId} already processed (status=${order.status}), skipping`
      );
      return;
    }

    // Double-payment prevention: check if a COMPLETE payment already exists (e.g., from Stripe)
    const existingCompletePayment = await prisma.payment.findFirst({
      where: { orderId, status: "COMPLETE" },
    });
    if (existingCompletePayment) {
      console.warn(
        `[CinetPay Webhook] Order ${orderId} already has a COMPLETE payment (id=${existingCompletePayment.id}), skipping`
      );
      return;
    }

    // Amount validation: verify webhook amount matches order amount to prevent fraud
    const webhookAmount = parseFloat(amount);
    if (!isNaN(webhookAmount) && Math.abs(webhookAmount - order.amount) > 1) {
      console.error(
        `[CinetPay Webhook] AMOUNT MISMATCH orderId=${orderId}: webhook=${webhookAmount}, order=${order.amount}. Rejecting.`
      );
      return;
    }

    const serviceTitle = order.title || order.service?.title || `Commande ${orderId}`;

    await prisma.$transaction(async (tx) => {
      // Update order status to active and escrow to held (funds confirmed)
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "EN_COURS",
          progress: 10,
          startedAt: new Date(),
          acceptedAt: new Date(),
        },
      });

      // Update escrow record to confirmed held state
      await tx.escrow.updateMany({
        where: { orderId },
        data: { status: "HELD" },
      });

      // Mark the pending payment record as complete
      await tx.payment.updateMany({
        where: {
          orderId,
          status: "EN_ATTENTE",
          method: "MOBILE_MONEY",
        },
        data: {
          status: "COMPLETE",
          description: `Paiement confirme via ${formatPaymentMethod(paymentMethod)} (ref: ${transactionId})`,
        },
      });

      // Create escrow-held payment record for the freelancer payout
      // (will be released when delivery is validated)
      await tx.payment.create({
        data: {
          orderId,
          payerId: order.clientId,
          payeeId: order.freelanceId,
          amount: order.freelancerPayout,
          currency: order.currency,
          status: "EN_ATTENTE", // Escrow: held until delivery validated
          method: "MOBILE_MONEY",
          description: `Paiement Mobile Money — ${serviceTitle} (ref: ${transactionId})`,
          type: "vente",
        },
      });

      // Best-effort: update admin wallet fees held
      try {
        let adminWallet = await tx.adminWallet.findFirst();
        if (!adminWallet) {
          adminWallet = await tx.adminWallet.create({ data: {} });
        }
        await tx.adminWallet.update({
          where: { id: adminWallet.id },
          data: { totalFeesHeld: { increment: order.platformFee } },
        });
        await tx.adminTransaction.create({
          data: {
            adminWalletId: adminWallet.id,
            type: "SERVICE_FEE",
            amount: order.platformFee,
            currency: order.currency,
            description: `Commission CinetPay — ${serviceTitle} (ref: ${transactionId})`,
            orderId,
            status: "PENDING",
          },
        });
      } catch {
        console.warn("[CinetPay Webhook] AdminWallet tables not yet migrated, skipping");
      }
    });

    // Emit payment.success event (notifications + emails)
    emitEvent("payment.success", {
      userId: order.freelanceId,
      userName: order.freelance?.name || "",
      userEmail: order.freelance?.email || "",
      amount: order.amount,
      serviceTitle,
      orderId,
      method: `CinetPay (${formatPaymentMethod(paymentMethod)})`,
    }).catch(() => {});
  } catch (err) {
    console.error(`[CinetPay Webhook] handlePaymentSuccessPrisma error for orderId=${orderId}:`, err);
  }
}

async function handlePaymentFailurePrisma(
  orderId: string,
  transactionId: string,
  status: string,
  reason: string
): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { service: true, client: true },
    });

    if (!order) {
      console.error(`[CinetPay Webhook] Order not found in DB: ${orderId}`);
      return;
    }

    // Don't revert orders that are already in progress or completed
    if (order.status === "EN_COURS" || order.status === "TERMINE" || order.status === "LIVRE") {
      console.log(
        `[CinetPay Webhook] Order ${orderId} already active (status=${order.status}), not reverting`
      );
      return;
    }

    const serviceTitle = order.title || order.service?.title || `Commande ${orderId}`;

    await prisma.$transaction(async (tx) => {
      // Mark the pending payment as failed
      await tx.payment.updateMany({
        where: {
          orderId,
          status: "EN_ATTENTE",
          method: "MOBILE_MONEY",
        },
        data: {
          status: "ECHOUE",
          description: `Paiement echoue (${status}): ${reason}`,
        },
      });

      // Record the failed payment attempt for audit trail
      await tx.payment.create({
        data: {
          orderId,
          payerId: order.clientId,
          amount: order.amount,
          currency: order.currency,
          status: "ECHOUE",
          method: "MOBILE_MONEY",
          description: `Paiement Mobile Money echoue — ${serviceTitle} (ref: ${transactionId})`,
          type: "paiement",
        },
      });
    });

    // Emit payment.failed event
    emitEvent("payment.failed", {
      userId: order.clientId,
      userName: order.client?.name || "",
      userEmail: order.client?.email || "",
      amount: order.amount,
      serviceTitle,
      orderId,
      reason,
    }).catch(() => {});
  } catch (err) {
    console.error(`[CinetPay Webhook] handlePaymentFailurePrisma error for orderId=${orderId}:`, err);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract orderId from a transaction ID with format: FH-{orderId}-{timestamp}
 */
function extractOrderId(transactionId: string): string | null {
  // Match pattern: FH-ORDID-timestamp
  // orderId can contain letters, numbers, and hyphens (e.g., ORD-ABC123)
  const match = transactionId.match(/^FH-(.+)-\d+$/);
  return match ? match[1] : null;
}

/**
 * Format CinetPay payment method codes into human-readable names.
 */
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    OM: "Orange Money",
    MOMO: "MTN Mobile Money",
    MOOV: "Moov Money",
    WAVE: "Wave",
    FLOOZ: "Flooz",
    VISA: "Visa",
    MASTERCARD: "Mastercard",
    WALLET: "Portefeuille CinetPay",
  };
  return methods[method.toUpperCase()] || method;
}
