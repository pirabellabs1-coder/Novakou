import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { verifyDomain, dnsInstructions } from "@/lib/vercel-domains";

/** POST — trigger a Vercel verification check for the vendor's current domain. */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const inst = await prisma.instructeurProfile.findUnique({
    where: { id: ctx.instructeurId },
    select: { customDomain: true },
  });
  if (!inst?.customDomain)
    return NextResponse.json({ error: "Aucun domaine connecté" }, { status: 400 });

  const result = await verifyDomain(inst.customDomain);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error ?? "Vérification impossible",
        verified: false,
        hint: "Les enregistrements DNS ne sont pas encore propagés. Attendez quelques minutes puis réessayez.",
      },
      { status: 200 }, // soft-fail: show DNS not yet propagated
    );
  }

  const verified = !!result.domain?.verified;

  await prisma.instructeurProfile.update({
    where: { id: ctx.instructeurId },
    data: { customDomainVerified: verified },
  });

  const instructions = dnsInstructions(inst.customDomain);
  const extraRecords = result.verification ?? [];

  return NextResponse.json({
    data: {
      domain: inst.customDomain,
      verified,
      records: [
        ...instructions.records,
        ...extraRecords.map((r) => ({
          type: r.type,
          name: r.domain.replace(`.${inst.customDomain}`, "").replace(inst.customDomain!, "@"),
          value: r.value,
          note: "Vérification Vercel",
        })),
      ],
    },
  });
}
