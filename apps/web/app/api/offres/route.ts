import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { offreStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const userRole = (session.user.role || "").toLowerCase();

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      if (userRole === "client") {
        const offres = offreStore.getByClient(session.user.id, session.user.email || "");
        return NextResponse.json({ offres });
      }
      const offres = offreStore.getByFreelance(session.user.id);
      return NextResponse.json({ offres });
    }

    // Prisma: if client, fetch offers received; if freelance, fetch offers sent
    if (userRole === "client") {
      const dbOffres = await prisma.offer.findMany({
        where: {
          OR: [
            { clientId: session.user.id },
            { clientEmail: session.user.email || "" },
          ],
        },
        include: {
          freelance: { select: { id: true, name: true, image: true, country: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const offres = dbOffres.map((o) => ({
        id: o.id,
        freelanceId: o.freelanceId,
        freelanceName: o.freelance?.name || "",
        freelanceAvatar: o.freelance?.image || "",
        client: o.clientName,
        clientEmail: o.clientEmail || "",
        title: o.title,
        description: o.description,
        amount: o.amount,
        delay: o.delay,
        revisions: o.revisions,
        validityDays: o.validityDays,
        status: o.status.toLowerCase(),
        expiresAt: o.expiresAt?.toISOString() || null,
        createdAt: o.createdAt.toISOString(),
      }));

      return NextResponse.json({ offres });
    }

    // Freelance: fetch offers sent
    const dbOffres = await prisma.offer.findMany({
      where: { freelanceId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const offres = dbOffres.map((o) => ({
      id: o.id,
      freelanceId: o.freelanceId,
      client: o.clientName,
      clientEmail: o.clientEmail || "",
      title: o.title,
      amount: o.amount,
      delay: o.delay,
      revisions: o.revisions,
      description: o.description,
      validityDays: o.validityDays,
      status: o.status.toLowerCase(),
      expiresAt: o.expiresAt?.toISOString() || null,
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({ offres });
  } catch (error) {
    console.error("[API /offres GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des offres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { client, clientEmail, title, amount, delay, revisions, description, validityDays } = body;

    if (!client || !title || !amount || !delay || !description) {
      return NextResponse.json(
        { error: "Champs requis manquants: client, title, amount, delay, description" },
        { status: 400 }
      );
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const offre = offreStore.create({
        freelanceId: session.user.id,
        client,
        clientEmail: clientEmail || "",
        title,
        amount: Number(amount),
        delay,
        revisions: Number(revisions) || 2,
        description,
        validityDays: Number(validityDays) || 14,
      });
      return NextResponse.json({ offre }, { status: 201 });
    }

    // Prisma: resolve clientId from email if possible
    const validDays = Number(validityDays) || 14;
    let resolvedClientId: string | null = null;
    if (clientEmail) {
      const clientUser = await prisma.user.findUnique({
        where: { email: clientEmail },
        select: { id: true },
      });
      if (clientUser) resolvedClientId = clientUser.id;
    }

    const dbOffre = await prisma.offer.create({
      data: {
        freelanceId: session.user.id,
        clientId: resolvedClientId,
        clientName: client,
        clientEmail: clientEmail || "",
        title,
        amount: Number(amount),
        delay,
        revisions: Number(revisions) || 2,
        description,
        validityDays: validDays,
        expiresAt: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
        status: "EN_ATTENTE",
      },
    });

    const offre = {
      id: dbOffre.id,
      freelanceId: dbOffre.freelanceId,
      client: dbOffre.clientName,
      clientEmail: dbOffre.clientEmail || "",
      title: dbOffre.title,
      amount: dbOffre.amount,
      delay: dbOffre.delay,
      revisions: dbOffre.revisions,
      description: dbOffre.description,
      validityDays: dbOffre.validityDays,
      status: dbOffre.status.toLowerCase(),
      expiresAt: dbOffre.expiresAt?.toISOString() || null,
      createdAt: dbOffre.createdAt.toISOString(),
    };

    return NextResponse.json({ offre }, { status: 201 });
  } catch (error) {
    console.error("[API /offres POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'offre" },
      { status: 500 }
    );
  }
}
