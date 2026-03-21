import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { candidatureStore, projectStore } from "@/lib/dev/data-store";
import { canApply, normalizePlanName, getPlanLimits, formatLimit } from "@/lib/plans";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV) {
      const candidatures = candidatureStore.getByFreelance(session.user.id);

      return NextResponse.json({ candidatures });
    }

    // Production: Prisma
    const candidatures = await prisma.bid.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

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

    // --- Plan enforcement: check application limit ---
    const userPlan = normalizePlanName(session.user.plan);
    const planLimits = getPlanLimits(userPlan);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (IS_DEV) {
      const allCandidatures = candidatureStore.getByFreelance(session.user.id);
      const monthlyCount = allCandidatures.filter(
        (c) => new Date(c.submittedAt) >= monthStart
      ).length;
      if (!canApply(userPlan, monthlyCount)) {
        return NextResponse.json(
          {
            error: `Limite de candidatures atteinte pour ce mois (${formatLimit(planLimits.applicationLimit)}/mois pour le plan ${planLimits.name}). Passez a un plan superieur pour envoyer plus de candidatures.`,
            code: "APPLICATION_LIMIT_REACHED",
            limit: planLimits.applicationLimit,
            used: monthlyCount,
          },
          { status: 403 }
        );
      }
    } else {
      const monthlyCount = await prisma.bid.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: monthStart },
        },
      });
      if (!canApply(userPlan, monthlyCount)) {
        return NextResponse.json(
          {
            error: `Limite de candidatures atteinte pour ce mois (${formatLimit(planLimits.applicationLimit)}/mois pour le plan ${planLimits.name}). Passez a un plan superieur pour envoyer plus de candidatures.`,
            code: "APPLICATION_LIMIT_REACHED",
            limit: planLimits.applicationLimit,
            used: monthlyCount,
          },
          { status: 403 }
        );
      }
    }

    if (IS_DEV) {
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
    }

    // Production: Prisma
    const candidature = await prisma.bid.create({
      data: {
        userId: session.user.id,
        projectId,
        proposal: motivation,
        amount: Number(proposedPrice),
        deliveryDays: Number(deliveryDays),
        status: "EN_ATTENTE",
      },
    });

    return NextResponse.json({ candidature }, { status: 201 });
  } catch (error) {
    console.error("[API /candidatures POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la candidature" },
      { status: 500 }
    );
  }
}
