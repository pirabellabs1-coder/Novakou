import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { conversationStore } from "@/lib/dev/data-store";
import { prisma, IS_DEV } from "@/lib/prisma";

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DELETE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// PUT — Edit a message (within 15 minutes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du message est requis" },
        { status: 400 }
      );
    }

    if (IS_DEV) {
      const conversation = conversationStore.getById(conversationId);
      if (!conversation) {
        return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
      }

      const msgIndex = conversation.messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) {
        return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
      }

      const msg = conversation.messages[msgIndex];
      if (msg.senderId !== session.user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez modifier que vos propres messages" },
          { status: 403 }
        );
      }

      const elapsed = Date.now() - new Date(msg.timestamp).getTime();
      if (elapsed > EDIT_WINDOW_MS) {
        return NextResponse.json(
          { error: "Le delai de modification est expire (15 minutes)" },
          { status: 400 }
        );
      }

      conversation.messages[msgIndex] = {
        ...msg,
        content: content.trim(),
        editedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        message: conversation.messages[msgIndex],
      });
    }

    // Production: Prisma
    const message = await prisma.message.findUnique({
      where: { id: messageId, conversationId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez modifier que vos propres messages" },
        { status: 403 }
      );
    }

    const elapsed = Date.now() - message.createdAt.getTime();
    if (elapsed > EDIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Le delai de modification est expire (15 minutes)" },
        { status: 400 }
      );
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        editedAt: new Date(),
      },
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error("[API PUT /conversations/[id]/messages/[messageId]]", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du message" },
      { status: 500 }
    );
  }
}

// DELETE — Soft delete a message (within 10 minutes)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;

    if (IS_DEV) {
      const conversation = conversationStore.getById(conversationId);
      if (!conversation) {
        return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
      }

      const msgIndex = conversation.messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) {
        return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
      }

      const msg = conversation.messages[msgIndex];
      if (msg.senderId !== session.user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez supprimer que vos propres messages" },
          { status: 403 }
        );
      }

      const elapsed = Date.now() - new Date(msg.timestamp).getTime();
      if (elapsed > DELETE_WINDOW_MS) {
        return NextResponse.json(
          { error: "Le delai de suppression est expire (10 minutes)" },
          { status: 400 }
        );
      }

      conversation.messages[msgIndex] = {
        ...msg,
        content: "Ce message a ete supprime",
        deletedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        message: conversation.messages[msgIndex],
      });
    }

    // Production: Prisma
    const message = await prisma.message.findUnique({
      where: { id: messageId, conversationId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que vos propres messages" },
        { status: 403 }
      );
    }

    const elapsed = Date.now() - message.createdAt.getTime();
    if (elapsed > DELETE_WINDOW_MS) {
      return NextResponse.json(
        { error: "Le delai de suppression est expire (10 minutes)" },
        { status: 400 }
      );
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: "Ce message a ete supprime",
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error("[API DELETE /conversations/[id]/messages/[messageId]]", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du message" },
      { status: 500 }
    );
  }
}
