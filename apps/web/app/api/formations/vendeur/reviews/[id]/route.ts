import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/formations/vendeur/reviews/[id]
 * Body : { type: "formation" | "product", response: string }
 *
 * Le vendeur répond à un avis. Vérifie que l'avis concerne bien un de ses
 * produits/formations. Passer response="" pour supprimer la réponse.
 */
export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const type = (body.type as string) === "product" ? "product" : "formation";
  const response = typeof body.response === "string" ? body.response.trim() : "";

  if (response.length > 0 && response.length < 5) {
    return NextResponse.json({ error: "Réponse trop courte (minimum 5 caractères)" }, { status: 400 });
  }
  if (response.length > 2000) {
    return NextResponse.json({ error: "Réponse trop longue (maximum 2000 caractères)" }, { status: 400 });
  }

  if (type === "formation") {
    const review = await prisma.formationReview.findUnique({
      where: { id },
      include: { formation: { select: { instructeurId: true } } },
    });
    if (!review || review.formation.instructeurId !== ctx.instructeurId) {
      return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
    }
    const updated = await prisma.formationReview.update({
      where: { id },
      data: {
        response: response || null,
        respondedAt: response ? new Date() : null,
      },
    });
    return NextResponse.json({ data: updated });
  }

  // product
  const review = await prisma.digitalProductReview.findUnique({
    where: { id },
    include: { product: { select: { instructeurId: true } } },
  });
  if (!review || review.product.instructeurId !== ctx.instructeurId) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }
  const updated = await prisma.digitalProductReview.update({
    where: { id },
    data: {
      response: response || null,
      respondedAt: response ? new Date() : null,
    },
  });
  return NextResponse.json({ data: updated });
}
