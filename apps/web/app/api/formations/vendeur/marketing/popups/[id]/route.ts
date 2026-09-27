import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

import { getInstructeurId as _gii } from "@/lib/formations/instructeur";
async function getProfileId(userId: string) { return _gii(userId); }

/**
 * Vérifie qu'un `discountCodeId` fourni par le client appartient bien au
 * vendeur. Sans ce contrôle, un créateur pouvait rattacher le code promo privé
 * d'un AUTRE vendeur à son pop-up — et le diffuser sur sa vitrine.
 * Renvoie l'identifiant validé, `null` pour « aucun code », "INVALIDE" sinon.
 */
async function codePromoDuVendeur(
  discountCodeId: unknown,
  instructeurId: string,
): Promise<string | null | "INVALIDE"> {
  if (!discountCodeId || typeof discountCodeId !== "string") return null;
  const code = await prisma.discountCode.findFirst({
    where: { id: discountCodeId, instructeurId },
    select: { id: true },
  });
  return code ? code.id : "INVALIDE";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const pid = await getProfileId(userId);
    if (!pid) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const existing = await prisma.smartPopup.findFirst({ where: { id, instructeurId: pid } });
    if (!existing) return NextResponse.json({ error: "Popup introuvable" }, { status: 404 });

    const body = await request.json();

    let codeId: string | null | undefined;
    if (body.discountCodeId !== undefined) {
      const verifie = await codePromoDuVendeur(body.discountCodeId, pid);
      if (verifie === "INVALIDE") {
        return NextResponse.json({ error: "Code promo introuvable" }, { status: 404 });
      }
      codeId = verifie;
    }

    const updated = await prisma.smartPopup.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : undefined,
        headlineFr: body.headlineFr !== undefined ? body.headlineFr?.trim() || null : undefined,
        bodyFr: body.bodyFr !== undefined ? body.bodyFr?.trim() || null : undefined,
        ctaTextFr: body.ctaTextFr !== undefined ? body.ctaTextFr?.trim() || null : undefined,
        discountCodeId: codeId,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[popups PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const pid = await getProfileId(userId);
    if (!pid) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    const existing = await prisma.smartPopup.findFirst({ where: { id, instructeurId: pid } });
    if (!existing) return NextResponse.json({ error: "Popup introuvable" }, { status: 404 });

    await prisma.smartPopup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[popups DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
