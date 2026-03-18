// POST /api/instructeur/candidature — Postuler comme instructeur
// GET  /api/instructeur/candidature — Récupérer le profil instructeur

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";
import { sendInstructorApplicationEmail } from "@/lib/email/formations";

const applicationSchema = z.object({
  bioFr: z.string().min(50).max(2000),
  bioEn: z.string().min(50).max(2000),
  expertise: z.array(z.string()).min(1).max(10),
  linkedin: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  yearsExp: z.number().int().min(0).max(50),
  motivation: z.string().min(100).max(3000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const data = applicationSchema.parse(body);

    const existing = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà soumis une candidature", status: existing.status },
        { status: 400 }
      );
    }

    const profile = await prisma.instructeurProfile.create({
      data: {
        userId: session.user.id,
        bioFr: data.bioFr,
        bioEn: data.bioEn,
        expertise: data.expertise,
        linkedin: data.linkedin || null,
        website: data.website || null,
        youtube: data.youtube || null,
        yearsExp: data.yearsExp,
        motivation: data.motivation,
        status: "EN_ATTENTE",
      },
    });

    // Envoyer email de confirmation
    sendInstructorApplicationEmail({
      email: session.user.email!,
      name: session.user.name ?? "Instructeur",
    }).catch((err) => console.error("[Email] sendInstructorApplicationEmail:", err));

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[POST /api/instructeur/candidature]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const profile = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ profile: profile ?? null });
  } catch (error) {
    console.error("[GET /api/instructeur/candidature]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
