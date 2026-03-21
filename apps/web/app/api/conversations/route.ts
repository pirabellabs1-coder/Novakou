import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { conversationStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV) {
      // Admin sees all conversations
      const isAdmin = (session.user as Record<string, unknown>).role === "admin";
      const conversations = isAdmin
        ? conversationStore.getAll()
        : conversationStore.getByUser(session.user.id);

      return NextResponse.json({ conversations });
    } else {
      const isAdmin = (session.user as Record<string, unknown>).role === "admin";

      const where = isAdmin
        ? {}
        : { users: { some: { userId: session.user.id } } };

      const dbConversations = await prisma.conversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          users: {
            include: { user: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      // Map to same shape as dev-store
      const conversations = dbConversations.map((c) => {
        const otherUser = c.users.find((u) => u.userId !== session.user!.id)?.user;
        const lastMsg = c.messages[0];

        return {
          id: c.id,
          participants: c.users.map((u) => u.userId),
          contactName: otherUser?.name || "Utilisateur",
          contactAvatar: otherUser?.image || "",
          contactRole: (otherUser as Record<string, unknown>)?.role || "client",
          lastMessage: lastMsg?.content || "",
          lastMessageTime: lastMsg?.createdAt?.toISOString() || c.updatedAt.toISOString(),
          unread: c.messages.filter((m) => !m.read && m.senderId !== session.user!.id).length,
          online: false,
          orderId: c.orderId || undefined,
          messages: [],
        };
      });

      return NextResponse.json({ conversations });
    }
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

    if (IS_DEV) {
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
    } else {
      // Check if conversation already exists between these users (and optional orderId)
      const existingWhere: Record<string, unknown> = {
        AND: [
          { users: { some: { userId: session.user.id } } },
          { users: { some: { userId: participantId } } },
        ],
      };
      if (orderId) {
        (existingWhere.AND as Array<Record<string, unknown>>).push({ orderId });
      }

      const existing = await prisma.conversation.findFirst({
        where: existingWhere,
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          users: { include: { user: true } },
        },
      });

      if (existing) {
        const otherUser = existing.users.find((u) => u.userId !== session.user!.id)?.user;
        const lastMsg = existing.messages[0];

        const conversation = {
          id: existing.id,
          participants: existing.users.map((u) => u.userId),
          contactName: otherUser?.name || contactName || "Utilisateur",
          contactAvatar: otherUser?.image || contactAvatar || "",
          contactRole: contactRole || "client",
          lastMessage: lastMsg?.content || "",
          lastMessageTime: lastMsg?.createdAt?.toISOString() || existing.updatedAt.toISOString(),
          unread: 0,
          online: false,
          orderId: existing.orderId || undefined,
          messages: [],
        };

        return NextResponse.json({ conversation }, { status: 201 });
      }

      const created = await prisma.conversation.create({
        data: {
          orderId: orderId || null,
          users: {
            create: [
              { userId: session.user.id },
              { userId: participantId },
            ],
          },
        },
        include: {
          users: { include: { user: true } },
        },
      });

      const otherUser = created.users.find((u) => u.userId !== session.user!.id)?.user;
      const avatar = contactAvatar || contactName
        ?.split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "";

      const conversation = {
        id: created.id,
        participants: created.users.map((u) => u.userId),
        contactName: otherUser?.name || contactName || "Utilisateur",
        contactAvatar: otherUser?.image || avatar,
        contactRole: contactRole || "client",
        lastMessage: "",
        lastMessageTime: created.updatedAt.toISOString(),
        unread: 0,
        online: false,
        orderId: created.orderId || undefined,
        messages: [],
      };

      return NextResponse.json({ conversation }, { status: 201 });
    }
  } catch (error) {
    console.error("[API /conversations POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la conversation" },
      { status: 500 }
    );
  }
}
