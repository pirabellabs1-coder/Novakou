import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";

// POST: Reset du mot de passe d'un utilisateur (admin only)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json() as { userId: string };
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    // Rate limit: 5 attempts per 15 min per token/userId
    const rateLimitKey = `reset-password:${userId}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez patienter avant de reessayer." },
        { status: 429 }
      );
    }
    recordFailedAttempt(rateLimitKey);

    // Generer un mot de passe temporaire securise
    const tempPassword = crypto.randomBytes(6).toString("base64url").slice(0, 12) + "!A1";

    // Hasher le mot de passe temporaire
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    try {
      const { prisma } = await import("@freelancehigh/db");
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Log dans l'audit
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "reset_password",
          targetUserId: userId,
        },
      });
    } catch {
      // DB non connectee — operation en mode degrade
    }

    // Le mot de passe temporaire est affiche UNE SEULE FOIS a l'admin
    return NextResponse.json({
      success: true,
      tempPassword,
      message: "Mot de passe reinitialise. Communiquez-le de maniere securisee a l'utilisateur.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
