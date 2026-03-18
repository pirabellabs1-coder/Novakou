// GET/PUT /api/apprenant/profil — Profil apprenant

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";

const updateProfilSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().max(2048).optional().or(z.literal("")),
});

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

    if (!user) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error("[GET /api/apprenant/profil]", error);
    return NextResponse.json({ profile: { name: "", email: "", avatar: "" } });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfilSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { name, avatar } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar, image: avatar }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/apprenant/profil]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
