import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { conversationStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Admin sees all conversations
    const isAdmin = (session.user as Record<string, unknown>).role === "admin";
    const conversations = isAdmin
      ? conversationStore.getAll()
      : conversationStore.getByUser(session.user.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[API /conversations GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des conversations" },
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
    const { participantId, contactName, contactAvatar, contactRole, orderId } = body as {
      participantId: string;
      contactName: string;
      contactAvatar?: string;
      contactRole?: string;
      orderId?: string;
    };

    if (!participantId) {
      return NextResponse.json({ error: "participantId requis" }, { status: 400 });
    }

    const avatar = contactAvatar || contactName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const conversation = conversationStore.create({
      participants: [session.user.id, participantId],
      contactName: contactName || "Utilisateur",
      contactAvatar: avatar,
      contactRole: (contactRole as "client" | "agence" | "support") || "client",
      orderId,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("[API /conversations POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la conversation" },
      { status: 500 }
    );
  }
}
