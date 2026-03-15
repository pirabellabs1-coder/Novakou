import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/api-rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateResetToken } from "@/lib/auth/password-reset";
import { IS_DEV } from "@/lib/prisma";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // Rate limit (auth rate-limiter): 5 attempts per 15 min per email
    const rateLimitKey = `password-reset:${email}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez patienter avant de reessayer." },
        { status: 429 }
      );
    }
    recordFailedAttempt(rateLimitKey);

    // Rate limit: 3 requests per 15 min per email
    const rl = rateLimit(`reset:${email.toLowerCase()}`, 3, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    // Look up user name (don't reveal whether email exists)
    let userName = "Utilisateur";
    let userExists = false;

    if (IS_DEV) {
      const { devStore } = await import("@/lib/dev/dev-store");
      const user = devStore.findByEmail(email);
      if (user) {
        userName = user.name || "Utilisateur";
        userExists = true;
      }
    } else {
      try {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { name: true },
        });
        if (user) {
          userName = user.name || "Utilisateur";
          userExists = true;
        }
      } catch {
        // DB unavailable — proceed silently
      }
    }

    // Only send email if user exists (but always return success)
    if (userExists) {
      const token = generateResetToken(email);
      try {
        await sendPasswordResetEmail(email, userName, token);
      } catch (err) {
        console.error("[PASSWORD RESET] Email send error:", err);
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }
    console.error("[PASSWORD RESET REQUEST]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
