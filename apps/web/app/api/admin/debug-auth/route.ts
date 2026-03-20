import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    // Verify admin token
    const validToken = process.env.ADMIN_ACCESS_TOKEN;
    if (!validToken || !token) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }
    const tokenBuffer = Buffer.from(token);
    const validBuffer = Buffer.from(validToken);
    if (tokenBuffer.length !== validBuffer.length || !crypto.timingSafeEqual(tokenBuffer, validBuffer)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check env vars
    const envInfo = {
      ADMIN_EMAIL: adminEmail ? `${adminEmail} (len=${adminEmail.length})` : "NOT SET",
      ADMIN_PASSWORD: adminPassword ? `len=${adminPassword.length}, first3=${adminPassword.slice(0, 3)}, last3=${adminPassword.slice(-3)}` : "NOT SET",
      DEV_MODE: process.env.DEV_MODE,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Check DB user
    let dbInfo: Record<string, unknown> = {};
    try {
      const { prisma } = await import("@freelancehigh/db");
      const user = await prisma.user.findUnique({
        where: { email: adminEmail || "" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          plan: true,
          kyc: true,
          passwordHash: true,
        },
      });

      if (user) {
        // Test password comparison
        const passwordMatch = adminPassword ? await bcrypt.compare(adminPassword, user.passwordHash) : false;

        dbInfo = {
          found: true,
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          plan: user.plan,
          kyc: user.kyc,
          hashPrefix: user.passwordHash.slice(0, 20) + "...",
          passwordMatch,
        };
      } else {
        dbInfo = { found: false };
      }
    } catch (err) {
      dbInfo = { error: err instanceof Error ? err.message : "unknown" };
    }

    return NextResponse.json({ envInfo, dbInfo });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
