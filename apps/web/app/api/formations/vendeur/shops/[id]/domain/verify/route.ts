import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { verifyDomain, dnsInstructions } from "@/lib/vercel-domains";

type Params = { params: Promise<{ id: string }> };

/** POST — re-trigger Vercel verification on this shop's domain. */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const shop = await prisma.vendorShop.findFirst({
    where: { id, instructeurId: ctx.instructeurId },
  });
  if (!shop?.customDomain)
    return NextResponse.json({ error: "Aucun domaine connecté à cette boutique" }, { status: 400 });

  const result = await verifyDomain(shop.customDomain);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error ?? "Vérification impossible",
        verified: false,
        hint: "Les enregistrements DNS ne sont pas encore propagés. Réessayez dans quelques minutes.",
      },
      { status: 200 },
    );
  }
  const verified = !!result.domain?.verified;
  await prisma.vendorShop.update({
    where: { id: shop.id },
    data: { customDomainVerified: verified },
  });

  const inst = dnsInstructions(shop.customDomain);
  return NextResponse.json({
    data: {
      domain: shop.customDomain,
      verified,
      records: [
        ...inst.records,
        ...(result.verification ?? []).map((v) => ({
          type: v.type,
          name: v.domain.replace(`.${shop.customDomain}`, "").replace(shop.customDomain!, "@"),
          value: v.value,
          note: "Vérification Vercel",
        })),
      ],
    },
  });
}
