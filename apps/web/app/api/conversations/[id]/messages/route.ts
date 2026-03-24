import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/events/dispatcher";
import { getSignedUrl, type StorageBucket } from "@/lib/supabase-storage";

const MSG_ATTACHMENT_BUCKET: StorageBucket = "message-attachments";
const SIGNED_URL_TTL = 3600; // 1 hour

/** Check if a value is a Supabase Storage path (not a full URL) */
function isStoragePath(value: string | null | undefined): value is string {
  if (!value) return false;
  return !value.startsWith("http") && !value.startsWith("blob:") && !value.startsWith("data:");
}

/** Generate a fresh signed URL from a storage path, or return the value as-is */
async function resolveUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (isStoragePath(value)) {
    return await getSignedUrl(MSG_ATTACHMENT_BUCKET, value, SIGNED_URL_TTL) || value;
  }
  return value;
}

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
    const userId = session.user.id;

    // Verify user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    const isAdmin = (session.user as Record<string, unknown>).role === "admin";
    const isParticipant = conversation.users.some((u) => u.userId === userId);
    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    // Fetch messages with sender info
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const mappedMessages = await Promise.all(messages.map(async (m) => {
      const isMine = m.senderId === userId;
      // Determine delivery status
      let status: "sent" | "delivered" | "read" = "sent";
      if (m.read) {
        status = "read";
      } else if (!isMine) {
        status = "delivered"; // If we can see it, it's delivered to us
      }

      // Generate fresh signed URLs for storage paths
      const fileUrl = await resolveUrl(m.fileUrl);
      const audioUrl = await resolveUrl(m.audioUrl);

      return {
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender?.name || "Utilisateur",
        senderAvatar: m.sender?.image || "",
        senderRole: ((m.sender as Record<string, unknown>)?.role as string) || "client",
        content: m.content,
        type: (m.type || "TEXT").toLowerCase(),
        createdAt: m.createdAt.toISOString(),
        read: m.read,
        status,
        fileName: m.fileName,
        fileUrl,
        fileType: m.fileType,
        fileSizeBytes: m.fileSizeBytes,
        audioUrl,
        audioDuration: m.audioDuration,
        transcription: m.transcription,
        callDuration: m.callDuration,
        editedAt: m.editedAt?.toISOString(),
        deletedAt: m.deletedAt?.toISOString(),
        linkPreviewData: m.linkPreviewData,
      };
    }));

    // Auto-mark other users' messages as read
    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: userId }, read: false },
      data: { read: true },
    });

    // Update lastReadAt for this user
    await prisma.conversationUser.update({
      where: { conversationId_userId: { conversationId: id, userId } },
      data: { lastReadAt: new Date() },
    }).catch(() => {}); // Ignore if not found (admin viewing)

    return NextResponse.json({ messages: mappedMessages });
  } catch (error) {
    console.error("[API /conversations/[id]/messages GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation des messages" }, { status: 500 });
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
    const userId = session.user.id;
    const body = await request.json();
    const { content, type, fileName, fileSize, fileUrl, fileType, linkPreviewData, audioUrl, audioDuration, storagePath } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Le contenu du message est requis" }, { status: 400 });
    }

    // Verify user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    const isParticipant = conversation.users.some((u) => u.userId === userId);
    if (!isParticipant) {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    // Determine what to store in DB:
    // If storagePath is provided, store it instead of the signed URL (which expires).
    // For voice messages, the path goes into audioUrl; for files/images, into fileUrl.
    const msgType = (type || "TEXT").toUpperCase();
    let dbFileUrl = fileUrl || null;
    let dbAudioUrl = audioUrl || null;
    if (storagePath) {
      if (msgType === "VOICE") {
        dbAudioUrl = storagePath;
      } else {
        dbFileUrl = storagePath;
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content: content.trim(),
        type: msgType,
        fileName: fileName || null,
        fileUrl: dbFileUrl,
        fileType: fileType || null,
        fileSizeBytes: fileSize ? parseInt(fileSize, 10) || null : null,
        audioUrl: dbAudioUrl,
        audioDuration: audioDuration ? parseInt(String(audioDuration), 10) || null : null,
        linkPreviewData: linkPreviewData || undefined,
      },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Emit event for notifications
    const senderName = session.user.name || "Utilisateur";
    const otherUsers = conversation.users.filter((u) => u.userId !== userId);
    for (const u of otherUsers) {
      emitEvent("message.received", {
        conversationId: id,
        senderId: userId,
        senderName,
        recipientId: u.userId,
        recipientName: "",
        recipientEmail: "",
        messagePreview: `${senderName} : ${content.trim().slice(0, 50)}`,
      }).catch(() => {});
    }

    // Resolve storage paths to fresh signed URLs for the response
    const responseFileUrl = await resolveUrl(message.fileUrl);
    const responseAudioUrl = await resolveUrl(message.audioUrl);

    return NextResponse.json({
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender?.name || senderName,
        senderAvatar: message.sender?.image || "",
        senderRole: ((message.sender as Record<string, unknown>)?.role as string) || "client",
        content: message.content,
        type: (message.type || "TEXT").toLowerCase(),
        createdAt: message.createdAt.toISOString(),
        read: false,
        status: "sent",
        fileName: message.fileName,
        fileUrl: responseFileUrl,
        fileType: message.fileType,
        fileSizeBytes: message.fileSizeBytes,
        audioUrl: responseAudioUrl,
        audioDuration: message.audioDuration,
        linkPreviewData: message.linkPreviewData,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /conversations/[id]/messages POST]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 });
  }
}
