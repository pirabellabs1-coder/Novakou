import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// Sauvegarde/chargement de brouillon en DB
// TODO: Remplacer par Prisma + auth en production

// Store en mémoire pour le développement
const drafts = new Map<string, { data: unknown; updatedAt: string }>();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const body = await request.json();
    const { serviceId, draftData, userId } = body;

    if (!draftData) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const id = serviceId || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    drafts.set(id, { data: draftData, updatedAt: now });

    // TODO: Production — save to DB via Prisma
    // await prisma.service.upsert({
    //   where: { id },
    //   create: { id, userId, status: 'BROUILLON', draftData, ...extractFields(draftData) },
    //   update: { draftData, updatedAt: new Date() },
    // });

    return NextResponse.json({ serviceId: id, savedAt: now });
  } catch {
    return NextResponse.json({ error: "Erreur de sauvegarde" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId requis" }, { status: 400 });
    }

    const draft = drafts.get(serviceId);

    if (!draft) {
      return NextResponse.json({ error: "Brouillon non trouvé" }, { status: 404 });
    }

    return NextResponse.json(draft);
  } catch {
    return NextResponse.json({ error: "Erreur de chargement" }, { status: 500 });
  }
}
