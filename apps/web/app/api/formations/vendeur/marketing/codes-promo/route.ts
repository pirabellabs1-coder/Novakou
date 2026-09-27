import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
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

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const codes = await prisma.discountCode.findMany({
      where: { instructeurId: profile.id, ...(activeShopId ? { OR: [{ shopId: activeShopId }, { shopId: null }] } : {}) },
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

    // ── Validation serveur ────────────────────────────────────────────────
    // Le formulaire borne déjà l'affichage (max="100"), mais un appel direct à
    // l'API ne passe pas par le formulaire : sans ces contrôles un code
    // « -100 % » (ou « -999999 FCFA ») rendait les formations gratuites. Argent réel.
    const codeNormalise = String(code).toUpperCase().trim();
    if (!/^[A-Z0-9_-]{3,24}$/.test(codeNormalise)) {
      return NextResponse.json(
        { error: "Le code doit faire 3 à 24 caractères : lettres, chiffres, - ou _" },
        { status: 400 },
      );
    }
    if (discountType !== "PERCENTAGE" && discountType !== "FIXED_AMOUNT") {
      return NextResponse.json({ error: "Type de réduction invalide" }, { status: 400 });
    }
    const valeur = Number(discountValue);
    if (!Number.isFinite(valeur) || valeur <= 0) {
      return NextResponse.json({ error: "La valeur de la réduction doit être positive" }, { status: 400 });
    }
    // Plafond à 95 % : un code à 100 % offre le produit et le vendeur encaisse 0.
    if (discountType === "PERCENTAGE" && valeur > 95) {
      return NextResponse.json({ error: "Le pourcentage doit rester entre 1 et 95" }, { status: 400 });
    }
    const PORTEES = ["ALL", "FORMATIONS", "PRODUCTS", "SPECIFIC"];
    if (scope !== undefined && scope !== null && !PORTEES.includes(String(scope))) {
      return NextResponse.json({ error: "Portée invalide" }, { status: 400 });
    }
    const usagesMax = maxUses === undefined || maxUses === null || maxUses === "" ? null : Number(maxUses);
    if (usagesMax !== null && (!Number.isInteger(usagesMax) || usagesMax < 1)) {
      return NextResponse.json({ error: "Nombre d'utilisations invalide" }, { status: 400 });
    }
    const usagesParClient = maxUsesPerUser === undefined || maxUsesPerUser === null || maxUsesPerUser === "" ? null : Number(maxUsesPerUser);
    if (usagesParClient !== null && (!Number.isInteger(usagesParClient) || usagesParClient < 1)) {
      return NextResponse.json({ error: "Nombre d'utilisations par client invalide" }, { status: 400 });
    }
    const montantMini = minOrderAmount === undefined || minOrderAmount === null || minOrderAmount === "" ? null : Number(minOrderAmount);
    if (montantMini !== null && (!Number.isFinite(montantMini) || montantMini < 0)) {
      return NextResponse.json({ error: "Montant minimum de commande invalide" }, { status: 400 });
    }
    let expiration: Date | null = null;
    if (expiresAt) {
      expiration = new Date(expiresAt);
      if (Number.isNaN(expiration.getTime())) {
        return NextResponse.json({ error: "Date d'expiration invalide" }, { status: 400 });
      }
      // Un code déjà expiré à la création est une fausse promotion : on refuse.
      if (expiration.getTime() < Date.now()) {
        return NextResponse.json({ error: "La date d'expiration doit etre dans le futur" }, { status: 400 });
      }
    }
    const listeIds = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 200) : [];

    // Check unique code
    const existing = await prisma.discountCode.findUnique({ where: { code: codeNormalise } });
    if (existing) return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const created = await prisma.discountCode.create({
      data: { instructeurId: profile.id, shopId: activeShopId,
        code: codeNormalise,
        discountType,
        discountValue: valeur,
        scope: scope ?? "ALL",
        maxUses: usagesMax,
        maxUsesPerUser: usagesParClient,
        minOrderAmount: montantMini,
        expiresAt: expiration,
        formationIds: listeIds(formationIds),
        productIds: listeIds(productIds),
        isActive: true,
      },
    });

    return NextResponse.json({ data: created });
  } catch (err) {
    console.error("[codes-promo POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
