import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/api-rate-limit";
import { storeOTP, verifyOTP } from "@/lib/auth/otp";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";

const IS_DEV_MODE = process.env.DEV_MODE === "true";

const sendSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().optional(),
});

const verifySchema = z.object({
  email: z.string().email("Email invalide"),
  code: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

// POST — Send or resend verification code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email, name } = parsed.data;

    // Rate limit (auth rate-limiter): 5 attempts per 15 min per email
    const rateLimitKey = `verify-email:${email}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez patienter avant de reessayer." },
        { status: 429 }
      );
    }
    recordFailedAttempt(rateLimitKey);

    // Rate limit: 3 req/min per email
    const rl = rateLimit(`verify-send:${email.toLowerCase()}`, 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes. Veuillez patienter avant de renvoyer un code." },
        { status: 429 }
      );
    }

    const code = storeOTP(email);
    await sendVerificationEmail(email, name || "Utilisateur", code);

    return NextResponse.json({
      success: true,
      message: "Code envoye",
    });
  } catch (err) {
    console.error("[VERIFY-EMAIL:SEND]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT — Verify the code
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email, code } = parsed.data;

    // Rate limit: 5 req/min per email
    const rl = rateLimit(`verify-check:${email.toLowerCase()}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez patienter." },
        { status: 429 }
      );
    }

    const result = verifyOTP(email, code);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error, verified: false },
        { status: 400 }
      );
    }

    // Mark email as verified
    if (IS_DEV_MODE) {
      const { devStore } = await import("@/lib/dev/dev-store");
      const user = devStore.findByEmail(email);
      if (user) {
        devStore.update(user.id, { emailVerified: new Date().toISOString() } as Record<string, unknown>);
      }
    } else {
      const { prisma } = await import("@freelancehigh/db");
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (err) {
    console.error("[VERIFY-EMAIL:VERIFY]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
