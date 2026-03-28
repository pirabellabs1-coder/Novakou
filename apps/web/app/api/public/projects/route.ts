import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { projectStore } from "@/lib/dev/data-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const urgency = searchParams.get("urgency") || "";
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 12);
    const q = searchParams.get("q")?.toLowerCase() || "";
    const budgetMin = Number(searchParams.get("budgetMin")) || 0;
    const budgetMax = Number(searchParams.get("budgetMax")) || 0;
    const deadline = searchParams.get("deadline") || "";
    const contractType = searchParams.get("contractType") || "";

    // Dev mode local only
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      let projects = projectStore.getAll().filter((p) => p.status === "ouvert");

      if (category)
        projects = projects.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
      if (urgency) projects = projects.filter((p) => p.urgency === urgency);
      if (q) {
        projects = projects.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.skills || []).some((s: string) => s.toLowerCase().includes(q))
        );
      }
      if (budgetMin > 0) projects = projects.filter((p) => p.budgetMax >= budgetMin);
      if (budgetMax > 0) projects = projects.filter((p) => p.budgetMin <= budgetMax);
      if (deadline) projects = projects.filter((p) => new Date(p.deadline) <= new Date(deadline));
      if (contractType && contractType !== "tous") projects = projects.filter((p) => p.contractType === contractType);

      switch (sort) {
        case "budget_asc":
          projects.sort((a, b) => a.budgetMin - b.budgetMin);
          break;
        case "budget_desc":
          projects.sort((a, b) => b.budgetMax - a.budgetMax);
          break;
        case "deadline":
          projects.sort(
            (a, b) =>
              new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
          break;
        default:
          projects.sort(
            (a, b) =>
              new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          );
      }

      const total = projects.length;
      const offset = (page - 1) * limit;
      const paginated = projects.slice(offset, offset + limit);

      return NextResponse.json({
        projects: paginated,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Prisma
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: "ouvert" };
    if (category) where.category = category;
    if (urgency) where.urgency = urgency;
    if (contractType && contractType !== "tous") where.contractType = contractType;
    if (budgetMin > 0) where.budgetMax = { ...where.budgetMax, gte: budgetMin };
    if (budgetMax > 0) where.budgetMin = { ...where.budgetMin, lte: budgetMax };
    if (deadline) where.deadline = { lte: new Date(deadline) };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { skills: { hasSome: [q] } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    if (sort === "budget_asc") orderBy = { budgetMin: "asc" };
    else if (sort === "budget_desc") orderBy = { budgetMax: "desc" };
    else if (sort === "deadline") orderBy = { deadline: "asc" };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: { select: { id: true, name: true, image: true, country: true } },
          _count: { select: { bids: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        clientId: p.clientId,
        clientName: p.client?.name || "Client",
        clientCountry: p.client?.country || "",
        clientRating: 0,
        title: p.title,
        description: p.description,
        category: p.category,
        budgetMin: p.budgetMin,
        budgetMax: p.budgetMax,
        deadline: p.deadline.toISOString(),
        urgency: p.urgency,
        contractType: p.contractType,
        skills: p.skills,
        status: p.status,
        proposals: p._count.bids,
        candidatureCount: p._count.bids,
        postedAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[API /public/projects GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    );
  }
}
