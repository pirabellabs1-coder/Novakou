import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
  name: z.string().min(2, "Le nom est requis"),
  role: z.enum(["freelance", "client", "agence"]),
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

    const { email, password, name, role } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    // ── MODE DEV : stockage dans le fichier JSON local ────────────────
    if (IS_DEV_MODE) {
      const { devStore } = await import("@/lib/dev/dev-store");

      const existing = devStore.findByEmail(email);
      if (existing) {
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
      });

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      }, { status: 201 });
    }

    // ── MODE PRODUCTION : stockage via Prisma / Supabase ──────────────
    const { prisma } = await import("@freelancehigh/db");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un compte avec cet email existe deja" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role.toUpperCase() as "FREELANCE" | "CLIENT" | "AGENCE",
        plan: "GRATUIT",
        kyc: 1,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role.toLowerCase() },
    }, { status: 201 });

  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
