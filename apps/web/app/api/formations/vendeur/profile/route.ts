import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Ensure the instructor profile exists (idempotent)
    await getOrCreateInstructeur(userId);

    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, image: true },
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
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { name, bioFr, expertise, linkedin, website, youtube, yearsExp } = body;

    await Promise.all([
      name
        ? prisma.user.update({ where: { id: userId }, data: { name } })
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
          bioFr: bioFr ?? undefined,
          expertise: expertise ?? undefined,
          linkedin: linkedin ?? undefined,
          website: website ?? undefined,
          youtube: youtube ?? undefined,
          yearsExp: yearsExp ?? undefined,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[vendeur/profile PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
