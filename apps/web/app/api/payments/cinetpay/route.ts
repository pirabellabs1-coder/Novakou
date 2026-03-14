// POST /api/payments/cinetpay — Initiate a CinetPay payment (Mobile Money / card)
// Used for marketplace orders paid via Orange Money, Wave, MTN MoMo, etc.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  initPayment,
  isCinetPayConfigured,
  generateTransactionId,
} from "@/lib/cinetpay";
import { orderStore } from "@/lib/dev/data-store";
import { rateLimit } from "@/lib/api-rate-limit";

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifie" },
        { status: 401 }
      );
    }

    const rl = rateLimit(`cinetpay:${session.user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requetes. Reessayez dans 1 minute." }, { status: 429 });
    }

    // ── Parse request body ──────────────────────────────────────────────
    const body = await req.json();
    const { orderId, amount, currency, customerPhone, customerName, customerEmail } = body as {
      orderId: string;
      amount: number;
      currency?: "XOF" | "XAF" | "USD" | "EUR";
      customerPhone?: string;
      customerName?: string;
      customerEmail?: string;
    };

    // ── Validate required fields ────────────────────────────────────────
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId est requis" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit etre superieur a 0" },
        { status: 400 }
      );
    }

    // CinetPay requires amounts to be multiples of 5 for XOF/XAF
    const paymentCurrency = currency || "XOF";
    if ((paymentCurrency === "XOF" || paymentCurrency === "XAF") && amount % 5 !== 0) {
      return NextResponse.json(
        { error: "Le montant doit etre un multiple de 5 pour la devise XOF/XAF" },
        { status: 400 }
      );
    }

    // ── Verify order exists and belongs to user ─────────────────────────
    const order = orderStore.getById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    if (order.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces refuse a cette commande" },
        { status: 403 }
      );
    }

    // ── Check CinetPay configuration ────────────────────────────────────
    if (!isCinetPayConfigured()) {
      // Dev mode fallback: return a simulated payment URL
      console.warn("[CinetPay] API not configured — returning dev mode response");
      return NextResponse.json({
        success: true,
        devMode: true,
        paymentUrl: null,
        message: "CinetPay non configure — mode developpement",
        transactionId: generateTransactionId(orderId),
      });
    }

    // ── Build URLs ──────────────────────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const transactionId = generateTransactionId(orderId);

    const result = await initPayment({
      amount,
      currency: paymentCurrency,
      transactionId,
      description: `Commande ${orderId} — ${order.serviceTitle}`,
      returnUrl: `${baseUrl}/dashboard/commandes/${orderId}?payment=cinetpay&status=return`,
      notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      customerName: customerName || session.user.name || "",
      customerEmail: customerEmail || session.user.email || "",
      customerPhone: customerPhone || "",
      channels: "ALL",
      metadata: JSON.stringify({ orderId, userId: session.user.id }),
      lang: "fr",
    });

    // ── Handle CinetPay response ────────────────────────────────────────
    if (!result) {
      return NextResponse.json(
        { error: "Erreur lors de la communication avec CinetPay" },
        { status: 502 }
      );
    }

    // CinetPay returns "201" for successful initialization
    if (result.code !== "201") {
      console.error(
        `[CinetPay] Payment init failed: code=${result.code}, message=${result.message}`
      );
      return NextResponse.json(
        {
          error: "Echec de l'initialisation du paiement CinetPay",
          details: result.message,
        },
        { status: 400 }
      );
    }

    // ── Update order with CinetPay transaction ID ───────────────────────
    orderStore.update(orderId, {
      status: "en_attente",
    });

    // Add system message to order timeline
    orderStore.addMessage(orderId, {
      sender: "client",
      senderName: "Systeme",
      content: `Paiement Mobile Money initie (ref: ${transactionId})`,
      timestamp: new Date().toISOString(),
      type: "system",
    });

    console.log(
      `[CinetPay] Payment initiated: orderId=${orderId}, txId=${transactionId}, amount=${amount} ${paymentCurrency}`
    );

    return NextResponse.json({
      success: true,
      paymentUrl: result.data.payment_url,
      paymentToken: result.data.payment_token,
      transactionId,
    });
  } catch (error) {
    console.error("[API /payments/cinetpay POST]", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
