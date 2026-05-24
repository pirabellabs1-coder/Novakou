import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveStorageFileUrl } from "@/lib/supabase-storage";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const purchases = await prisma.digitalProductPurchase.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            productType: true,
            banner: true,
            fileSize: true,
            fileUrl: true,
            instructeurId: true,
            files: {
              orderBy: { order: "asc" },
              select: { id: true, name: true, url: true, size: true, mimeType: true },
            },
            reviews: {
              where: { userId },
              select: { id: true, rating: true, comment: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // PERF : on ne génère PLUS de signed URLs pour files[].url et fileUrl.
    // Le frontend (mes-produits/page.tsx) utilise désormais
    // `/api/formations/apprenant/products/[id]/file/[idx]` (route proxy)
    // pour les downloads — la signed URL est créée AU MOMENT du clic, pas
    // au load de la page. Ça élimine N calls Supabase par page load (un
    // par fichier × par produit), ce qui faisait ramer mes-produits.
    //
    // En revanche on garde la résolution sur `banner` (image affichée
    // dans la carte produit) puisque c'est rendu inline en `<img>`.
    const data = await Promise.all(
      purchases.map(async (purchase) => {
        if (!purchase.product?.banner) return purchase;
        const banner = await resolveStorageFileUrl(purchase.product.banner, "order-deliveries", 3600);
        return { ...purchase, product: { ...purchase.product, banner } };
      }),
    );

    // Cache HTTP : la liste des achats change rarement (nouvel achat ou
    // download counter). 30s de cache privé est un bon compromis : la
    // page reste responsive sur navigation arrière/onglet, sans servir
    // une donnée datée à un user qui vient juste d'acheter.
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "private, max-age=30, must-revalidate" } },
    );
  } catch {
    return NextResponse.json({ data: [] });
  }
}
