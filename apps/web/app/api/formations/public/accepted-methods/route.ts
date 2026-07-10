import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/public/accepted-methods?formationIds=a,b&productIds=c,d
 *
 * Renvoie l'intersection des moyens de paiement acceptés par le(s) vendeur(s)
 * des articles du panier. Utilisé par le checkout multi-articles (CheckoutInner)
 * pour n'afficher au client QUE les méthodes que tous les vendeurs acceptent.
 *
 * Repli : si aucun article/instructeur résolu ou intersection vide → liste par
 * défaut. La sélection reste une préférence UI + metadata ; les canaux réels
 * sont gérés par la page hébergée Moneroo.
 */

// Méthodes présentées à l'acheteur (on ignore les valeurs internes comme
// "moneroo", "stripe" ou "free" qui ne sont pas des canaux de paiement à choisir).
const BUYER_FACING = ["orange_money", "wave", "mtn_momo", "moov_money", "card", "paypal", "bank_transfer"];
const DEFAULT_METHODS = ["orange_money", "wave", "mtn_momo", "card"];

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const formationIds = parseIds(url.searchParams.get("formationIds"));
    const productIds = parseIds(url.searchParams.get("productIds"));

    if (formationIds.length === 0 && productIds.length === 0) {
      return NextResponse.json({ methods: DEFAULT_METHODS });
    }

    const [formations, products] = await Promise.all([
      formationIds.length > 0
        ? prisma.formation.findMany({
            where: { id: { in: formationIds } },
            select: { instructeurId: true },
          })
        : Promise.resolve([]),
      productIds.length > 0
        ? prisma.digitalProduct.findMany({
            where: { id: { in: productIds } },
            select: { instructeurId: true },
          })
        : Promise.resolve([]),
    ]);

    const instructeurIds = Array.from(
      new Set([
        ...formations.map((f) => f.instructeurId),
        ...products.map((p) => p.instructeurId),
      ]),
    );

    if (instructeurIds.length === 0) {
      return NextResponse.json({ methods: DEFAULT_METHODS });
    }

    const profiles = await prisma.instructeurProfile.findMany({
      where: { id: { in: instructeurIds } },
      select: { acceptedPaymentMethods: true },
    });

    // Intersection : une méthode n'est proposée que si TOUS les vendeurs l'acceptent.
    let intersection: string[] | null = null;
    for (const p of profiles) {
      const set = new Set((p.acceptedPaymentMethods ?? []).map((m) => m.toLowerCase()));
      intersection = intersection === null
        ? Array.from(set)
        : intersection.filter((m) => set.has(m));
    }

    const filtered = (intersection ?? [])
      .filter((m) => BUYER_FACING.includes(m))
      // ordre canonique stable
      .sort((a, b) => BUYER_FACING.indexOf(a) - BUYER_FACING.indexOf(b));

    return NextResponse.json({ methods: filtered.length > 0 ? filtered : DEFAULT_METHODS });
  } catch (err) {
    console.error("[public/accepted-methods GET]", err);
    return NextResponse.json({ methods: DEFAULT_METHODS });
  }
}
