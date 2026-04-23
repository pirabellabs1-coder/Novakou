import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { ensurePrimaryShop } from "@/lib/formations/ensure-primary-shop";

const MAX_SHOPS = 5;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function ctx() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return { error: "Non authentifié", status: 401 as const };
  const c = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!c) return { error: "Profil vendeur introuvable", status: 404 as const };
  return { ctx: c };
}

/** GET — list vendor's shops (own + shops where user is a member). */
export async function GET() {
  const r = await ctx();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  // ✨ Auto-crée une boutique primaire si le vendeur n'en a AUCUNE
  // (cas du vendeur qui devient instructeur APRÈS inscription, sans passer
  // par le flow register avec formationsRole=instructeur)
  await ensurePrimaryShop({
    instructeurId: r.ctx.instructeurId,
    userId: r.ctx.userId,
  });

  // 1) Shops du propriétaire (instructeurId match) — après ensurePrimaryShop
  const ownShops = await prisma.vendorShop.findMany({
    where: { instructeurId: r.ctx.instructeurId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      id: true, name: true, slug: true, isPrimary: true,
      logoUrl: true, themeColor: true,
      customDomain: true, customDomainVerified: true,
      createdAt: true,
    },
  });

  // 2) Shops où je suis membre (MANAGER ou EDITOR, pas OWNER car c'est déjà dans ownShops)
  const memberships = await prisma.shopMember.findMany({
    where: {
      userId: r.ctx.userId,
      role: { in: ["MANAGER", "EDITOR"] },
      shopId: { notIn: ownShops.map((s) => s.id) }, // évite doublons
    },
    include: {
      shop: {
        select: {
          id: true, name: true, slug: true, isPrimary: true,
          logoUrl: true, themeColor: true,
          customDomain: true, customDomainVerified: true,
          createdAt: true,
        },
      },
    },
  });

  const memberShops = memberships.map((m) => ({ ...m.shop, memberRole: m.role as "MANAGER" | "EDITOR" }));
  const shops = [...ownShops.map((s) => ({ ...s, memberRole: "OWNER" as const })), ...memberShops];

  return NextResponse.json({ data: { shops, max: MAX_SHOPS } });
}

/** POST — create a new shop. body { name }. */
export async function POST(req: Request) {
  const r = await ctx();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const name = (body.name ?? "").trim().slice(0, 80);
  if (name.length < 2) {
    return NextResponse.json({ error: "Nom de boutique trop court" }, { status: 400 });
  }

  const count = await prisma.vendorShop.count({
    where: { instructeurId: r.ctx.instructeurId },
  });
  if (count >= MAX_SHOPS) {
    return NextResponse.json(
      { error: `Limite atteinte: ${MAX_SHOPS} boutiques maximum par vendeur` },
      { status: 403 },
    );
  }

  // Generate unique slug from name
  const base = slugify(name) || "boutique";
  let slug = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.vendorShop.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${base}-${i++}`;
    if (i > 99) {
      slug = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }
  if (!SLUG_RE.test(slug)) slug = `boutique-${Date.now().toString(36)}`;

  const shop = await prisma.vendorShop.create({
    data: {
      instructeurId: r.ctx.instructeurId,
      name,
      slug,
      isPrimary: count === 0,
    },
    select: {
      id: true, name: true, slug: true, isPrimary: true,
      customDomain: true, customDomainVerified: true,
    },
  });

  return NextResponse.json({ data: { shop } }, { status: 201 });
}
