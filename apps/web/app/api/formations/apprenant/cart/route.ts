import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { z } from "zod";

const addSchema = z.object({
  formationId: z.string().min(1),
});

/**
 * Resolve the current user ID for cart operations.
 * Returns null for genuine guests (no NextAuth session) → the caller
 * falls back to the cookie-based guest cart. If session.user.id is
 * stale (user deleted/recreated), we try an email lookup to recover.
 */
async function resolveCartUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const sid = session?.user?.id;
  const email = session?.user?.email?.toLowerCase().trim();

  // No session at all → guest (cookie flow). Do NOT use a dev fallback here
  // because it would break the guest flow for anonymous browsers in dev.
  if (!sid && !email) return null;

  // 1. Session.user.id valid ?
  if (sid) {
    const u = await prisma.user.findUnique({ where: { id: sid }, select: { id: true } }).catch(() => null);
    if (u) return u.id;
  }
  // 2. Fallback email lookup
  if (email) {
    const u = await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null);
    if (u) return u.id;
  }
  return null;
}

/** Guest cart stored as JSON in a cookie: { items: string[] } */
const GUEST_COOKIE = "nk_guest_cart";
const GUEST_MAX_ITEMS = 20;
const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface GuestCart {
  items: { formationId: string; addedAt: string }[];
}

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
    httpOnly: false, // client needs to read count for badge
  });
}

export async function GET() {
  try {
    const userId = await resolveCartUserId();

    // Authenticated path — DB cart
    if (userId) {
      const items = await prisma.cartItem.findMany({
        where: { userId },
        include: {
          formation: {
            select: {
              id: true,
              slug: true,
              title: true,
              price: true,
              thumbnail: true,
              level: true,
              instructeurId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      const total = items.reduce((s, item) => s + (item.formation?.price ?? 0), 0);
      return NextResponse.json({ data: items, total, count: items.length, guest: false });
    }

    // Guest path — cookie cart
    const guest = await readGuestCart();
    if (guest.items.length === 0) {
      return NextResponse.json({ data: [], total: 0, count: 0, guest: true });
    }
    const formations = await prisma.formation.findMany({
      where: { id: { in: guest.items.map((i) => i.formationId) } },
      select: {
        id: true, slug: true, title: true, price: true, thumbnail: true, level: true, instructeurId: true,
      },
    });
    const byId = new Map(formations.map((f) => [f.id, f]));
    const items = guest.items
      .map((i) => {
        const f = byId.get(i.formationId);
        if (!f) return null;
        return {
          id: `guest-${i.formationId}`,
          userId: null,
          formationId: i.formationId,
          createdAt: i.addedAt,
          formation: f,
        };
      })
      .filter(Boolean);
    const total = items.reduce((s, item) => s + (item!.formation.price ?? 0), 0);
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
    const { formationId } = parsed.data;

    // Verify the formation exists before adding
    const formation = await prisma.formation
      .findUnique({ where: { id: formationId }, select: { id: true, title: true, price: true } })
      .catch(() => null);
    if (!formation) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

    const userId = await resolveCartUserId();

    // ── Authenticated path ───────────────────────────────────────────────
    if (userId) {
      // Check not already enrolled
      const existing = await prisma.enrollment
        .findUnique({ where: { userId_formationId: { userId, formationId } } })
        .catch(() => null);
      if (existing) {
        return NextResponse.json({ error: "Vous êtes déjà inscrit à cette formation" }, { status: 409 });
      }
      const item = await prisma.cartItem.upsert({
        where: { userId_formationId: { userId, formationId } },
        update: {},
        create: { userId, formationId },
      });
      return NextResponse.json({ data: item, guest: false }, { status: 201 });
    }

    // ── Guest path (cookie cart) ─────────────────────────────────────────
    const guest = await readGuestCart();
    if (guest.items.find((i) => i.formationId === formationId)) {
      return NextResponse.json({ data: { formationId }, guest: true, alreadyInCart: true });
    }
    if (guest.items.length >= GUEST_MAX_ITEMS) {
      return NextResponse.json(
        { error: "Panier invité saturé — connectez-vous pour en ajouter plus" },
        { status: 400 },
      );
    }
    guest.items.unshift({ formationId, addedAt: new Date().toISOString() });
    await writeGuestCart(guest);
    return NextResponse.json({ data: { formationId }, guest: true }, { status: 201 });
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

    const userId = await resolveCartUserId();

    if (userId) {
      if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
      await prisma.cartItem.deleteMany({ where: { id, userId } });
      return NextResponse.json({ success: true, guest: false });
    }

    // Guest path — by formationId (since guest item ids are derived)
    const guest = await readGuestCart();
    const target = formationId || (id?.startsWith("guest-") ? id.slice(6) : null);
    if (!target) return NextResponse.json({ error: "formationId requis" }, { status: 400 });
    guest.items = guest.items.filter((i) => i.formationId !== target);
    await writeGuestCart(guest);
    return NextResponse.json({ success: true, guest: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
