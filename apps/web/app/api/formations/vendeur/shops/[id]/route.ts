import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { removeDomain } from "@/lib/vercel-domains";
import { SHOP_FONTS } from "@/lib/formations/shop-fonts";

type Params = { params: Promise<{ id: string }> };

async function ctxAndShop(shopId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return { error: "Non authentifié", status: 401 as const };
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return { error: "Profil vendeur introuvable", status: 404 as const };
  const shop = await prisma.vendorShop.findFirst({
    where: { id: shopId, instructeurId: ctx.instructeurId },
  });
  if (!shop) return { error: "Boutique introuvable", status: 404 as const };
  return { ctx, shop };
}

/** GET — single shop detail. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const r = await ctxAndShop(id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ data: r.shop });
}

/** PATCH — update name / theme / set primary. */
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const r = await ctxAndShop(id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  let body: {
    name?: string;
    slug?: string;
    description?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
    themeColor?: string | null;
    isPrimary?: boolean;
    legalName?: string | null;
    legalAddress?: string | null;
    legalPhone?: string | null;
    legalEmail?: string | null;
    legalCountry?: string | null;
    aboutText?: string | null;
    font?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const n = body.name.trim().slice(0, 80);
    if (n.length < 2) return NextResponse.json({ error: "Nom trop court" }, { status: 400 });
    data.name = n;
  }
  // Slug personnalisable (URL publique de la boutique). Normalisé côté serveur :
  // minuscules, tirets, accents retirés — pour rester une URL propre et valide.
  if (typeof body.slug === "string") {
    const normalized = body.slug
      .normalize("NFD").replace(/[̀-ͯ]/g, "")   // retire les accents
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-")                          // tout le reste → tirets
      .replace(/^-+|-+$/g, "")                              // trim tirets
      .slice(0, 60);
    if (normalized.length < 3) {
      return NextResponse.json({ error: "L'URL doit contenir au moins 3 caractères (lettres/chiffres)." }, { status: 400 });
    }
    // RESERVED : évite de shadow les routes plateforme sous /boutique/[slug]/[page]
    const RESERVED = new Set(["a-propos", "aide", "contact", "plan-du-site", "mentions-legales", "conditions", "confidentialite", "by-domain"]);
    if (RESERVED.has(normalized)) {
      return NextResponse.json({ error: "Cette URL est réservée, choisissez-en une autre." }, { status: 400 });
    }
    if (normalized !== r.shop.slug) data.slug = normalized;
  }
  if ("description" in body) data.description = body.description?.toString().slice(0, 600) ?? null;
  if ("logoUrl" in body) data.logoUrl = body.logoUrl ?? null;
  if ("coverUrl" in body) data.coverUrl = body.coverUrl ?? null;
  // Infos légales (pages boutique auto-générées).
  const trimOrNull = (v: unknown, max: number) => { const s = typeof v === "string" ? v.trim() : ""; return s ? s.slice(0, max) : null; };
  if ("legalName" in body) data.legalName = trimOrNull(body.legalName, 120);
  if ("legalAddress" in body) data.legalAddress = trimOrNull(body.legalAddress, 240);
  if ("legalPhone" in body) data.legalPhone = trimOrNull(body.legalPhone, 40);
  if ("legalEmail" in body) data.legalEmail = trimOrNull(body.legalEmail, 120);
  if ("legalCountry" in body) data.legalCountry = trimOrNull(body.legalCountry, 60);
  if ("aboutText" in body) data.aboutText = trimOrNull(body.aboutText, 4000);
  if ("font" in body) {
    const f = trimOrNull(body.font, 40);
    data.font = f && (SHOP_FONTS as readonly string[]).includes(f) ? f : null;
  }
  if ("themeColor" in body) {
    const c = body.themeColor;
    if (c === null || (typeof c === "string" && /^#?[0-9a-f]{6}$/i.test(c))) {
      data.themeColor = c ? (c.startsWith("#") ? c : `#${c}`) : null;
    } else {
      return NextResponse.json({ error: "Couleur invalide" }, { status: 400 });
    }
  }

  try {
    if (body.isPrimary === true) {
      // Demote others, promote this one in a transaction
      await prisma.$transaction([
        prisma.vendorShop.updateMany({
          where: { instructeurId: r.ctx.instructeurId, isPrimary: true },
          data: { isPrimary: false },
        }),
        prisma.vendorShop.update({
          where: { id: r.shop.id },
          data: { ...data, isPrimary: true },
        }),
      ]);
    } else {
      await prisma.vendorShop.update({ where: { id: r.shop.id }, data });
    }
  } catch (e) {
    // Collision d'unicité (slug déjà pris par une autre boutique).
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Cette URL est déjà utilisée par une autre boutique." }, { status: 409 });
    }
    throw e;
  }

  const updated = await prisma.vendorShop.findUnique({ where: { id: r.shop.id } });
  return NextResponse.json({ data: updated });
}

/** DELETE — remove a shop. Cannot delete the last/primary shop unless replaced. */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const r = await ctxAndShop(id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const total = await prisma.vendorShop.count({
    where: { instructeurId: r.ctx.instructeurId },
  });
  if (total <= 1) {
    return NextResponse.json(
      { error: "Impossible de supprimer votre seule boutique." },
      { status: 400 },
    );
  }

  // Disconnect any custom domain attached to Vercel before deleting
  if (r.shop.customDomain) {
    await removeDomain(r.shop.customDomain).catch(() => null);
  }

  await prisma.vendorShop.delete({ where: { id: r.shop.id } });

  // If the deleted one was primary → promote the oldest remaining
  if (r.shop.isPrimary) {
    const next = await prisma.vendorShop.findFirst({
      where: { instructeurId: r.ctx.instructeurId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.vendorShop.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  return NextResponse.json({ data: { deleted: true } });
}
