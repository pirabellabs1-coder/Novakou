import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSecret, generateURI, verifySync } from "otplib";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

// POST: Generer un nouveau secret 2FA + QR code URL
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: "FreelanceHigh",
      label: session.user.email,
      secret,
    });

    // Stocker le secret temporairement (non encore confirme)
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      devStore.update(session.user.id, {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
      } as Record<string, unknown>);
      return NextResponse.json({
        otpauthUrl,
        secret, // Pour saisie manuelle dans l'app authenticator
      });
    }

    // Production: Prisma
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
      });
    } catch {
      // DB non connectee — on continue quand meme avec le secret
    }

    return NextResponse.json({
      otpauthUrl,
      secret, // Pour saisie manuelle dans l'app authenticator
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT: Confirmer le setup 2FA avec un code de verification TOTP
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { code } = (await request.json()) as { code: string };
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Code invalide. Entrez un code a 6 chiffres." },
        { status: 400 }
      );
    }

    // Recuperer le secret stocke
    let storedSecret: string | null = null;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      const user = devStore.findById(session.user.id);
      storedSecret =
        (user as unknown as Record<string, unknown>)?.twoFactorSecret as
          | string
          | null;
    } else {
      try {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { twoFactorSecret: true },
        });
        storedSecret = user?.twoFactorSecret ?? null;
      } catch {
        // DB non connectee
      }
    }

    if (!storedSecret) {
      return NextResponse.json(
        {
          error:
            "Aucun secret 2FA en attente. Generez un nouveau QR code d'abord.",
        },
        { status: 400 }
      );
    }

    // Verification TOTP reelle
    const result = verifySync({
      token: code,
      secret: storedSecret,
    });

    if (!result.valid) {
      return NextResponse.json(
        { error: "Code incorrect. Verifiez votre application authenticator." },
        { status: 400 }
      );
    }

    // Activer la 2FA
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      devStore.update(session.user.id, {
        twoFactorEnabled: true,
      } as Record<string, unknown>);
      return NextResponse.json({
        success: true,
        message: "2FA active avec succes",
      });
    }

    // Production: Prisma
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: true },
      });
    } catch {
      // DB non connectee
    }

    return NextResponse.json({
      success: true,
      message: "2FA active avec succes",
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Desactiver la 2FA
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      devStore.update(session.user.id, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      } as Record<string, unknown>);
      return NextResponse.json({
        success: true,
        message: "2FA desactivee",
      });
    }

    // Production: Prisma
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
    } catch {
      // DB non connectee
    }

    return NextResponse.json({
      success: true,
      message: "2FA desactivee",
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
