import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { projectStore } from "@/lib/dev/data-store";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().min(5, "Titre trop court").max(200),
  description: z.string().min(20, "Description trop courte").max(5000),
  category: z.string().optional(),
  budgetMin: z.number().min(0).max(1000000).optional(),
  budgetMax: z.number().min(0).max(1000000).optional(),
  deadline: z.string().optional(),
  urgency: z.string().optional(),
  contractType: z.string().optional(),
  skills: z.array(z.string()).max(20).optional(),
}).refine(
  (data) => !data.budgetMin || !data.budgetMax || data.budgetMin <= data.budgetMax,
  { message: "Le budget min doit etre inferieur au budget max", path: ["budgetMax"] }
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const projects = projectStore.getAll();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[API /projects GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des projets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }
    const { title, description, category, budgetMin, budgetMax, deadline, urgency, contractType, skills } = result.data;

    const project = projectStore.create({
      clientId: session.user.id,
      clientName: session.user.name || "Client",
      clientCountry: "FR",
      clientRating: 0,
      title,
      description,
      category: category || "general",
      budgetMin: budgetMin || 0,
      budgetMax: budgetMax || 0,
      deadline: deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      urgency: urgency || "normale",
      contractType: contractType || "ponctuel",
      skills: skills || [],
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[API /projects POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
