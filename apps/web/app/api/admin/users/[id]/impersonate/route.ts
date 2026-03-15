import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;

  // L'audit log est OBLIGATOIRE pour l'impersonation — si l'enregistrement echoue, on refuse
  try {
    const { prisma } = await import("@freelancehigh/db");
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "impersonate",
        targetUserId: id,
      },
    });
  } catch (err) {
    console.error("[IMPERSONATE] Audit log echoue — impersonation refusee", err);
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'audit log. Impersonation refusee pour raisons de securite." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `Impersonation started for user ${id}`,
    success: true,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { prisma } = await import("@freelancehigh/db");
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "stop_impersonate",
        targetUserId: id,
      },
    });
  } catch (err) {
    console.error("[IMPERSONATE] Audit log stop_impersonate echoue", err);
    // On permet quand meme l'arret de l'impersonation mais on log l'erreur
  }

  return NextResponse.json({
    message: `Impersonation ended for user ${id}`,
    success: true,
  });
}
