import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { addDomain, getDomain, removeDomain, dnsInstructions } from "@/lib/vercel-domains";

type Params = { params: Promise<{ id: string }> };

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

async function ctxAndShop(shopId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return { error: "Non authentifié", status: 401 as const };
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return { error: "Profil introuvable", status: 404 as const };
  const shop = await prisma.vendorShop.findFirst({
    where: { id: shopId, instructeurId: ctx.instructeurId },
  });
  if (!shop) return { error: "Boutique introuvable", status: 404 as const };
  return { ctx, shop };
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

/** GET — current domain status for this shop. */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const r = await ctxAndShop(id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  if (!r.shop.customDomain) {
    return NextResponse.json({
      data: { connected: false, domain: null, verified: false, records: [] },
    });
  }

  const v = await getDomain(r.shop.customDomain);
  const verified = v.ok ? !!v.domain?.verified : r.shop.customDomainVerified;
  if (verified !== r.shop.customDomainVerified) {
    await prisma.vendorShop.update({
      where: { id: r.shop.id },
      data: { customDomainVerified: verified },
    });
  }

  return NextResponse.json({
    data: {
      connected: true,
      domain: r.shop.customDomain,
      verified,
      addedAt: r.shop.customDomainAddedAt,
      records: buildRecords(r.shop.customDomain, v.verification),
    },
  });
}

/** POST — connect a domain to this shop. body { domain }. */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const r = await ctxAndShop(id);
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

  // Cross-shop unicity
  const existing = await prisma.vendorShop.findFirst({
    where: { customDomain: domain, NOT: { id: r.shop.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ce domaine est déjà utilisé par une autre boutique" },
      { status: 409 },
    );
  }

  // If shop already has a different domain, drop it from Vercel first
  if (r.shop.customDomain && r.shop.customDomain !== domain) {
    await removeDomain(r.shop.customDomain).catch(() => null);
  }

  const result = await addDomain(domain);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Vercel a refusé le domaine" },
      { status: 502 },
    );
  }

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

/** DELETE — disconnect domain from this shop. */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const r = await ctxAndShop(id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  if (r.shop.customDomain) {
    await removeDomain(r.shop.customDomain).catch(() => null);
  }
  await prisma.vendorShop.update({
    where: { id: r.shop.id },
    data: { customDomain: null, customDomainVerified: false, customDomainAddedAt: null },
  });

  return NextResponse.json({ data: { connected: false } });
}
