import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

async function getProfile(userId: string) {
  return getOrCreateInstructeur(userId);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ data: [] });

    const codes = await prisma.discountCode.findMany({
      where: { instructeurId: profile.id, ...(activeShopId ? { shopId: activeShopId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usages: true } } },
    });

    return NextResponse.json({ data: codes });
  } catch (err) {
    console.error("[codes-promo GET]", err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await getProfile(userId);
    if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const body = await request.json();
    const { code, discountType, discountValue, scope, maxUses, maxUsesPerUser, minOrderAmount, expiresAt, formationIds, productIds } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Check unique code
    const existing = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });

    const created = await prisma.discountCode.create({
      data: { instructeurId: profile.id, shopId: activeShopId,
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: parseFloat(discountValue),
        scope: scope ?? "ALL",
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : null,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        formationIds: formationIds ?? [],
        productIds: productIds ?? [],
        isActive: true,
      },
    });

    return NextResponse.json({ data: created });
  } catch (err) {
    console.error("[codes-promo POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
