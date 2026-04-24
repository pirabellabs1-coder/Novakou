import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/change-password
 *
 * Body: { currentPassword: string, newPassword: string }
 *
 * Changes the authenticated user's password. Requires the current password
 * to match. The new password is hashed with bcrypt cost 12.
 *
 * Errors:
 *   401 — not authenticated
 *   400 — missing fields, current mismatch, or new password too weak
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword: string = body.currentPassword ?? "";
    const newPassword: string = body.newPassword ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel et nouveau mot de passe requis" },
        { status: 400 },
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit faire au moins 8 caractères" },
        { status: 400 },
      );
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l'ancien" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Les comptes crees via OAuth (Google) n'ont pas forcement de passwordHash
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error: "Votre compte a été créé via Google. Impossible de changer le mot de passe ici.",
          code: "OAUTH_ACCOUNT",
        },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 },
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Notification in-app
    await prisma.notification
      .create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Mot de passe modifié",
          message: "Votre mot de passe a été changé avec succès.",
        },
      })
      .catch(() => null);

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    console.error("[auth/change-password POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
