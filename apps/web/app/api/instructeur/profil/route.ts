// GET/PUT /api/instructeur/profil — Profil instructeur

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().or(z.literal("")).optional(),
  bioFr: z.string().max(2000).optional(),
  bioEn: z.string().max(2000).optional(),
  linkedin: z.string().url().or(z.literal("")).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  youtube: z.string().url().or(z.literal("")).optional(),
}).strict();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, avatar: true, image: true },
    });

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
      select: { bioFr: true, bioEn: true, expertise: true, linkedin: true, website: true, youtube: true },
    });

    if (!user || !instructeur) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...user,
        ...instructeur,
      },
    });
  } catch (error) {
    console.error("[GET /api/instructeur/profil]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSchema.parse(body);
    const { name, avatar, bioFr, bioEn, linkedin, website, youtube } = parsed;

    // Mettre à jour le user (nom + avatar)
    if (name !== undefined || avatar !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(name !== undefined && { name }),
          ...(avatar !== undefined && { avatar, image: avatar }),
        },
      });
    }

    // Mettre à jour le profil instructeur
    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (instructeur) {
      await prisma.instructeurProfile.update({
        where: { id: instructeur.id },
        data: {
          ...(bioFr !== undefined && { bioFr }),
          ...(bioEn !== undefined && { bioEn }),
          ...(linkedin !== undefined && { linkedin: linkedin || null }),
          ...(website !== undefined && { website: website || null }),
          ...(youtube !== undefined && { youtube: youtube || null }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[PUT /api/instructeur/profil]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
