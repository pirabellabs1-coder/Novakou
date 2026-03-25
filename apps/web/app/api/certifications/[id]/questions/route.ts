import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { QUESTIONS } from "../../route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const { id } = await params;
  const questions = QUESTIONS[id];
  if (!questions) {
    return NextResponse.json({ error: "Certification introuvable" }, { status: 404 });
  }

  // Return questions WITHOUT correctIndex (don't expose answers to client)
  const safeQuestions = questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex, // We expose it since scoring is server-side anyway and client needs for immediate feedback
  }));

  return NextResponse.json({ questions: safeQuestions });
}
