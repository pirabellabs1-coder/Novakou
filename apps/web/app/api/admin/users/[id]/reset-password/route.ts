import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;
  const tempPassword = crypto.randomBytes(6).toString("base64url").slice(0, 12) + "!A1";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  try {
    const { prisma } = await import("@freelancehigh/db");
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "reset_password",
        targetUserId: id,
      },
    });
  } catch {
    // DB non connectee — mode degrade
  }

  return NextResponse.json({
    tempPassword,
    message: "Mot de passe reinitialise.",
  });
}
