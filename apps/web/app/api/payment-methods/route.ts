/**
 * /api/payment-methods — Moyens de paiement sauvegardés de l'utilisateur.
 *
 * Contrat (voir lib/api-client.ts → paymentMethodsApi) :
 *   GET  → { methods: ApiPaymentMethod[] }
 *   POST { type, ...champs }            → { success, method }   (ajout)
 *   POST { action: "delete", id }       → { success }
 *   POST { action: "set-default", id }  → { success }
 *
 * Sécurité :
 *   - Session next-auth obligatoire, scope strict par userId.
 *   - JAMAIS de numéro de carte complet ni de CVV : pour une carte on
 *     n'accepte QUE label + brand + last4 (4 chiffres). Tout champ contenant
 *     plus de 8 chiffres consécutifs (hors téléphone Mobile Money) est rejeté.
 *   - Les cartes réelles restent traitées sur la page hébergée Moneroo.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

const MAX_METHODS = 10;

const MOMO_PROVIDERS = new Set(["orange_money", "wave", "mtn_momo", "moov_money"]);
const CARD_BRANDS = new Set(["visa", "mastercard"]);

const MOMO_LABELS: Record<string, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  mtn_momo: "MTN Mobile Money",
  moov_money: "Moov Money",
};

type SavedMethodRecord = {
  id: string;
  type: string;
  label: string | null;
  provider: string | null;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  iban: string | null;
  isDefault: boolean;
  createdAt: Date;
};

/** Mappe l'enregistrement Prisma vers la forme ApiPaymentMethod du client. */
function toApi(m: SavedMethodRecord) {
  return {
    id: m.id,
    type: (m.type === "card" || m.type === "bank" || m.type === "paypal" ? m.type : "momo") as
      | "card"
      | "momo"
      | "bank"
      | "paypal",
    label: m.label ?? defaultLabel(m),
    last4: m.last4 ?? undefined,
    brand: m.brand ?? undefined,
    provider: m.provider ?? undefined,
    phone: m.phone ?? undefined,
    email: m.email ?? undefined,
    bankName: m.bankName ?? undefined,
    iban: m.iban ? maskIban(m.iban) : undefined,
    expiresAt:
      m.expMonth && m.expYear
        ? `${String(m.expMonth).padStart(2, "0")}/${m.expYear}`
        : undefined,
    isDefault: m.isDefault,
    createdAt: m.createdAt.toISOString(),
  };
}

function defaultLabel(m: SavedMethodRecord): string {
  if (m.type === "momo") return MOMO_LABELS[m.provider ?? ""] ?? "Mobile Money";
  if (m.type === "card") return m.brand === "mastercard" ? "Mastercard" : "Carte Visa";
  if (m.type === "bank") return m.bankName ?? "Compte bancaire";
  if (m.type === "paypal") return "PayPal";
  return "Moyen de paiement";
}

/** IBAN masqué pour l'affichage : 4 premiers + 4 derniers caractères. */
function maskIban(iban: string): string {
  if (iban.length <= 8) return iban;
  return `${iban.slice(0, 4)}••••${iban.slice(-4)}`;
}

/**
 * Détection de PAN (numéro de carte complet) : toute valeur string du body,
 * hors champ téléphone, contenant plus de 8 chiffres consécutifs est
 * considérée comme un numéro de carte potentiel → rejet.
 */
