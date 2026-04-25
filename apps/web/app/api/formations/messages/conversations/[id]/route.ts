import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/formations/messages/conversations/[id]
 * Returns messages for a conversation (paginated, newest last).
 *
 * Query params:
 *   cursor: last message id (optional, for older messages)
 *   limit: number of messages (default 40)
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "40"), 100);

    // Verify user is participant
    const conv = await prisma.conversation.findFirst({
      where: { id: id, users: { some: { userId } } },
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });
    if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: (await prisma.message.findUnique({ where: { id: cursor } }))?.createdAt ?? new Date() } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        content: true,
        type: true,
        senderId: true,
        read: true,
        createdAt: true,
        editedAt: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSizeBytes: true,
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Mark unread messages as read
    const unreadIds = messages
      .filter((m) => m.senderId !== userId && !m.read)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { read: true },
      });
    }

    // Update lastReadAt
    await prisma.conversationUser.update({
      where: { conversationId_userId: { conversationId: id, userId } },
      data: { lastReadAt: new Date() },
    });

    const otherUser = conv.users.find((u) => u.userId !== userId)?.user;

    return NextResponse.json({
      data: {
        messages: messages.reverse(),
        hasMore: messages.length === limit,
        otherUser: otherUser
          ? { id: otherUser.id, name: otherUser.name, email: otherUser.email, image: otherUser.image }
          : null,
        conversation: { id: conv.id, type: conv.type, title: conv.title },
      },
    });
  } catch (err) {
    console.error("[messages/conversations/[id] GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/formations/messages/conversations/[id]
 * Sends a new message in a conversation.
 *
 * Body: { content: string, type?: "TEXT" | "IMAGE" | "FILE", fileUrl?: string, fileName?: string, fileType?: string, fileSizeBytes?: number }
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Verify participation
    const conv = await prisma.conversation.findFirst({
      where: { id: id, users: { some: { userId } } },
      include: {
        users: { select: { userId: true } },
      },
    });
    if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

    const body = await request.json();
    const { content, type = "TEXT", fileUrl, fileName, fileType, fileSizeBytes } = body as {
      content: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSizeBytes?: number;
    };

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content: content?.trim() ?? "",
        type: type as "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | "VOICE",
        fileUrl: fileUrl ?? null,
        fileName: fileName ?? null,
        fileType: fileType ?? null,
        fileSizeBytes: fileSizeBytes ?? null,
      },
      select: {
        id: true,
        content: true,
        type: true,
        senderId: true,
        read: true,
        createdAt: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSizeBytes: true,
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: id },
      data: { updatedAt: new Date() },
    });

    // Notify recipient(s)
    const recipientIds = conv.users
      .map((u) => u.userId)
      .filter((uid) => uid !== userId);

    for (const recipientId of recipientIds) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: "MESSAGE",
          title: "Nouveau message",
          message: content?.length > 60 ? content.slice(0, 60) + "…" : content,
          link: `/messages/${id}`,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ data: message });
  } catch (err) {
    console.error("[messages/conversations/[id] POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
