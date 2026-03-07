import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore } from "@/lib/dev/data-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const order = orderStore.getById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    // Verify the user is either the client or the freelance on this order
    if (order.clientId !== session.user.id && order.freelanceId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, type, fileName, fileSize } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du message est requis" },
        { status: 400 }
      );
    }

    const sender = session.user.id === order.freelanceId ? "freelance" : "client";
    const senderName =
      sender === "freelance" ? "Vous" : order.clientName;

    const updatedOrder = orderStore.addMessage(id, {
      sender,
      senderName,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      type: type || "text",
      fileName,
      fileSize,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Impossible d'envoyer le message" },
        { status: 400 }
      );
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("[API /orders/[id]/messages POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
