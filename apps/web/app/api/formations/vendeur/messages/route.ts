import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Find all conversations where this user is a participant
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
          select: { id: true, content: true, createdAt: true, senderId: true, read: true },
        },
      },
    });

    const formatted = conversations.map((c) => {
      const other = c.users[0]?.user;
      const lastMessage = c.messages[0];
      return {
        id: c.id,
        type: c.type,
        title: c.title,
        otherUser: other
          ? {
              id: other.id,
              name: other.name,
              email: other.email,
              image: other.image,
            }
          : null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              fromMe: lastMessage.senderId === userId,
              read: lastMessage.read,
            }
          : null,
        updatedAt: c.updatedAt,
      };
    });

    const unread = formatted.filter(
      (c) => c.lastMessage && !c.lastMessage.fromMe && !c.lastMessage.read
    ).length;

    return NextResponse.json({
      data: { conversations: formatted, unreadCount: unread },
    });
  } catch (err) {
    console.error("[vendeur/messages]", err);
    return NextResponse.json({ data: { conversations: [], unreadCount: 0 } });
  }
}
