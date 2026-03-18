import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { conversationStore } from "@/lib/dev/data-store";

export async function POST(
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

    conversationStore.markRead(id);

    // Return updated readBy for all messages
    const updated = conversationStore.getById(id);
    const readBy = updated?.messages.map((m) => ({
      messageId: m.id,
      readBy: m.read ? [session.user!.id, m.senderId] : [m.senderId],
    })) || [];

    return NextResponse.json({ success: true, readBy });
  } catch (error) {
    console.error("[API /conversations/[id]/read POST]", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage comme lu" },
      { status: 500 }
    );
  }
}
