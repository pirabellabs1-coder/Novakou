import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { offreStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const offres = offreStore.getByFreelance(session.user.id);

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
  } catch (error) {
    console.error("[API /offres POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de l'offre" },
      { status: 500 }
    );
  }
}
