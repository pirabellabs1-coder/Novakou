import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getSignedUrl, type StorageBucket } from "@/lib/supabase-storage";

const MSG_ATTACHMENT_BUCKET: StorageBucket = "message-attachments";

/** Check if a value is a storage path (not a full URL) */
function isStoragePath(value: string): boolean {
  return !value.startsWith("http") && !value.startsWith("blob:") && !value.startsWith("data:");
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id, messageId } = await params;
    const userId = session.user.id;

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

    // Get the message
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== id) {
      return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
    }

    if (message.type !== "VOICE" || !message.audioUrl) {
      return NextResponse.json({ error: "Ce message n'est pas un message vocal" }, { status: 400 });
    }

    // Return cached transcription if available
    if (message.transcription) {
      return NextResponse.json({ transcription: message.transcription });
    }

    // Get audio URL (resolve storage path if needed)
    let audioUrl = message.audioUrl;
    if (isStoragePath(audioUrl)) {
      const signedUrl = await getSignedUrl(MSG_ATTACHMENT_BUCKET, audioUrl, 300);
      if (!signedUrl) {
        return NextResponse.json({ error: "Impossible d'acceder au fichier audio" }, { status: 500 });
      }
      audioUrl = signedUrl;
    }

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return NextResponse.json({ error: "Impossible de telecharger l'audio" }, { status: 500 });
    }
    const audioBlob = await audioResponse.blob();

    // Call OpenAI Whisper API for transcription
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: "Service de transcription non configure" }, { status: 503 });
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "fr");

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const err = await whisperResponse.text().catch(() => "");
      console.error("[Transcribe] Whisper API error:", whisperResponse.status, err);
      return NextResponse.json({ error: "Erreur lors de la transcription" }, { status: 500 });
    }

    const whisperData = await whisperResponse.json();
    const transcription = whisperData.text || "";

    // Save transcription to database
    await prisma.message.update({
      where: { id: messageId },
      data: { transcription },
    });

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error("[API /transcribe POST]", error);
    return NextResponse.json({ error: "Erreur lors de la transcription" }, { status: 500 });
  }
}
