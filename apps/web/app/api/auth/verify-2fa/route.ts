import { NextResponse } from "next/server";
import { verifySync } from "otplib";
import crypto from "crypto";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";

const IS_DEV_MODE = process.env.DEV_MODE === "true";

// POST: Verifier le code 2FA lors du login
export async function POST(request: Request) {
  try {
    const { email, code } = (await request.json()) as {
      email: string;
      code: string;
    };

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email et code requis" },
        { status: 400 }
      );
    }

    // Rate limiting sur les tentatives 2FA
    const rateLimitResult = checkRateLimit(`2fa:${email}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Code invalide. Entrez un code a 6 chiffres." },
        { status: 400 }
      );
    }

    // Recuperer le secret 2FA de l'utilisateur
    let storedSecret: string | null = null;

    if (IS_DEV_MODE) {
      const { devStore } = await import("@/lib/dev/dev-store");
      const user = devStore.findByEmail(email);
      storedSecret =
        (user as unknown as Record<string, unknown>)?.twoFactorSecret as
          | string
          | null;
    } else {
      try {
        const { prisma } = await import("@freelancehigh/db");
        const user = await prisma.user.findUnique({
          where: { email },
          select: { twoFactorSecret: true, twoFactorEnabled: true },
        });
        if (!user?.twoFactorEnabled) {
          return NextResponse.json(
            { error: "2FA non activee pour ce compte" },
            { status: 400 }
          );
        }
        storedSecret = user?.twoFactorSecret ?? null;
      } catch {
        return NextResponse.json(
          { error: "Erreur de base de donnees" },
          { status: 500 }
        );
      }
    }

    if (!storedSecret) {
      return NextResponse.json(
        { error: "2FA non configuree pour ce compte" },
        { status: 400 }
      );
    }

    // Verification TOTP
    const result = verifySync({
      token: code,
      secret: storedSecret,
    });

    if (!result.valid) {
      recordFailedAttempt(`2fa:${email}`);
      return NextResponse.json(
        { error: "Code 2FA incorrect" },
        { status: 400 }
      );
    }

    // Generer un token HMAC signe cote serveur pour prouver la verification 2FA
    const twoFactorToken = crypto
      .createHmac("sha256", process.env.NEXTAUTH_SECRET || "fallback-secret")
      .update(`${email}:${Date.now().toString().slice(0, -4)}`)
      .digest("hex");

    return NextResponse.json({
      success: true,
      verified: true,
      twoFactorToken,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
