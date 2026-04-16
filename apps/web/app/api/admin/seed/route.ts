import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * POST /api/admin/seed
 * Cree ou met a jour le compte admin dans la base de donnees.
 * Protege par ADMIN_ACCESS_TOKEN — usage unique au deploiement.
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    const validToken = process.env.ADMIN_ACCESS_TOKEN;
    if (!validToken || !token) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const tokenBuffer = Buffer.from(token);
    const validBuffer = Buffer.from(validToken);
    if (tokenBuffer.length !== validBuffer.length || !crypto.timingSafeEqual(tokenBuffer, validBuffer)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD?.trim();

    if (!email || !password) {
      return NextResponse.json({ error: "ADMIN_EMAIL ou ADMIN_PASSWORD non defini" }, { status: 500 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Try Prisma first
    try {
      const { prisma } = await import("@freelancehigh/db");

      // Clean up any existing admin with trailing whitespace in email
      const existingDirty = await prisma.user.findFirst({
        where: { email: { startsWith: email } },
      });
      if (existingDirty && existingDirty.email !== email) {
        await prisma.user.update({
          where: { id: existingDirty.id },
          data: { email },
        });
      }

      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        // Update existing admin
        await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            role: "ADMIN",
            kyc: 4,
            plan: "BUSINESS",
            status: "ACTIF",
            name: "Admin FreelanceHigh",
          },
        });
        return NextResponse.json({ ok: true, message: "Admin mis a jour", id: existing.id });
      } else {
        // Create admin
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            name: "Admin FreelanceHigh",
            role: "ADMIN",
            kyc: 4,
            plan: "BUSINESS",
            status: "ACTIF",
            emailVerified: new Date(),
          },
        });
        return NextResponse.json({ ok: true, message: "Admin cree", id: user.id });
      }
    } catch (dbError) {
      console.error("[ADMIN SEED] Erreur Prisma:", dbError);
      return NextResponse.json({
        error: "Erreur base de donnees",
        details: dbError instanceof Error ? dbError.message : "unknown"
      }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
