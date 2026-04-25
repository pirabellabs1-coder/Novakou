import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { PixelType } from "@prisma/client";

import { getInstructeurId as _gii } from "@/lib/formations/instructeur";
async function getProfileId(userId: string) { return _gii(userId); }

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ data: [] });
    const pid = _ctx.instructeurId;

    const pixels = await prisma.marketingPixel.findMany({
      where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: pixels });
  } catch (err) {
    console.error("[pixels GET]", err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const body = await request.json();
    const { type, pixelId } = body;

    if (!type || !pixelId) return NextResponse.json({ error: "type et pixelId requis" }, { status: 400 });
    if (!["FACEBOOK", "GOOGLE", "TIKTOK"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const pixel = await prisma.marketingPixel.upsert({
      where: { instructeurId_type: { instructeurId: pid, type: type as PixelType } },
      create: { instructeurId: pid, type: type as PixelType, pixelId: pixelId.trim(), isActive: true },
      update: { pixelId: pixelId.trim(), isActive: true },
    });

    return NextResponse.json({ data: pixel });
  } catch (err) {
    console.error("[pixels POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as PixelType | null;
    if (!type) return NextResponse.json({ error: "type requis" }, { status: 400 });

    await prisma.marketingPixel.deleteMany({ where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}), type } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pixels DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
