import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/messages/conversations
 * Returns all conversations for the authenticated user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: { users: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        users: {
          where: { userId: { not: userId } },
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            read: true,
            type: true,
            fileName: true,
          },
        },
      },
    });

    const formatted = conversations.map((c) => {
      const other = c.users[0]?.user;
      const lastMsg = c.messages[0];
      return {
        id: c.id,
        type: c.type,
        title: c.title,
        otherUser: other
          ? { id: other.id, name: other.name, email: other.email, image: other.image }
          : null,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              fromMe: lastMsg.senderId === userId,
              read: lastMsg.read,
              type: lastMsg.type,
              fileName: lastMsg.fileName,
            }
          : null,
        updatedAt: c.updatedAt,
      };
    });

    const unreadCount = formatted.filter(
      (c) => c.lastMessage && !c.lastMessage.fromMe && !c.lastMessage.read
    ).length;

    return NextResponse.json({ data: { conversations: formatted, unreadCount } });
  } catch (err) {
    console.error("[messages/conversations GET]", err);
    return NextResponse.json({ data: { conversations: [], unreadCount: 0 } });
  }
}

/**
 * POST /api/formations/messages/conversations
 * Creates (or returns existing) a DIRECT conversation with another user.
 *
 * Body: { otherUserId: string, title?: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { otherUserId, title } = body as { otherUserId: string; title?: string };

    if (!otherUserId || otherUserId === userId) {
      return NextResponse.json({ error: "otherUserId invalide" }, { status: 400 });
    }

    // Check that other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, email: true, image: true },
    });
    if (!otherUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    // Find existing DIRECT conversation between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        users: { every: { userId: { in: [userId, otherUserId] } } },
        AND: [
          { users: { some: { userId } } },
          { users: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, content: true, createdAt: true, senderId: true, read: true },
        },
      },
    });

    if (existing) {
      return NextResponse.json({ data: existing, isNew: false });
    }

    // Create new conversation
    const created = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        title: title ?? null,
        users: {
          create: [
            { userId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        messages: true,
      },
    });

    return NextResponse.json({ data: created, isNew: true });
  } catch (err) {
    console.error("[messages/conversations POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
