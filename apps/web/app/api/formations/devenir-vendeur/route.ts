import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/formations/slugs";

/**
 * POST /api/formations/devenir-vendeur
 *
 * Bascule self-service vers le statut vendeur, SANS aucune restriction
 * (apprenant / affilié / mentor → instructeur). Aucune modération : sur
 * Novakou tout compte peut vendre immédiatement. Idempotent : ré-appelable
 * sans effet secondaire si l'utilisateur est déjà vendeur.
 *
 * Effets :
 *  1. formationsRole = "instructeur" (bascule le rôle principal → espace vendeur)
 *  2. InstructeurProfile upsert (status APPROUVE)
 *  3. Boutique primaire créée si l'utilisateur n'en a aucune
 *
 * Le client doit ensuite appeler `update()` (next-auth) pour rafraîchir le
 * formationsRole du JWT (cf. callback jwt), puis rediriger vers /vendeur/dashboard.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  try {
    // 1) Force le rôle vendeur (contrairement à getOrCreateInstructeur qui ne
    //    l'écrit que s'il est vide, ici l'utilisateur CHOISIT de devenir vendeur).
    await prisma.user.update({
      where: { id: userId },
      data: { formationsRole: "instructeur" },
    });

    // 2) Profil instructeur (idempotent, approuvé d'office).
    const inst = await prisma.instructeurProfile.upsert({
      where: { userId },
      update: {},
      create: { userId, status: "APPROUVE" },
    });

    // 3) Boutique primaire si aucune (réutilise le pattern du register).
    const existingShop = await prisma.vendorShop.findFirst({
      where: { instructeurId: inst.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { id: true, slug: true },
    });
    let shopSlug = existingShop?.slug ?? null;
    if (!existingShop) {
      // Slug lisible : suffixe seulement en cas de collision réelle.
      const slug = await uniqueSlug("shop", user.name || user.email.split("@")[0]);
      const shop = await prisma.vendorShop.create({
        data: {
          instructeurId: inst.id,
          name: user.name || "Ma boutique",
          slug,
          isPrimary: true,
        },
      });
      shopSlug = shop.slug;
    }

    return NextResponse.json({ success: true, shopSlug });
  } catch (err) {
    console.error("[devenir-vendeur] échec pour userId=" + userId, err);
    return NextResponse.json({ error: "Impossible d'activer le compte vendeur." }, { status: 500 });
  }
}
