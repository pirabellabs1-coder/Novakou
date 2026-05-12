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

    const data = await Promise.all(
      purchases.map(async (purchase) => {
        if (!purchase.product) return purchase;

        const files = await Promise.all(
          (purchase.product.files ?? []).map(async (file) => ({
            ...file,
            url: await resolveStorageFileUrl(file.url, "order-deliveries", 3600),
          })),
        );
        const fileUrl = purchase.product.fileUrl
          ? await resolveStorageFileUrl(purchase.product.fileUrl, "order-deliveries", 3600)
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
