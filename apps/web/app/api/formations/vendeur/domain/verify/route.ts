/**
 * Legacy: vérification du domaine sur la boutique PRIMAIRE.
 * Pour gérer plusieurs boutiques: /api/formations/vendeur/shops/[id]/domain/verify
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { verifyDomain, getDomainConfig, dnsInstructions } from "@/lib/vercel-domains";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const shop = await prisma.vendorShop.findFirst({
    where: { instructeurId: ctx.instructeurId, isPrimary: true },
  });
  if (!shop?.customDomain)
    return NextResponse.json({ error: "Aucun domaine connecté" }, { status: 400 });

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
  const ownership = !!result.domain?.verified;
  const cfg = await getDomainConfig(shop.customDomain);
  const misconfigured = cfg.ok ? cfg.data!.misconfigured : false;
  const live = ownership && !misconfigured;
  await prisma.vendorShop.update({
    where: { id: shop.id },
    data: { customDomainVerified: live },
  });

  const inst = dnsInstructions(shop.customDomain);
  return NextResponse.json({
    data: {
      domain: shop.customDomain,
      verified: live,
      ownership,
      misconfigured,
      conflicts: cfg.data?.conflicts ?? [],
      currentDns: { aValues: cfg.data?.aValues ?? [], cnames: cfg.data?.cnames ?? [] },
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
