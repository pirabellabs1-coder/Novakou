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

    // On passe `download: file.name` à resolveStorageFileUrl pour que
    // l'URL signée renvoyée par Supabase embarque Content-Disposition:
    // attachment. Combiné à un `<a download href={url}>` côté client, le
    // navigateur télécharge immédiatement le fichier au lieu de l'ouvrir
    // dans l'onglet (cf. mes-produits/page.tsx).
    const data = await Promise.all(
      purchases.map(async (purchase) => {
        if (!purchase.product) return purchase;

        const files = await Promise.all(
          (purchase.product.files ?? []).map(async (file) => ({
            ...file,
            url: await resolveStorageFileUrl(file.url, "order-deliveries", 3600, file.name || true),
          })),
        );
        const fileUrl = purchase.product.fileUrl
          ? await resolveStorageFileUrl(
              purchase.product.fileUrl,
              "order-deliveries",
              3600,
              purchase.product.fileUrl.split("?")[0].split("/").pop() || true,
            )
          : null;

        return {
          ...purchase,
          product: {
            ...purchase.product,
            fileUrl,
            files,
          },
        };
      }),
    );

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
