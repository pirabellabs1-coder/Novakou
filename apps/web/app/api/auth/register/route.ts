import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { emitEvent } from "@/lib/events/dispatcher";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(10, "Le mot de passe doit contenir au moins 10 caracteres")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  name: z.string().min(2, "Le nom est requis"),
  role: z.enum(["freelance", "client", "agence"]).default("client"),
  country: z.string().max(100).optional(),
  formationsRole: z.enum(["apprenant", "instructeur"]).optional(),
});

const IS_DEV_MODE = process.env.DEV_MODE === "true";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email, password, name, role, country, formationsRole } = parsed.data;

    // Rate limit: 5 attempts per 15 min per email
    const rateLimitKey = `register:${email}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez patienter avant de reessayer." },
        { status: 429 }
      );
    }
    recordFailedAttempt(rateLimitKey);

    const passwordHash = await bcrypt.hash(password, 12);

    // ── MODE DEV : stockage dans le fichier JSON local ────────────────
    if (IS_DEV_MODE) {
      const { devStore } = await import("@/lib/dev/dev-store");

      const existing = devStore.findByEmail(email);
      if (existing) {
        // Si l'utilisateur existe et qu'un formationsRole est demande, on met a jour
        if (formationsRole) {
          devStore.update(existing.id, { formationsRole } as Record<string, unknown>);
          return NextResponse.json({
            success: true,
            user: { id: existing.id, email: existing.email, name: existing.name, role: existing.role },
          }, { status: 200 });
        }
        return NextResponse.json({ error: "Un compte avec cet email existe deja" }, { status: 409 });
      }

      const user = devStore.create({
        email,
        passwordHash,
        name,
        role,
        plan: "gratuit",
        kyc: 1,
        status: "ACTIF",
        ...(country ? { country } : {}),
        ...(formationsRole ? { formationsRole } : {}),
      });

      // Emit welcome + verification events
      emitEvent("system.welcome", {
        userId: user.id, userName: name, userEmail: email,
      }).catch((err) => console.error("[REGISTER] emitEvent welcome error:", err));

      try {
        const { storeOTP } = await import("@/lib/auth/otp");
        const code = await storeOTP(email);
        await emitEvent("system.email_verification", {
          userId: user.id, userName: name, userEmail: email, code,
        });
      } catch (err) {
        console.error("[REGISTER] Erreur envoi code verification:", err);
      }

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      }, { status: 201 });
    }

    // ── MODE PRODUCTION : stockage via Prisma / Supabase ──────────────
    const { prisma } = await import("@freelancehigh/db");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Si l'utilisateur existe et qu'un formationsRole est demande, on met a jour
      if (formationsRole) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { formationsRole },
        });
        return NextResponse.json({
          success: true,
          user: { id: existing.id, email: existing.email, name: existing.name, role: existing.role.toLowerCase() },
        }, { status: 200 });
      }
      return NextResponse.json({ error: "Un compte avec cet email existe deja" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role.toUpperCase() as "FREELANCE" | "CLIENT" | "AGENCE",
        plan: "GRATUIT",
        status: "ACTIF",
        kyc: 1,
        ...(country ? { country } : {}),
        ...(formationsRole ? { formationsRole } : {}),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Emit welcome + verification events
    emitEvent("system.welcome", {
      userId: user.id, userName: name, userEmail: email,
    }).catch((err) => console.error("[REGISTER] emitEvent welcome error:", err));

    try {
      const { storeOTP } = await import("@/lib/auth/otp");
      const code = await storeOTP(email);
      await emitEvent("system.email_verification", {
        userId: user.id, userName: name, userEmail: email, code,
      });
    } catch (err) {
      console.error("[REGISTER] Erreur envoi code verification:", err);
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role.toLowerCase() },
    }, { status: 201 });

  } catch (err) {
    console.error("[REGISTER]", err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail }, { status: 500 });
  }
}
