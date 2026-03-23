import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { candidatureStore } from "@/lib/dev/data-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: projectId } = await params;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const candidatures = candidatureStore.getByProject(projectId);
      return NextResponse.json({ candidatures });
    }

    // Verify the user owns this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    if (project.clientId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const bids = await prisma.projectBid.findMany({
      where: { projectId },
      include: {
        freelance: {
          select: {
            id: true,
            name: true,
            image: true,
            country: true,
            freelancerProfile: {
              select: { title: true, skills: true, rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      candidatures: bids.map((b) => ({
        id: b.id,
        projectId: b.projectId,
        freelanceId: b.freelanceId,
        name: b.freelance?.name || "",
        freelanceName: b.freelance?.name || "",
        freelanceTitle: b.freelance?.freelancerProfile?.title || "",
        country: b.freelance?.country || "",
        rating: b.freelance?.freelancerProfile?.rating || 0,
        amount: b.amount,
        proposedPrice: b.amount,
        deliveryDays: b.deliveryDays,
        motivation: b.coverLetter || "",
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[API /projects/[id]/bids GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des candidatures" },
      { status: 500 }
    );
  }
}
