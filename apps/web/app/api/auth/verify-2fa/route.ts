import { NextResponse } from "next/server";
import { verifySync } from "otplib";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { getClientInfoFromContext } from "@/lib/auth/client-info";
import { notifyLoginSuccess } from "@/lib/auth/notify-login";

/**
 * POST /api/auth/verify-2fa — verify the user's TOTP code during login.
 *
 * Session-based : the user must already have a NextAuth session with
 * `tfaPending === true` (set by the authorize()/signIn callbacks when the
 * user's account has 2FA enabled). On success, we fire the login-alert
 * email and return `{ success: true }`. The client then calls the
 * `useSession().update({ tfaVerified: true })` which triggers the jwt
 * callback to clear `tfaPending`, after which the middleware lets them
 * through to the dashboard.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié — reconnectez-vous." },
        { status: 401 }
      );
    }

    const { code } = (await request.json()) as { code?: string };
    if (!code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const email = session.user.email;
    const userId = session.user.id;

    // Rate limit sur l'email (6 tentatives / 15 min).
    const rateLimitResult = checkRateLimit(`2fa:${email}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Code invalide. Entrez un code à 6 chiffres." },
        { status: 400 }
      );
    }

    // Récupérer le secret 2FA de l'utilisateur
    let storedSecret: string | null = null;
    let storedName: string | null = session.user.name ?? null;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      const user = devStore.findByEmail(email);
      storedSecret =
        (user as unknown as Record<string, unknown>)?.twoFactorSecret as string | null;
      storedName = (user as unknown as Record<string, unknown>)?.name as string | null;
    } else {
      try {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            twoFactorSecret: true,
            twoFactorEnabled: true,
          },
        });
        if (!user?.twoFactorEnabled) {
          return NextResponse.json(
            { error: "2FA non activée pour ce compte." },
            { status: 400 }
          );
        }
        storedSecret = user?.twoFactorSecret ?? null;
        storedName = user?.name ?? storedName;
      } catch {
        return NextResponse.json(
          { error: "Erreur de base de données." },
          { status: 500 }
        );
      }
    }

    if (!storedSecret) {
      return NextResponse.json(
        { error: "2FA non configurée pour ce compte." },
        { status: 400 }
      );
    }

    const result = verifySync({ token: code, secret: storedSecret });
    if (!result.valid) {
      recordFailedAttempt(`2fa:${email}`);
      return NextResponse.json({ error: "Code 2FA incorrect." }, { status: 400 });
    }

    // Succès : fire l'email d'alerte + mise à jour lastLogin
    try {
      const info = await getClientInfoFromContext();
      await notifyLoginSuccess({
        userId,
        email,
        name: storedName,
        info,
        // Méthode inconnue ici (le provider a signé avant la 2FA) — on laisse générique.
        method: "credentials",
      });
    } catch (err) {
      console.error("[verify-2fa] notifyLoginSuccess failed:", err);
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error("[verify-2fa] unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
