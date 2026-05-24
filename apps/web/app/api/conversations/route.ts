import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveStorageFields } from "@/lib/storage-resolver";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const userId = session.user.id;
    const isAdmin = (session.user as Record<string, unknown>).role === "admin";

    const where = isAdmin
      ? {}
      : { users: { some: { userId } } };

    const dbConversationsRaw = await prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
          include: { sender: { select: { id: true, name: true, image: true, avatar: true } } },
        },
        users: {
          include: {
            user: {
              select: { id: true, name: true, image: true, avatar: true, role: true },
            },
          },
        },
        order: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" as const },
    });

    // Résout image/avatar (paths Supabase Storage) → signed URLs avant rendering.
    // Les champs image/avatar sont reconnus automatiquement par resolveStorageFields.
    const dbConversations = await resolveStorageFields(dbConversationsRaw);

    const conversations = await Promise.all(
      dbConversations.map(async (c) => {
        // Calculate unread count based on lastReadAt
        const myMembership = c.users.find((u) => u.userId === userId);
        const lastReadAt = myMembership?.lastReadAt;

        let unreadCount = 0;
        if (!isAdmin) {
          const unreadWhere: Record<string, unknown> = {
            conversationId: c.id,
            senderId: { not: userId },
          };
          if (lastReadAt) {
            unreadWhere.createdAt = { gt: lastReadAt };
          } else {
            unreadWhere.read = false;
          }
          unreadCount = await prisma.message.count({ where: unreadWhere });
        }

        const lastMsg = c.messages[0];

        // Build participant list with proper names
        const participants = c.users.map((u) => {
          const userName = u.user.name || "Utilisateur";
          // Avatar = 2-letter initials (NEVER a URL or ID)
          const initials = userName
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U";
          return {
            id: u.user.id,
            name: userName,
            avatar: initials,
            avatarUrl: u.user.avatar || u.user.image || null, // URL kept separate for <img> usage
            role: (u.user as Record<string, unknown>).role || "client",
            online: false,
          };
        });

        // Generate a readable order reference
        const orderRef = c.orderId ? c.orderId.slice(-6).toUpperCase() : undefined;

        // Human-readable last message preview
        let lastMessagePreview = lastMsg?.content || "";
        if (lastMsg) {
          const msgType = (lastMsg.type || "TEXT").toUpperCase();
          if (msgType === "IMAGE") lastMessagePreview = "Photo";
          else if (msgType === "FILE") lastMessagePreview = "Fichier";
          else if (msgType === "VOICE") lastMessagePreview = "Message vocal";
          else if (msgType === "CALL_AUDIO") lastMessagePreview = "Appel audio";
          else if (msgType === "CALL_VIDEO") lastMessagePreview = "Appel video";
          else if (msgType === "CALL_MISSED") lastMessagePreview = "Appel manque";
          else if (msgType === "SYSTEM") lastMessagePreview = lastMsg.content;
          // For TEXT, keep the actual content but truncate
          else lastMessagePreview = lastMsg.content.length > 80 ? lastMsg.content.slice(0, 80) + "..." : lastMsg.content;
        }

        return {
          id: c.id,
          type: c.type?.toLowerCase() || "direct",
          participants,
          title: c.title || (c.orderId ? `Commande #${orderRef}` : undefined),
          orderId: c.orderId || undefined,
          orderNumber: orderRef,
          lastMessage: lastMessagePreview,
          lastMessageTime: lastMsg?.createdAt?.toISOString() || c.updatedAt.toISOString(),
          lastMessageSenderName: lastMsg?.sender?.name || undefined,
          unreadCount,
          messages: [],
        };
      })
    );

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
    const { participantId, contactName, contactAvatar, contactRole, orderId, message } = body as {
      participantId: string;
      contactName?: string;
      contactAvatar?: string;
      contactRole?: string;
      orderId?: string;
      message?: string;
    };

    if (!participantId) {
      return NextResponse.json({ error: "participantId requis" }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if conversation already exists between these users
    const existingWhere: Record<string, unknown> = {
      AND: [
        { users: { some: { userId } } },
        { users: { some: { userId: participantId } } },
      ],
    };
    if (orderId) {
      (existingWhere.AND as Array<Record<string, unknown>>).push({ orderId });
    }

    const existing = await prisma.conversation.findFirst({
      where: existingWhere,
      include: {
        messages: { orderBy: { createdAt: "desc" as const }, take: 1 },
        users: {
          include: {
            user: { select: { id: true, name: true, image: true, avatar: true, role: true } },
          },
        },
      },
    });

    if (existing) {
      if (message?.trim()) {
        await prisma.message.create({
          data: {
            conversationId: existing.id,
            senderId: userId,
            content: message.trim(),
          },
        });
        await prisma.conversation.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
      }

      const participants = existing.users.map((u) => {
        const userName = u.user.name || contactName || "Utilisateur";
        const initials = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
        return {
          id: u.user.id,
          name: userName,
          avatar: initials,
          avatarUrl: u.user.avatar || u.user.image || null,
          role: (u.user as Record<string, unknown>).role || contactRole || "client",
          online: false,
        };
      });

      const orderRef = existing.orderId ? existing.orderId.slice(-6).toUpperCase() : undefined;

      const conversation = {
        id: existing.id,
        type: existing.type?.toLowerCase() || "direct",
        participants,
        title: existing.title || (existing.orderId ? `Commande #${orderRef}` : undefined),
        orderId: existing.orderId || undefined,
        orderNumber: orderRef,
        lastMessage: message?.trim() || existing.messages[0]?.content || "",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      };

      return NextResponse.json({ conversation }, { status: 201 });
    }

    // Create new conversation
    const created = await prisma.conversation.create({
      data: {
        orderId: orderId || null,
        users: {
          create: [
            { userId },
            { userId: participantId },
          ],
        },
      },
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, image: true, avatar: true, role: true } },
          },
        },
      },
    });

    if (message?.trim()) {
      await prisma.message.create({
        data: {
          conversationId: created.id,
          senderId: userId,
          content: message.trim(),
        },
      });
    }

    const participants = created.users.map((u) => {
      const userName = u.user.name || contactName || "Utilisateur";
      const initials = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "U";
      return {
        id: u.user.id,
        name: userName,
        avatar: initials,
        avatarUrl: u.user.avatar || u.user.image || null,
        role: (u.user as Record<string, unknown>).role || contactRole || "client",
        online: false,
      };
    });

    const orderRef = created.orderId ? created.orderId.slice(-6).toUpperCase() : undefined;

    const conversation = {
      id: created.id,
      type: "direct",
      participants,
      title: created.orderId ? `Commande #${orderRef}` : undefined,
      orderId: created.orderId || undefined,
      orderNumber: orderRef,
      lastMessage: message?.trim() || "",
      lastMessageTime: created.updatedAt.toISOString(),
      unreadCount: 0,
      messages: [],
    };

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("[API /conversations POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la conversation" },
      { status: 500 }
    );
  }
}
