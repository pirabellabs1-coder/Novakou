import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { validateResetToken, consumeResetToken } from "@/lib/auth/password-reset";
import { rateLimit } from "@/lib/api-rate-limit";
import { IS_DEV } from "@/lib/env";

const schema = z.object({
  token: z.string().min(64),
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caracteres.")
    .regex(/[A-Z]/, "Doit contenir au moins une majuscule.")
    .regex(/[a-z]/, "Doit contenir au moins une minuscule.")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Donnees invalides.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, password } = parsed.data;

    // Rate limit: 5 attempts per 15 min per token prefix (prevent brute force)
    const tokenPrefix = token.slice(0, 16);
    const rl = rateLimit(`confirm-reset:${tokenPrefix}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    // Validate token
    const validation = validateResetToken(token);
    if (!validation.valid || !validation.email) {
      return NextResponse.json(
        { error: validation.error || "Lien invalide ou expire." },
        { status: 400 }
      );
    }

    const email = validation.email;

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password in database
    if (IS_DEV) {
      const { devStore } = await import("@/lib/dev/dev-store");
      const user = devStore.findByEmail(email);
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur introuvable." },
          { status: 404 }
        );
      }
      devStore.update(user.id, { passwordHash });
    } else {
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.user.update({
          where: { email },
          data: { passwordHash },
        });
      } catch {
        return NextResponse.json(
          { error: "Erreur lors de la mise a jour du mot de passe." },
          { status: 500 }
        );
      }
    }

    // Consume token so it cannot be reused
    consumeResetToken(token);

    return NextResponse.json({
      success: true,
      message: "Mot de passe reinitialise avec succes.",
    });
  } catch (error) {
    console.error("[CONFIRM PASSWORD RESET]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
