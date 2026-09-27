import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { PixelType } from "@prisma/client";


/**
 * Format attendu par chaque régie. Sans ce contrôle, n'importe quelle chaîne
 * était acceptée : un vendeur avait enregistré son adresse email comme
 * identifiant Meta et TikTok. La page affichait « Connecté », le navigateur
 * appelait fbq('init', 'xxx@gmail.com') et RIEN ne remontait dans sa régie —
 * un budget publicitaire dépensé à l'aveugle.
 */
const FORMATS: Record<PixelType, { regex: RegExp; attendu: string }> = {
  FACEBOOK: { regex: /^\d{10,20}$/, attendu: "15 à 16 chiffres (ex. 123456789012345)" },
  GOOGLE: {
    regex: /^(G-[A-Z0-9]{6,12}|GTM-[A-Z0-9]{5,10}|AW-\d{6,15}|UA-\d{4,12}-\d{1,4})$/i,
    attendu: "G-XXXXXXXXXX, GTM-XXXXXXX ou AW-XXXXXXXXX",
  },
  TIKTOK: { regex: /^[A-Z0-9]{15,30}$/i, attendu: "15 à 30 lettres ou chiffres (ex. CXXXXXXXXXXXXXXXXX)" },
  SNAPCHAT: {
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    attendu: "un identifiant de la forme xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  },
  PINTEREST: { regex: /^\d{10,16}$/, attendu: "10 à 16 chiffres" },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ data: [] });
    const pid = _ctx.instructeurId;

    const pixels = await prisma.marketingPixel.findMany({
      where: { instructeurId: pid, ...(activeShopId ? { OR: [{ shopId: activeShopId }, { shopId: null }] } : {}) },
      orderBy: { createdAt: "asc" },
      select: { id: true, type: true, pixelId: true, isActive: true, createdAt: true, shopId: true, testEventCode: true, accessToken: true },
    });

    // Ne pas renvoyer le token brut au client — juste un indicateur.
    const data = pixels.map(({ accessToken, ...rest }) => ({ ...rest, hasAccessToken: !!accessToken }));
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[pixels GET]", err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const _activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const body = await request.json();
    const { type, pixelId, accessToken, testEventCode } = body;

    if (!type || !pixelId) return NextResponse.json({ error: "type et pixelId requis" }, { status: 400 });
    if (!["FACEBOOK", "GOOGLE", "TIKTOK", "SNAPCHAT", "PINTEREST"].includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const identifiant = String(pixelId).trim();
    const format = FORMATS[type as PixelType];
    if (!format.regex.test(identifiant)) {
      return NextResponse.json(
        { error: `Identifiant invalide : attendu ${format.attendu}.` },
        { status: 400 },
      );
    }

    // Token API de Conversion : pertinent seulement pour FACEBOOK / TIKTOK.
    // `undefined` = ne pas toucher ; chaîne vide = effacer.
    const tokenProvided = accessToken !== undefined && (type === "FACEBOOK" || type === "TIKTOK");
    const tokenValue = tokenProvided ? (String(accessToken).trim() || null) : undefined;
    const codeProvided = testEventCode !== undefined && type === "FACEBOOK";
    const codeValue = codeProvided ? (String(testEventCode).trim() || null) : undefined;

    const pixel = await prisma.marketingPixel.upsert({
      where: { instructeurId_type: { instructeurId: pid, type: type as PixelType } },
      create: {
        instructeurId: pid, type: type as PixelType, pixelId: identifiant, isActive: true,
        ...(tokenValue !== undefined ? { accessToken: tokenValue } : {}),
        ...(codeValue !== undefined ? { testEventCode: codeValue } : {}),
      },
      update: {
        pixelId: identifiant, isActive: true,
        ...(tokenValue !== undefined ? { accessToken: tokenValue } : {}),
        ...(codeValue !== undefined ? { testEventCode: codeValue } : {}),
      },
    });

    return NextResponse.json({ data: { id: pixel.id, type: pixel.type, pixelId: pixel.pixelId, hasAccessToken: !!pixel.accessToken } });
  } catch (err) {
    console.error("[pixels POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const _activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as PixelType | null;
    if (!type) return NextResponse.json({ error: "type requis" }, { status: 400 });

    // Le filtre `shopId: activeShopId` d'avant ne matchait JAMAIS : l'upsert
    // ci-dessus crée le pixel sans boutique (clé unique instructeurId+type), donc
    // `shopId` vaut null. Résultat : « Supprimer » répondait `success: true` et le
    // pixel restait actif. On supprime sur la même clé que l'upsert.
    await prisma.marketingPixel.deleteMany({ where: { instructeurId: pid, type } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pixels DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
