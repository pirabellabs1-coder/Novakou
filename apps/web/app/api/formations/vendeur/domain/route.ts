/**
 * Legacy endpoint: opère désormais sur la boutique PRIMAIRE du vendeur.
 * Pour gérer plusieurs boutiques utiliser /api/formations/vendeur/shops/[id]/domain
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { addDomain, getDomain, getDomainConfig, removeDomain, dnsInstructions } from "@/lib/vercel-domains";

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i;
const BLOCKED = ["novakou.com", "novakou.vercel.app", "vercel.app", "localhost"];

function normalize(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

async function ensurePrimaryShop(instructeurId: string) {
  let shop = await prisma.vendorShop.findFirst({
    where: { instructeurId, isPrimary: true },
  });
  // Auto-create a primary shop if none exists (defensive — migration should have done it)
  if (!shop) {
    const user = await prisma.instructeurProfile.findUnique({
      where: { id: instructeurId },
      select: { user: { select: { name: true } } },
    });
    const name = user?.user?.name?.trim() || "Boutique";
    const slugBase = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "boutique";
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    shop = await prisma.vendorShop.create({
      data: { instructeurId, name, slug, isPrimary: true },
    });
  }
  return shop;
}

async function ctx() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return { error: "Non authentifié", status: 401 as const };
  const c = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!c) return { error: "Profil vendeur introuvable", status: 404 as const };
  const shop = await ensurePrimaryShop(c.instructeurId);
  return { ctx: c, shop };
}

function buildRecords(domain: string, vercelVerification: Awaited<ReturnType<typeof getDomain>>["verification"]) {
  const inst = dnsInstructions(domain);
  return [
    ...inst.records,
    ...(vercelVerification ?? []).map((v) => ({
      type: v.type,
      name: v.domain.replace(`.${domain}`, "").replace(domain, "@"),
      value: v.value,
      note: "Vérification Vercel",
    })),
  ];
}

export async function GET() {
  const r = await ctx();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  if (!r.shop.customDomain) {
    return NextResponse.json({
      data: { connected: false, domain: null, verified: false, records: [], shopId: r.shop.id },
    });
  }
  const [v, cfg] = await Promise.all([
    getDomain(r.shop.customDomain),
    getDomainConfig(r.shop.customDomain),
  ]);
  const ownership = v.ok ? !!v.domain?.verified : r.shop.customDomainVerified;
  const misconfigured = cfg.ok ? cfg.data!.misconfigured : false;
  const live = ownership && !misconfigured;
  if (live !== r.shop.customDomainVerified) {
    await prisma.vendorShop.update({
      where: { id: r.shop.id },
      data: { customDomainVerified: live },
    });
  }
  return NextResponse.json({
    data: {
      connected: true,
      domain: r.shop.customDomain,
      verified: live,
      ownership,
      misconfigured,
      conflicts: cfg.data?.conflicts ?? [],
      currentDns: { aValues: cfg.data?.aValues ?? [], cnames: cfg.data?.cnames ?? [] },
      addedAt: r.shop.customDomainAddedAt,
      records: buildRecords(r.shop.customDomain, v.verification),
      shopId: r.shop.id,
      shopSlug: r.shop.slug,
    },
  });
}

export async function POST(req: Request) {
  const r = await ctx();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  let body: { domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const domain = normalize(body.domain ?? "");
  if (!domain || !DOMAIN_RE.test(domain))
    return NextResponse.json({ error: "Nom de domaine invalide" }, { status: 400 });
  if (BLOCKED.some((b) => domain === b || domain.endsWith(`.${b}`)))
    return NextResponse.json({ error: "Ce domaine ne peut pas être utilisé" }, { status: 400 });

  const conflict = await prisma.vendorShop.findFirst({
    where: { customDomain: domain, NOT: { id: r.shop.id } },
    select: { id: true },
  });
  if (conflict)
    return NextResponse.json(
      { error: "Ce domaine est déjà utilisé par une autre boutique" },
      { status: 409 },
    );

  if (r.shop.customDomain && r.shop.customDomain !== domain) {
    await removeDomain(r.shop.customDomain).catch(() => null);
  }

  const result = await addDomain(domain);
  if (!result.ok)
    return NextResponse.json({ error: result.error ?? "Vercel a refusé le domaine" }, { status: 502 });

  await prisma.vendorShop.update({
    where: { id: r.shop.id },
    data: {
      customDomain: domain,
      customDomainVerified: !!result.domain?.verified,
      customDomainAddedAt: new Date(),
    },
  });

  return NextResponse.json({
    data: {
      connected: true,
      domain,
      verified: !!result.domain?.verified,
      records: buildRecords(domain, result.verification),
    },
  });
}

export async function DELETE() {
  const r = await ctx();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (r.shop.customDomain) await removeDomain(r.shop.customDomain).catch(() => null);
  await prisma.vendorShop.update({
    where: { id: r.shop.id },
    data: { customDomain: null, customDomainVerified: false, customDomainAddedAt: null },
  });
  return NextResponse.json({ data: { connected: false } });
}
