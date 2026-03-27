import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { serviceStore, notificationStore } from "@/lib/dev/data-store";
import { propositionStore } from "@/lib/dev/proposition-store";

// GET /api/propositions — List propositions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const role = searchParams.get("role"); // "freelance" or "client"

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      let propositions;
      if (role === "client") {
        propositions = propositionStore.getByClient(session.user.id);
      } else {
        propositions = propositionStore.getByFreelance(session.user.id);
      }
      return NextResponse.json({ propositions });
    }

    // Production: Prisma
    let where: Record<string, unknown>;
    if (role === "client") {
      where = { clientId: session.user.id };
    } else {
      // Freelance or Agency: include both freelanceId and agencyId
      const orConditions: Record<string, unknown>[] = [{ freelanceId: session.user.id }];
      // Check if user owns an agency
      const agencyProfile = await prisma.agencyProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (agencyProfile) {
        orConditions.push({ agencyId: agencyProfile.id });
      }
      where = orConditions.length > 1 ? { OR: orConditions } : orConditions[0];
    }

    const propositions = await prisma.proposition.findMany({
      where,
      include: {
        service: { select: { id: true, title: true, slug: true, images: true } },
        freelance: { select: { id: true, name: true, image: true } },
        client: { select: { id: true, name: true, image: true } },
        order: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ propositions });
  } catch (error) {
    console.error("[API /propositions GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation des propositions" }, { status: 500 });
  }
}

// POST /api/propositions — Create a proposition linked to a service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, clientId, projectId, title, description, amount, deliveryDays, revisions } = body;

    if (!serviceId || !clientId) {
      return NextResponse.json({ error: "serviceId et clientId requis" }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const service = serviceStore.getById(serviceId);
      if (!service) {
        return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
      }
      if (service.userId !== session.user.id) {
        return NextResponse.json({ error: "Non autorise" }, { status: 403 });
      }

      const proposition = propositionStore.create({
        serviceId,
        freelanceId: session.user.id,
        clientId,
        projectId: projectId || null,
        title: title || service.title,
        description: description || service.descriptionText || "",
        amount: amount || service.basePrice,
        deliveryDays: deliveryDays || service.deliveryDays,
        revisions: revisions || service.revisions || 1,
        status: "SENT",
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Notify client
      notificationStore.add({
        userId: clientId,
        title: "Nouvelle proposition",
        message: `Vous avez recu une proposition pour "${proposition.title}"`,
        type: "offer",
        read: false,
        link: "/client/propositions",
      });

      return NextResponse.json({ proposition }, { status: 201 });
    }

    // Production: Prisma
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }
    // Allow service owner OR agency that owns the service
    const isServiceOwner = service.userId === session.user.id;
    let agencyId: string | null = null;
    if (!isServiceOwner && service.agencyId) {
      const agencyProfile = await prisma.agencyProfile.findFirst({
        where: { id: service.agencyId, userId: session.user.id },
      });
      if (agencyProfile) {
        agencyId = agencyProfile.id;
      }
    }
    if (!isServiceOwner && !agencyId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const proposition = await prisma.proposition.create({
      data: {
        serviceId,
        freelanceId: session.user.id,
        clientId,
        ...(agencyId ? { agencyId } : {}),
        projectId: projectId || null,
        title: title || service.title,
        description: description || service.descriptionText || "",
        amount: amount || service.basePrice,
        deliveryDays: deliveryDays || service.deliveryDays,
        revisions: revisions || service.revisions || 1,
        status: "SENT",
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      include: {
        service: { select: { id: true, title: true, slug: true } },
        client: { select: { id: true, name: true } },
      },
    });

    // Notify client
    try {
      await prisma.notification.create({
        data: {
          userId: clientId,
          title: "Nouvelle proposition",
          message: `Vous avez recu une proposition pour "${proposition.title}"`,
          type: "OFFER",
          link: "/client/propositions",
        },
      });
    } catch (e) {
      console.error("[Proposition] notification failed:", e);
    }

    return NextResponse.json({ proposition }, { status: 201 });
  } catch (error) {
    console.error("[API /propositions POST]", error);
    return NextResponse.json({ error: "Erreur lors de la creation de la proposition" }, { status: 500 });
  }
}
