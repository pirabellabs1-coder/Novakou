import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { candidatureStore, projectStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const candidatures = candidatureStore.getByFreelance(session.user.id);

    return NextResponse.json({ candidatures });
  } catch (error) {
    console.error("[API /candidatures GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des candidatures" },
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
    const { projectId, motivation, proposedPrice, deliveryDays } = body;

    if (!projectId || !motivation || !proposedPrice || !deliveryDays) {
      return NextResponse.json(
        { error: "Champs requis manquants: projectId, motivation, proposedPrice, deliveryDays" },
        { status: 400 }
      );
    }

    const project = projectStore.getById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Projet introuvable" },
        { status: 404 }
      );
    }

    const candidature = candidatureStore.create({
      projectId,
      projectTitle: project.title,
      clientName: project.clientName,
      freelanceId: session.user.id,
      motivation,
      proposedPrice: Number(proposedPrice),
      deliveryDays: Number(deliveryDays),
    });

    // Increment proposal count on the project
    projectStore.incrementProposals(projectId);

    return NextResponse.json({ candidature }, { status: 201 });
  } catch (error) {
    console.error("[API /candidatures POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la candidature" },
      { status: 500 }
    );
  }
}
