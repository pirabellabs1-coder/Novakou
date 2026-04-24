import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: null });
    const userId = ctx.userId;

    // Ensure the instructor profile exists (idempotent)
    await getOrCreateInstructeur(userId);

    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          country: true,
        },
      }),
      prisma.instructeurProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          bioFr: true,
          bioEn: true,
          expertise: true,
          linkedin: true,
          website: true,
          youtube: true,
          motivation: true,
          yearsExp: true,
          totalEarned: true,
          status: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        user,
        profile,
        hasProfile: profile !== null,
      },
    });
  } catch (err) {
    console.error("[vendeur/profile]", err);
    return NextResponse.json({ data: null });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: null });
    const userId = ctx.userId;

    const body = await request.json();
    const { name, phone, country, image, bioFr, expertise, linkedin, website, youtube, yearsExp } = body;

    // Build User update object only with defined keys — avoids overwriting
    // existing values with undefined.
    const userUpdate: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) userUpdate.name = name.trim();
    if (typeof phone === "string") userUpdate.phone = phone.trim() || null;
    if (typeof country === "string") userUpdate.country = country.trim() || null;
    if (typeof image === "string") userUpdate.image = image.trim() || null;

    await Promise.all([
      Object.keys(userUpdate).length > 0
        ? prisma.user.update({ where: { id: userId }, data: userUpdate })
        : Promise.resolve(),
      prisma.instructeurProfile.upsert({
        where: { userId },
        create: {
          userId,
          bioFr: bioFr ?? null,
          expertise: expertise ?? [],
          linkedin: linkedin ?? null,
          website: website ?? null,
          youtube: youtube ?? null,
          yearsExp: yearsExp ?? 0,
        },
        update: {
          ...(bioFr !== undefined ? { bioFr: bioFr ?? null } : {}),
          ...(expertise !== undefined ? { expertise: expertise ?? [] } : {}),
          ...(linkedin !== undefined ? { linkedin: linkedin ?? null } : {}),
          ...(website !== undefined ? { website: website ?? null } : {}),
          ...(youtube !== undefined ? { youtube: youtube ?? null } : {}),
          ...(yearsExp !== undefined ? { yearsExp: yearsExp ?? 0 } : {}),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[vendeur/profile PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
