import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { safeHttpUrl, generateWebhookSecret } from "@/lib/formations/paylink-webhook";
import { sendPaylinkWebhookSecretEmail } from "@/lib/email/paylink";

/**
 * PATCH /api/formations/vendeur/liens-paiement/[id]
 *
 * Modifie un lien de paiement EXISTANT — TOUS les paramètres de la création :
 * titre, montant, type de prix (fixe / libre), image, description, URL de
 * redirection et URL de webhook. Le lien garde son slug — donc son URL de
 * paiement publique reste identique (le vendeur a pu la partager / l'intégrer).
 *
 * Un vendeur pouvait tout fixer à la création mais rien changer ensuite : quand
 * il déplaçait sa page de redirection ou corrigeait un montant, il devait
 * supprimer et recréer le lien, ce qui changeait son URL.
 *
 * Règles (mêmes validations qu'à la création) :
 *  • Champ absent du corps → inchangé. Un champ optionnel présent mais vide
 *    (description, image, redirectUrl, webhookUrl) → effacé (null).
 *  • title : ≥ 2 caractères.
 *  • priceMode "fixed" → montant > 0 ; "libre" → montant ≥ 0 (suggestion).
 *  • redirectUrl : http/https, pas d'adresse interne.
 *  • webhookUrl  : https requis. Le secret n'est RÉGÉNÉRÉ que si l'URL webhook
 *    change réellement (ou passe d'absente à présente) — sinon on garde le
 *    secret existant, pour ne pas invalider une intégration qui marche. Effacer
 *    l'URL efface le secret. Un nouveau secret est envoyé par e-mail au vendeur.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!ctx) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 401 });

  const { id } = await params;

  // Ownership : le lien doit appartenir au vendeur ET être un lien de paiement.
  const link = await prisma.digitalProduct.findFirst({
    where: { id, instructeurId: ctx.instructeurId, isPaymentLink: true },
    select: { id: true, title: true, allowCustomAmount: true, redirectUrl: true, webhookUrl: true, webhookSecret: true },
  });
  if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });

  let body: {
    title?: string;
    amount?: number | string;
    priceMode?: string;
    description?: string | null;
    image?: string | null;
    redirectUrl?: string | null;
    webhookUrl?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const data: {
    title?: string;
    price?: number;
    allowCustomAmount?: boolean;
    description?: string | null;
    thumbnail?: string | null;
    redirectUrl?: string | null;
    webhookUrl?: string | null;
    webhookSecret?: string | null;
  } = {};

  // ── Titre ──────────────────────────────────────────────────────────────
  if ("title" in body) {
    const t = typeof body.title === "string" ? body.title.trim() : "";
    if (t.length < 2) {
      return NextResponse.json({ error: "Le titre est trop court." }, { status: 400 });
    }
    data.title = t.slice(0, 80);
  }

  // ── Type de prix + montant ─────────────────────────────────────────────
  // Les deux sont couplés : le montant se valide contre le type de prix voulu
  // (celui du corps s'il est fourni, sinon celui déjà enregistré).
  const allowCustom = "priceMode" in body ? body.priceMode === "libre" : link.allowCustomAmount;
  if ("priceMode" in body) data.allowCustomAmount = allowCustom;
  if ("amount" in body) {
    const amountNum = parseFloat(String(body.amount ?? 0));
    if (!allowCustom) {
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        return NextResponse.json({ error: "Le montant doit être supérieur à 0." }, { status: 400 });
      }
    } else if (!Number.isFinite(amountNum) || amountNum < 0) {
      return NextResponse.json({ error: "Le montant suggéré est invalide." }, { status: 400 });
    }
    data.price = Math.round(amountNum);
  }

  // ── Description ─────────────────────────────────────────────────────────
  if ("description" in body) {
    const d = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "";
    data.description = d || null;
  }

  // ── Image ───────────────────────────────────────────────────────────────
  if ("image" in body) {
    const img = typeof body.image === "string" ? body.image.trim() : "";
    data.thumbnail = img || null;
  }

  // ── Redirection ──────────────────────────────────────────────────────────
  if ("redirectUrl" in body) {
    const raw = body.redirectUrl == null ? "" : String(body.redirectUrl).trim();
    if (!raw) {
      data.redirectUrl = null;
    } else {
      const clean = safeHttpUrl(raw);
      if (!clean) {
        return NextResponse.json({ error: "URL de redirection invalide (http/https, pas d'adresse interne)." }, { status: 400 });
      }
      data.redirectUrl = clean;
    }
  }

  // ── Webhook (+ secret) ───────────────────────────────────────────────────
  let nouveauSecret: string | null = null;
  let nouvelleUrlWebhook: string | null = null;
  if ("webhookUrl" in body) {
    const raw = body.webhookUrl == null ? "" : String(body.webhookUrl).trim();
    if (!raw) {
      // Webhook retiré : plus d'URL, plus de secret.
      data.webhookUrl = null;
      data.webhookSecret = null;
    } else {
      const clean = safeHttpUrl(raw, { requireHttps: true });
      if (!clean) {
        return NextResponse.json({ error: "URL de webhook invalide (https requis, pas d'adresse interne)." }, { status: 400 });
      }
      data.webhookUrl = clean;
      // Secret régénéré UNIQUEMENT si l'URL change réellement, ou si le lien
      // n'avait pas encore de secret. Sinon on préserve l'intégration en place.
      if (clean !== link.webhookUrl || !link.webhookSecret) {
        nouveauSecret = generateWebhookSecret();
        nouvelleUrlWebhook = clean;
        data.webhookSecret = nouveauSecret;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucune modification fournie." }, { status: 400 });
  }

  const updated = await prisma.digitalProduct.update({
    where: { id: link.id },
    data,
    select: {
      id: true, slug: true, title: true, price: true, status: true,
      allowCustomAmount: true, redirectUrl: true, webhookUrl: true, webhookSecret: true,
    },
  });

  // Nouveau secret → on le renvoie au vendeur par e-mail (fire-and-forget),
  // comme à la création, pour qu'il l'ait même s'il quitte la page.
  if (nouveauSecret && nouvelleUrlWebhook && session?.user?.email) {
    void sendPaylinkWebhookSecretEmail({
      to: session.user.email,
      linkTitle: updated.title,
      webhookUrl: nouvelleUrlWebhook,
      secret: nouveauSecret,
    }).catch((e) => console.error("[liens-paiement PATCH] email secret webhook:", e));
  }

  return NextResponse.json({
    data: { ...updated, url: `/payer/${updated.slug}`, secretRegenerated: Boolean(nouveauSecret) },
  });
}
