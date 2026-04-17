import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/formations/vendeur/api-keys/[id]
 * Revokes an API key (soft delete — sets revokedAt).
 */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    // Verify ownership before revoke
    const key = await prisma.vendorApiKey.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
    });
    if (!key) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

    await prisma.vendorApiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ data: { id, revoked: true } });
  } catch (err) {
    console.error("[api-keys DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
