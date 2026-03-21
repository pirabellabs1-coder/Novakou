import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { conversationStore, notificationStore } from "@/lib/dev/data-store";

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
    const { content, type, fileName, fileSize, fileUrl, fileType, linkPreviewData } = body;

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
      fileSize,
      linkPreviewData,
      fileUrl,
      fileType
    );

    if (!updatedConversation) {
      return NextResponse.json(
        { error: "Impossible d'envoyer le message" },
        { status: 400 }
      );
    }

    // Auto-link files to order resources when shared in ORDER conversations
    if ((type === "file" || type === "image") && fileUrl && updatedConversation.orderId) {
      try {
        const { orderStore } = await import("@/lib/dev/data-store");
        const order = orderStore.getById(updatedConversation.orderId);
        if (order) {
          // Determine uploader role based on order participant IDs
          const uploadedBy: "freelance" | "client" =
            session.user.id === order.freelanceId ? "freelance" : "client";
          const orderFile = {
            id: `file-${Date.now()}`,
            name: fileName || "Fichier",
            url: fileUrl,
            type: fileType || "application/octet-stream",
            size: fileSize || "0 MB",
            uploadedBy,
            uploadedAt: new Date().toISOString(),
          };
          // Append to the order's files array and persist
          order.files.push(orderFile);
          orderStore.update(order.id, { files: order.files });
        }
      } catch {
        // Non-blocking: resource linking is best-effort
      }
    }

    // Create notification for other participants (in-app)
    const senderName = session.user.name || "Utilisateur";
    const isFile = type === "file" || type === "image";
    const otherParticipants = updatedConversation.participants.filter(
      (pid) => pid !== session.user!.id
    );

    for (const participantId of otherParticipants) {
      const notifTitle = isFile
        ? `${senderName} a partage un fichier`
        : "Nouveau message";
      const notifMessage = isFile
        ? `${senderName} a partage un fichier : ${fileName || "fichier"}`
        : `${senderName} : ${content.trim().slice(0, 50)}${content.trim().length > 50 ? "..." : ""}`;

      notificationStore.add({
        userId: participantId,
        title: notifTitle,
        message: notifMessage,
        type: "message",
        read: false,
        link: `/dashboard/messages`,
      });

      // TODO: [Email notification after 5 min unread]
      // When this notification is created, schedule a delayed email notification job.
      // Implementation requires a BullMQ worker or cron job that:
      //   1. Schedules a job with a 5-minute delay for each new message notification
      //   2. When the job executes, checks if the notification is still unread
      //   3. If still unread AND the user has email notifications enabled in their settings,
      //      batches all unread message notifications and sends a single summary email
      //   4. The email should contain: number of unread messages, sender names, and a link to /dashboard/messages
      //   5. Uses Resend + React Email template: UnreadMessagesEmail
      //
      // Hook point: enqueue the delayed job here:
      //   await messageEmailQueue.add('unread-email-check', { userId: participantId, notificationId }, { delay: 5 * 60 * 1000 });
      //
      // The BullMQ worker should be in: apps/api/src/workers/unread-email-worker.ts
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
