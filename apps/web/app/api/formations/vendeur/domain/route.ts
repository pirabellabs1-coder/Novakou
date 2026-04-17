import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { addDomain, getDomain, removeDomain, dnsInstructions } from "@/lib/vercel-domains";

// Domain name validation: keep it strict to avoid accidental injections.
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i;
const BLOCKED_DOMAINS = ["novakou.com", "novakou.vercel.app", "vercel.app", "localhost"];

function normalize(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

async function profile() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return { error: "Non authentifié", status: 401 as const };
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return { error: "Profil vendeur introuvable", status: 404 as const };
  return { ctx };
}

/** GET — return current domain state + DNS instructions for the vendor. */
export async function GET() {
  const p = await profile();
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: p.status });

  const inst = await prisma.instructeurProfile.findUnique({
    where: { id: p.ctx.instructeurId },
    select: {
      customDomain: true,
      customDomainVerified: true,
      customDomainAddedAt: true,
      shopSlug: true,
    },
  });

  if (!inst?.customDomain) {
    return NextResponse.json({
      data: { connected: false, domain: null, verified: false, records: [] },
    });
  }

  // Refresh verification state from Vercel so UI stays truthful.
  const vercel = await getDomain(inst.customDomain);
  const verified = vercel.ok ? !!vercel.domain?.verified : inst.customDomainVerified;

  // Persist if Vercel reports verified but DB is stale
  if (verified !== inst.customDomainVerified) {
    await prisma.instructeurProfile.update({
      where: { id: p.ctx.instructeurId },
      data: { customDomainVerified: verified },
    });
  }

  const instructions = dnsInstructions(inst.customDomain);
  const extraRecords = vercel.verification ?? [];

  return NextResponse.json({
    data: {
      connected: true,
      domain: inst.customDomain,
      shopSlug: inst.shopSlug,
      verified,
      addedAt: inst.customDomainAddedAt,
      records: [
        ...instructions.records,
        // Vercel-supplied verification record (e.g. TXT _vercel)
        ...extraRecords.map((r) => ({
          type: r.type,
          name: r.domain.replace(`.${inst.customDomain}`, "").replace(inst.customDomain, "@"),
          value: r.value,
          note: "Vérification Vercel",
        })),
      ],
    },
  });
}

/** POST — connect a new domain. Body: { domain: "example.com" }. */
export async function POST(req: Request) {
  const p = await profile();
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: p.status });

  let body: { domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const domain = normalize(body.domain ?? "");
  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: "Nom de domaine invalide" }, { status: 400 });
  }
  if (BLOCKED_DOMAINS.some((b) => domain === b || domain.endsWith(`.${b}`))) {
    return NextResponse.json({ error: "Ce domaine ne peut pas être utilisé" }, { status: 400 });
  }

  // Unique across profiles
  const existing = await prisma.instructeurProfile.findFirst({
    where: { customDomain: domain, NOT: { id: p.ctx.instructeurId } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ce domaine est déjà utilisé par un autre vendeur" },
      { status: 409 },
    );
  }

  // Remove any previously-attached domain for this vendor (best-effort)
  const current = await prisma.instructeurProfile.findUnique({
    where: { id: p.ctx.instructeurId },
    select: { customDomain: true },
  });
  if (current?.customDomain && current.customDomain !== domain) {
    await removeDomain(current.customDomain);
  }

  const result = await addDomain(domain);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Vercel a refusé le domaine" },
      { status: 502 },
    );
  }

  await prisma.instructeurProfile.update({
    where: { id: p.ctx.instructeurId },
    data: {
      customDomain: domain,
      customDomainVerified: !!result.domain?.verified,
      customDomainAddedAt: new Date(),
    },
  });

  const instructions = dnsInstructions(domain);
  const extraRecords = result.verification ?? [];

  return NextResponse.json({
    data: {
      connected: true,
      domain,
      verified: !!result.domain?.verified,
      records: [
        ...instructions.records,
        ...extraRecords.map((r) => ({
          type: r.type,
          name: r.domain.replace(`.${domain}`, "").replace(domain, "@"),
          value: r.value,
          note: "Vérification Vercel",
        })),
      ],
    },
  });
}

/** DELETE — disconnect domain. */
export async function DELETE() {
  const p = await profile();
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: p.status });

  const inst = await prisma.instructeurProfile.findUnique({
    where: { id: p.ctx.instructeurId },
    select: { customDomain: true },
  });

  if (inst?.customDomain) {
    await removeDomain(inst.customDomain);
  }

  await prisma.instructeurProfile.update({
    where: { id: p.ctx.instructeurId },
    data: { customDomain: null, customDomainVerified: false, customDomainAddedAt: null },
  });

  return NextResponse.json({ data: { connected: false } });
}
