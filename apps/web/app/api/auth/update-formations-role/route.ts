import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

const schema = z.object({
  formationsRole: z.enum(["apprenant", "instructeur"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Role invalide" }, { status: 400 });
    }

    const { formationsRole } = parsed.data;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      devStore.users.update(userId, { formationsRole });
      return NextResponse.json({ success: true, formationsRole });
    }

    // Production: Prisma
    // Bureau session 4 (P0 Karim/Amélie) — anti-escalation.
    // Avant : tout user pouvait POSer ce endpoint pour devenir
    // "instructeur" sans KYC ni validation. Permettait l'escalation
    // d'apprenant à vendeur en un appel API.
    // Maintenant :
    //   1. Le rôle ne peut être posé QU'UNE SEULE FOIS (first set wins).
    //      Si déjà posé, on refuse → l'utilisateur doit demander un
    //      changement de rôle au support (workflow contrôlé).
    //   2. Pour "instructeur" : exiger KYC niveau >= 2 (email + phone
    //      vérifiés au minimum). Le niveau 3 (CNI) sera requis pour les
    //      payouts plus tard, mais déjà niveau 2 = vraie identité.
    try {
      const { prisma } = await import("@/lib/prisma");
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { formationsRole: true, kyc: true },
      });
      if (!current) return NextResponse.json({ error: "User introuvable" }, { status: 404 });

      if (current.formationsRole && current.formationsRole !== "") {
        return NextResponse.json(
          { error: `Votre rôle est déjà défini (${current.formationsRole}). Contactez le support pour un changement.` },
          { status: 409 },
        );
      }
      if (formationsRole === "instructeur" && (current.kyc ?? 1) < 2) {
        return NextResponse.json(
          { error: "Pour devenir vendeur, vérifiez d'abord votre téléphone (KYC niveau 2 requis)." },
          { status: 403 },
        );
      }

      await prisma.user.update({
        where: { id: userId },
        data: { formationsRole },
      });
    } catch (err) {
      console.error("[UPDATE_FORMATIONS_ROLE] Prisma error:", err);
      return NextResponse.json({ error: "Erreur base de donnees" }, { status: 500 });
    }

    return NextResponse.json({ success: true, formationsRole });
  } catch (err) {
    console.error("[UPDATE_FORMATIONS_ROLE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
