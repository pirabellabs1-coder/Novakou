import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

/**
 * Generic user profile endpoint, role-agnostic.
 *
 * Used by every settings page (apprenant, mentor, vendeur, affilié) for the
 * shared "compte" tab. Vendor- and mentor-specific fields live under their
 * dedicated endpoints (/api/formations/vendeur/profile,
 * /api/formations/mentor/profile).
 */

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(80).optional(),
  bio: z.string().max(500).optional(),
  photo: z.string().url().nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = await resolveActiveUserId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      country: true,
      image: true,
      avatar: true,
      formationsRole: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: user });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = await resolveActiveUserId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.country !== undefined && { country: data.country || null }),
      ...(data.photo !== undefined && { image: data.photo, avatar: data.photo }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      country: true,
      image: true,
      avatar: true,
    },
  });

  // Bio lives on role-specific profiles (InstructeurProfile, MentorProfile…),
  // never on User. Persist it to whichever profile exists for this user.
  if (data.bio !== undefined) {
    await prisma.instructeurProfile.updateMany({
      where: { userId },
      data: { bio: data.bio || null },
    }).catch(() => null);
    await prisma.mentorProfile.updateMany({
      where: { userId },
      data: { bio: data.bio || "" },
    }).catch(() => null);
  }

  return NextResponse.json({ data: updated });
}