function containsPanLikeValue(body: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(body)) {
    if (key === "phone") continue; // un numéro Mobile Money peut dépasser 8 chiffres
    if (typeof value !== "string") continue;
    if (/\d{9,}/.test(value.replace(/[\s-]/g, ""))) return true;
  }
  return false;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const methods = await prisma.savedPaymentMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ methods: methods.map(toApi) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : null;

  // ── Suppression ──────────────────────────────────────────────────────────
  if (action === "delete") {
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });

    const existing = await prisma.savedPaymentMethod.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Moyen de paiement introuvable" }, { status: 404 });

    await prisma.savedPaymentMethod.delete({ where: { id: existing.id } });

    // Si on supprime le moyen par défaut, promouvoir le plus récent restant.
    if (existing.isDefault) {
      const next = await prisma.savedPaymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await prisma.savedPaymentMethod.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
    return NextResponse.json({ success: true });
  }

  // ── Définir par défaut ───────────────────────────────────────────────────
  if (action === "set-default") {
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });

    const existing = await prisma.savedPaymentMethod.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Moyen de paiement introuvable" }, { status: 404 });

    await prisma.$transaction([
      prisma.savedPaymentMethod.updateMany({
        where: { userId, isDefault: true, id: { not: existing.id } },
        data: { isDefault: false },
      }),
      prisma.savedPaymentMethod.update({
        where: { id: existing.id },
        data: { isDefault: true },
      }),
    ]);
    return NextResponse.json({ success: true });
  }

  if (action) {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  // ── Ajout ────────────────────────────────────────────────────────────────
  const count = await prisma.savedPaymentMethod.count({ where: { userId } });
  if (count >= MAX_METHODS) {
    return NextResponse.json(
      { error: `Limite atteinte : ${MAX_METHODS} moyens de paiement maximum.` },
      { status: 400 },
    );
  }

  const type = String(body.type ?? "").toLowerCase().trim();
  if (!["momo", "card", "bank", "paypal"].includes(type)) {
    return NextResponse.json({ error: "Type de moyen de paiement invalide" }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label.trim().slice(0, 80) : "";

  const data: {
    userId: string;
    type: string;
    label: string | null;
    provider?: string;
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    phone?: string;
    email?: string;
    bankName?: string;
    iban?: string;
    isDefault: boolean;
  } = {
    userId,
    type,
    label: label || null,
    isDefault: count === 0, // premier moyen ajouté = défaut
  };

  if (type === "momo") {
    const provider = String(body.provider ?? "").toLowerCase().trim();
    if (!MOMO_PROVIDERS.has(provider)) {
      return NextResponse.json(
        { error: "Opérateur Mobile Money invalide (Orange Money, Wave, MTN MoMo, Moov Money)" },
        { status: 400 },
      );
    }
    const phone = String(body.phone ?? "").replace(/[\s-]/g, "").trim();
    if (!/^\+?\d{7,20}$/.test(phone)) {
      return NextResponse.json({ error: "Numéro de téléphone Mobile Money invalide" }, { status: 400 });
    }
    data.provider = provider;
    data.phone = phone;
    if (!data.label) data.label = MOMO_LABELS[provider];
  } else if (type === "card") {
    // SÉCURITÉ : on ne stocke JAMAIS un numéro de carte complet ni un CVV.
    if (containsPanLikeValue(body)) {
      return NextResponse.json(
        {
          error:
            "Pour votre sécurité, n'entrez jamais votre numéro de carte complet ici. " +
            "Seuls les 4 derniers chiffres sont acceptés — le paiement par carte " +
            "est traité sur la page sécurisée Moneroo.",
        },
        { status: 400 },
      );
    }
    const brand = String(body.brand ?? "").toLowerCase().trim();
    if (!CARD_BRANDS.has(brand)) {
      return NextResponse.json({ error: "Type de carte invalide (Visa ou Mastercard)" }, { status: 400 });
    }
    const last4 = String(body.last4 ?? "").trim();
    if (!/^\d{4}$/.test(last4)) {
      return NextResponse.json(
        { error: "Indiquez uniquement les 4 derniers chiffres de la carte" },
        { status: 400 },
      );
    }
    if (!data.label) {
      return NextResponse.json({ error: "Donnez un nom à cette carte (ex : « Visa perso »)" }, { status: 400 });
    }
    data.brand = brand;
    data.last4 = last4;
    data.provider = "moneroo";
    const expMonth = Number(body.expMonth);
    const expYear = Number(body.expYear);
    if (Number.isInteger(expMonth) && expMonth >= 1 && expMonth <= 12) data.expMonth = expMonth;
    if (Number.isInteger(expYear) && expYear >= 2020 && expYear <= 2100) data.expYear = expYear;
  } else if (type === "bank") {
    const bankName = String(body.bankName ?? "").trim().slice(0, 100);
    if (!bankName) {
      return NextResponse.json({ error: "Nom de la banque requis" }, { status: 400 });
    }
    const iban = String(body.iban ?? "").toUpperCase().replace(/\s/g, "");
    if (!/^[A-Z0-9]{15,40}$/.test(iban)) {
      return NextResponse.json({ error: "IBAN invalide (15 à 40 caractères)" }, { status: 400 });
    }
    data.bankName = bankName;
    data.iban = iban;
    if (!data.label) data.label = bankName;
  } else {
    // paypal
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Adresse email PayPal invalide" }, { status: 400 });
    }
    data.email = email;
    if (!data.label) data.label = "PayPal";
  }

  const created = await prisma.savedPaymentMethod.create({ data });

  return NextResponse.json({ success: true, method: toApi(created) });
}
