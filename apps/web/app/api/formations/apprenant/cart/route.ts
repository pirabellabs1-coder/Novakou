import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Un article = une formation OU un produit digital.
const addSchema = z
  .object({
    formationId: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
  })
  .refine((d) => !!d.formationId !== !!d.productId, {
    message: "Fournir soit formationId, soit productId.",
  });

async function resolveCartUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const sid = session?.user?.id;
  const email = session?.user?.email?.toLowerCase().trim();
  if (!sid && !email) return null;
  if (sid) {
    const u = await prisma.user.findUnique({ where: { id: sid }, select: { id: true } }).catch(() => null);
    if (u) return u.id;
  }
  if (email) {
    const u = await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null);
    if (u) return u.id;
  }
  return null;
}

const GUEST_COOKIE = "nk_guest_cart";
const GUEST_MAX_ITEMS = 20;
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

interface GuestItem { formationId?: string; productId?: string; addedAt: string }
interface GuestCart { items: GuestItem[] }

async function readGuestCart(): Promise<GuestCart> {
  const c = await cookies();
  const raw = c.get(GUEST_COOKIE)?.value;
  if (!raw) return { items: [] };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed?.items)) return { items: [] };
    return parsed as GuestCart;
  } catch {
    return { items: [] };
  }
}

async function writeGuestCart(cart: GuestCart) {
  const c = await cookies();
  c.set(GUEST_COOKIE, encodeURIComponent(JSON.stringify(cart)), {
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
}

const FORMATION_SELECT = { id: true, slug: true, title: true, price: true, thumbnail: true, level: true, instructeurId: true } as const;
const PRODUCT_SELECT = { id: true, slug: true, title: true, price: true, thumbnail: true, instructeurId: true } as const;

export async function GET() {
  try {
    const userId = await resolveCartUserId();

    if (userId) {
      const items = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          formation: { select: FORMATION_SELECT },
          product: { select: PRODUCT_SELECT },
        },
        orderBy: { createdAt: "desc" },
      });
      const total = items.reduce((s, it) => s + (it.formation?.price ?? it.product?.price ?? 0), 0);
      return NextResponse.json({ data: items, total, count: items.length, guest: false });
    }

    // Guest — cookie cart
    const guest = await readGuestCart();
    if (guest.items.length === 0) {
      return NextResponse.json({ data: [], total: 0, count: 0, guest: true });
    }
    const fIds = guest.items.map((i) => i.formationId).filter(Boolean) as string[];
    const pIds = guest.items.map((i) => i.productId).filter(Boolean) as string[];
    const [formations, products] = await Promise.all([
      fIds.length ? prisma.formation.findMany({ where: { id: { in: fIds } }, select: FORMATION_SELECT }) : Promise.resolve([]),
      pIds.length ? prisma.digitalProduct.findMany({ where: { id: { in: pIds } }, select: PRODUCT_SELECT }) : Promise.resolve([]),
    ]);
    const fById = new Map(formations.map((f) => [f.id, f]));
    const pById = new Map(products.map((p) => [p.id, p]));
    const items = guest.items
      .map((i) => {
        if (i.formationId) {
          const f = fById.get(i.formationId);
          if (!f) return null;
          return { id: `guest-f-${i.formationId}`, userId: null, formationId: i.formationId, productId: null, createdAt: i.addedAt, formation: f, product: null };
        }
        if (i.productId) {
          const p = pById.get(i.productId);
          if (!p) return null;
          return { id: `guest-p-${i.productId}`, userId: null, formationId: null, productId: i.productId, createdAt: i.addedAt, formation: null, product: p };
        }
        return null;
      })
      .filter(Boolean) as Array<{ formation: { price: number } | null; product: { price: number } | null }>;
    const total = items.reduce((s, it) => s + (it.formation?.price ?? it.product?.price ?? 0), 0);
    return NextResponse.json({ data: items, total, count: items.length, guest: true });
  } catch (err) {
    console.error("[cart GET]", err);
    return NextResponse.json({ data: [], total: 0, count: 0, guest: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    const { formationId, productId } = parsed.data;

    // Vérifie l'existence de l'article
    if (formationId) {
      const f = await prisma.formation.findUnique({ where: { id: formationId }, select: { id: true } }).catch(() => null);
      if (!f) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    } else if (productId) {
      const p = await prisma.digitalProduct.findUnique({ where: { id: productId }, select: { id: true } }).catch(() => null);
      if (!p) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const userId = await resolveCartUserId();

    if (userId) {
      if (formationId) {
        const already = await prisma.enrollment.findUnique({ where: { userId_formationId: { userId, formationId } } }).catch(() => null);
        if (already) return NextResponse.json({ error: "Vous êtes déjà inscrit à cette formation" }, { status: 409 });
        const item = await prisma.cartItem.upsert({
          where: { userId_formationId: { userId, formationId } },
          update: {},
          create: { userId, formationId },
        });
        return NextResponse.json({ data: item, guest: false }, { status: 201 });
      } else {
        const already = await prisma.digitalProductPurchase.findUnique({ where: { userId_productId: { userId, productId: productId! } } }).catch(() => null);
        if (already) return NextResponse.json({ error: "Vous avez déjà acheté ce produit" }, { status: 409 });
        const item = await prisma.cartItem.upsert({
          where: { userId_productId: { userId, productId: productId! } },
          update: {},
          create: { userId, productId: productId! },
        });
        return NextResponse.json({ data: item, guest: false }, { status: 201 });
      }
    }

    // Guest path
    const guest = await readGuestCart();
    const dup = guest.items.find((i) => (formationId && i.formationId === formationId) || (productId && i.productId === productId));
    if (dup) return NextResponse.json({ data: { formationId, productId }, guest: true, alreadyInCart: true });
    if (guest.items.length >= GUEST_MAX_ITEMS) {
      return NextResponse.json({ error: "Panier invité saturé — connectez-vous pour en ajouter plus" }, { status: 400 });
    }
    guest.items.unshift({ ...(formationId ? { formationId } : { productId }), addedAt: new Date().toISOString() });
    await writeGuestCart(guest);
    return NextResponse.json({ data: { formationId, productId }, guest: true }, { status: 201 });
  } catch (err) {
    console.error("[cart POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    const formationId = searchParams.get("formationId");
    const productId = searchParams.get("productId");

    const userId = await resolveCartUserId();

    if (userId) {
      if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
      await prisma.cartItem.deleteMany({ where: { id, userId } });
      return NextResponse.json({ success: true, guest: false });
    }

    // Guest path — by formationId / productId (ids invités dérivés)
    const guest = await readGuestCart();
    const fTarget = formationId || (id?.startsWith("guest-f-") ? id.slice(8) : null);
    const pTarget = productId || (id?.startsWith("guest-p-") ? id.slice(8) : null);
    if (!fTarget && !pTarget) return NextResponse.json({ error: "Identifiant requis" }, { status: 400 });
    guest.items = guest.items.filter((i) => i.formationId !== fTarget && i.productId !== pTarget);
    await writeGuestCart(guest);
    return NextResponse.json({ success: true, guest: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
