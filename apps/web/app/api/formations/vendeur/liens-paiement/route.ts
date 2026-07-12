import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { safeHttpUrl, generateWebhookSecret } from "@/lib/formations/paylink-webhook";

/**
 * Liens de paiement — un lien = un DigitalProduct CACHÉ SANS FICHIER
 * (isPaymentLink=true, hiddenFromMarketplace=true, fileUrl=null). Il passe par
 * le MÊME checkout que les produits → commission 10 % + vente comptée
 * automatiquement (cf. lib/formations/constants.ts PLATFORM_COMMISSION_RATE).
 * L'URL publique de paiement est la page produit standard : /produit/[slug].
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function getOrCreateCategory(name: string) {
  const slug = slugify(name) || "divers";
  const existing = await prisma.formationCategory.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.formationCategory.create({ data: { name, slug, isActive: true } });
}

/** GET — liste des liens de paiement du vendeur. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 401 });

  const links = await prisma.digitalProduct.findMany({
    where: { instructeurId: ctx.instructeurId, isPaymentLink: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, title: true, description: true, price: true,
      thumbnail: true, allowCustomAmount: true,
      status: true, salesCount: true, currentBuyers: true, createdAt: true,
      redirectUrl: true, webhookUrl: true, webhookSecret: true,
    },
  });

  // Revenu réel = somme des montants payés (fiable même en prix libre où le
  // montant varie), pas price × salesCount.
  const ids = links.map((l) => l.id);
  const sums = ids.length
    ? await prisma.digitalProductPurchase.groupBy({
        by: ["productId"],
        where: { productId: { in: ids } },
        _sum: { paidAmount: true },
      })
    : [];
  const revById = new Map(sums.map((s) => [s.productId, s._sum.paidAmount ?? 0]));

  const data = links.map((l) => ({
    ...l,
    revenue: Math.round(revById.get(l.id) ?? 0),
    url: `/payer/${l.slug}`,
  }));
  return NextResponse.json({ data });
}

/** POST — créer un lien de paiement. Body: { title, amount, description? }. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) {
    return NextResponse.json(
      { error: "Impossible de résoudre votre session. Reconnectez-vous." },
      { status: 401 },
    );
  }

  let body: { title?: string; amount?: number | string; description?: string; image?: string; priceMode?: string; redirectUrl?: string; webhookUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 2) {
    return NextResponse.json({ error: "Le titre est trop court." }, { status: 400 });
  }

  // Intégration sur le site du vendeur : redirection (http/https) + webhook (https).
  let redirectUrl: string | null = null;
  if (body.redirectUrl && String(body.redirectUrl).trim()) {
    redirectUrl = safeHttpUrl(body.redirectUrl);
    if (!redirectUrl) return NextResponse.json({ error: "URL de redirection invalide (http/https, pas d'adresse interne)." }, { status: 400 });
  }
  let webhookUrl: string | null = null;
  if (body.webhookUrl && String(body.webhookUrl).trim()) {
    webhookUrl = safeHttpUrl(body.webhookUrl, { requireHttps: true });
    if (!webhookUrl) return NextResponse.json({ error: "URL de webhook invalide (https requis, pas d'adresse interne)." }, { status: 400 });
  }
  const webhookSecret = webhookUrl ? generateWebhookSecret() : null;

  // Prix libre = l'acheteur choisit le montant (le montant fourni sert alors de
  // suggestion/minimum, 0 accepté). Sinon montant fixe strictement > 0.
  const allowCustomAmount = body.priceMode === "libre";
  const amountNum = parseFloat(String(body.amount ?? 0));
  if (!allowCustomAmount) {
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Le montant doit être supérieur à 0." }, { status: 400 });
    }
  } else if (!Number.isFinite(amountNum) || amountNum < 0) {
    return NextResponse.json({ error: "Le montant suggéré est invalide." }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : null;
  const image = typeof body.image === "string" && body.image.trim() ? body.image.trim() : null;

  const activeShopId = await getActiveShopId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  const cat = await getOrCreateCategory("Liens de paiement");

  // Slug unique
  const baseSlug = slugify(title) || "lien";
  let slug = `${baseSlug}-${Date.now().toString(36)}`;
  let suffix = 1;
  while (await prisma.digitalProduct.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${Date.now().toString(36)}-${suffix++}`;
  }

  const link = await prisma.digitalProduct.create({
    data: {
      slug,
      title,
      description,
      productType: "AUTRE",
      categoryId: cat.id,
      thumbnail: image,
      price: Math.round(amountNum),
      isFree: false,
      // Lien de paiement : caché du marketplace, sans fichier, ACTIF direct.
      isPaymentLink: true,
      allowCustomAmount,
      hiddenFromMarketplace: true,
      status: "ACTIF",
      instructeurId: ctx.instructeurId,
      shopId: activeShopId,
      redirectUrl,
      webhookUrl,
      webhookSecret,
    },
    select: { id: true, slug: true, title: true, price: true, status: true, allowCustomAmount: true, redirectUrl: true, webhookUrl: true, webhookSecret: true },
  });

  return NextResponse.json({
    data: { ...link, url: `/payer/${link.slug}` },
  });
}
