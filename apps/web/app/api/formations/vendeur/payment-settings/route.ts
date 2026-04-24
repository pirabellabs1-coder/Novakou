/**
 * Vendor payment settings :
 *   - acceptedPaymentMethods : which methods the vendor's customers can use
 *     at checkout (orange_money, wave, mtn_momo, moov_money, card, paypal…)
 *   - payoutMethods : list of accounts where the vendor receives money
 *     when they withdraw (mobile money phones, bank IBAN, PayPal email)
 *
 * GET  → current settings
 * PUT  body { acceptedPaymentMethods? string[], payoutMethods? PayoutMethod[] }
 *      → replace full config
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

const VALID_PAYMENT_METHODS = new Set([
  "orange_money",
  "wave",
  "mtn_momo",
  "moov_money",
  "card",
  "moneroo",
  "stripe",
  "paypal",
  "bank_transfer",
  "free",
]);

const VALID_PAYOUT_METHODS = new Set([
  "orange_money",
  "wave",
  "mtn_momo",
  "moov_money",
  "bank_transfer",
  "paypal",
  "stripe",
]);

interface PayoutMethod {
  id: string;
  method: string;
  label?: string;
  phone?: string;
  iban?: string;
  // Champs bancaires requis par Moneroo pour les virements SEPA/international
  bic?: string;
  bank_name?: string;
  account_holder?: string;
  email?: string;
  primary?: boolean;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const profile = await prisma.instructeurProfile.findUnique({
    where: { id: ctx.instructeurId },
    select: {
      acceptedPaymentMethods: true,
      payoutMethods: true,
    },
  });

  return NextResponse.json({
    data: {
      acceptedPaymentMethods: profile?.acceptedPaymentMethods ?? [],
      payoutMethods: (profile?.payoutMethods as PayoutMethod[] | null) ?? [],
    },
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    acceptedPaymentMethods?: string[];
    payoutMethods?: PayoutMethod[];
  };

  const data: Record<string, unknown> = {};

  if (Array.isArray(body.acceptedPaymentMethods)) {
    const filtered = Array.from(
      new Set(
        body.acceptedPaymentMethods
          .map((m) => String(m).toLowerCase().trim())
          .filter((m) => VALID_PAYMENT_METHODS.has(m)),
      ),
    );
    if (filtered.length === 0) {
      return NextResponse.json(
        { error: "Au moins une méthode de paiement doit rester activée." },
        { status: 400 },
      );
    }
    data.acceptedPaymentMethods = filtered;
  }

  if (Array.isArray(body.payoutMethods)) {
    const cleaned: PayoutMethod[] = [];
    for (const raw of body.payoutMethods.slice(0, 10)) {
      if (!raw || typeof raw !== "object") continue;
      const method = String(raw.method ?? "").toLowerCase().trim();
      if (!VALID_PAYOUT_METHODS.has(method)) continue;

      const entry: PayoutMethod = {
        id: String(raw.id ?? `pm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
        method,
        label: raw.label ? String(raw.label).slice(0, 80) : undefined,
        primary: !!raw.primary,
      };

      // Method-specific fields
      if (["orange_money", "wave", "mtn_momo", "moov_money"].includes(method)) {
        const phone = String(raw.phone ?? "").trim();
        if (!/^\+?\d{7,20}$/.test(phone)) {
          return NextResponse.json(
            { error: `Numéro invalide pour ${method}` },
            { status: 400 },
          );
        }
        entry.phone = phone;
      } else if (method === "bank_transfer") {
        const iban = String(raw.iban ?? "").trim().toUpperCase().replace(/\s/g, "");
        if (iban.length < 15 || iban.length > 40) {
          return NextResponse.json(
            { error: "IBAN invalide (15-40 caractères)" },
            { status: 400 },
          );
        }
        entry.iban = iban;
        // Moneroo exige egalement le BIC et le nom de la banque pour un virement
        if (raw.bic) entry.bic = String(raw.bic).trim().toUpperCase();
        if (raw.bank_name) entry.bank_name = String(raw.bank_name).trim().slice(0, 100);
        if (raw.account_holder) entry.account_holder = String(raw.account_holder).trim().slice(0, 100);
      } else if (method === "paypal") {
        const email = String(raw.email ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json(
            { error: "Email PayPal invalide" },
            { status: 400 },
          );
        }
        entry.email = email;
      } else if (method === "stripe") {
        // Stripe Connect — on ne stocke pas d'infos sensibles ici
        entry.email = raw.email ? String(raw.email).toLowerCase() : undefined;
      }
      cleaned.push(entry);
    }

    // Ensure at most one "primary" method
    const primaryCount = cleaned.filter((m) => m.primary).length;
    if (primaryCount > 1) {
      // Keep only the first primary
      let seen = false;
      cleaned.forEach((m) => {
        if (m.primary) {
          if (seen) m.primary = false;
          seen = true;
        }
      });
    } else if (primaryCount === 0 && cleaned.length > 0) {
      cleaned[0].primary = true;
    }

    data.payoutMethods = cleaned as unknown as object;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const updated = await prisma.instructeurProfile.update({
    where: { id: ctx.instructeurId },
    data,
    select: {
      acceptedPaymentMethods: true,
      payoutMethods: true,
    },
  });

  return NextResponse.json({
    data: {
      acceptedPaymentMethods: updated.acceptedPaymentMethods ?? [],
      payoutMethods: (updated.payoutMethods as PayoutMethod[] | null) ?? [],
    },
  });
}
