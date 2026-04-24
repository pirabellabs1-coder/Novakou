import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/public/pixels?formationIds=X,Y&productIds=A,B
 *
 * Retourne l'union des pixels marketing de tous les vendeurs impliqués
 * dans les produits en question. Public (pas d'auth) — pour injecter les
 * pixels sur le checkout / thank-you page.
 *
 * Si plusieurs vendeurs ont le même type de pixel (2 FACEBOOK par exemple),
 * on les renvoie tous — le PixelInjector déclenchera les events pour
 * chacun. C'est OK car chaque vendeur a son propre dashboard FB/Google/TikTok.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formationIds = (searchParams.get("formationIds") ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const productIds = (searchParams.get("productIds") ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean);

    if (formationIds.length === 0 && productIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { id: { in: formationIds } },
        select: { instructeurId: true },
      }),
      prisma.digitalProduct.findMany({
        where: { id: { in: productIds } },
        select: { instructeurId: true },
      }),
    ]);

    const instructeurIds = Array.from(
      new Set([
        ...formations.map((f) => f.instructeurId),
        ...products.map((p) => p.instructeurId),
      ]),
    );
    if (instructeurIds.length === 0) return NextResponse.json({ data: [] });

    const pixels = await prisma.marketingPixel.findMany({
      where: { instructeurId: { in: instructeurIds }, isActive: true },
      select: { type: true, pixelId: true },
    });

    // Dedoublonner (meme pixelId peut apparaitre chez plusieurs vendeurs théoriquement)
    const seen = new Set<string>();
    const unique = pixels.filter((p) => {
      const key = `${p.type}:${p.pixelId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ data: unique });
  } catch (err) {
    console.error("[public/pixels GET]", err);
    return NextResponse.json({ data: [] });
  }
}
