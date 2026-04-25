import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const type = url.searchParams.get("type") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const conversationId = url.searchParams.get("id") || undefined;

    // If requesting a specific conversation with messages
    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          users: {
            include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } },
          },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: { select: { id: true, name: true, email: true, image: true, role: true } },
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
      }

      return NextResponse.json({ data: conversation });
    }

    // List all conversations
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { messages: { some: { content: { contains: search, mode: "insensitive" } } } },
        { users: { some: { user: { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } } } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: "desc" },
        include: {
          users: {
            include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true, sender: { select: { name: true } } },
          },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return NextResponse.json({
      data: conversations,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[Admin Conversations API]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
