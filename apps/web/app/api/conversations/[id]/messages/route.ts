import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { conversationStore } from "@/lib/dev/data-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = conversationStore.getById(id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
    }

    // Verify the user is a participant in this conversation
    if (!conversation.participants.includes(session.user.id)) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    return NextResponse.json({ messages: conversation.messages });
  } catch (error) {
    console.error("[API /conversations/[id]/messages GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des messages" },
      { status: 500 }
    );
  }
}

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
    const conversation = conversationStore.getById(id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation introuvable" },
        { status: 404 }
      );
    }

    // Verify the user is a participant in this conversation
    if (!conversation.participants.includes(session.user.id)) {
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

    const updatedConversation = conversationStore.sendMessage(
      id,
      session.user.id,
      content.trim(),
      type || "text",
      fileName,
      fileSize
    );

    if (!updatedConversation) {
      return NextResponse.json(
        { error: "Impossible d'envoyer le message" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      conversation: updatedConversation,
      messages: updatedConversation.messages,
    });
  } catch (error) {
    console.error("[API /conversations/[id]/messages POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
