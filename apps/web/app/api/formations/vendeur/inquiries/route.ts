import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

/**
 * GET /api/formations/vendeur/inquiries?status=pending|replied|closed|all
 * Liste les questions pre-achat recues par le vendeur.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: [] });

    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "all";

    const inquiries = await prisma.productInquiry.findMany({
      where: {
        instructeurId: ctx.instructeurId,
        ...(activeShopId ? { shopId: activeShopId } : {}),
        ...(status !== "all" ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        formation: { select: { id: true, slug: true, title: true, thumbnail: true } },
        product: { select: { id: true, slug: true, title: true, banner: true } },
      },
    });

    const summary = {
      total: inquiries.length,
      pending: inquiries.filter((i) => i.status === "pending").length,
      replied: inquiries.filter((i) => i.status === "replied").length,
      closed: inquiries.filter((i) => i.status === "closed").length,
    };

    return NextResponse.json({ data: inquiries, summary });
  } catch (err) {
    console.error("[vendeur/inquiries GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
