/**
 * Reset the admin account password.
 * Usage: pnpm --filter=db tsx scripts/reset-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@novakou.com").toLowerCase();
  // Simple readable password: 4 blocks of 4 chars, easy to type, still strong
  const password = process.env.ADMIN_PASSWORD || "Admin-2026-Fh!K7pQ";

  console.log("\n══ RESET ADMIN ══\n");

  // Check if admin exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  Found existing user: ${existing.id} (role: ${existing.role})`);
  } else {
    console.log(`  No user found with email ${email} — will create`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIF",
      emailVerified: new Date(),
      twoFactorEnabled: false,  // Désactiver 2FA pour simplifier le login
      twoFactorSecret: null,
    },
    create: {
      email,
      name: "Admin Novakou",
      passwordHash,
      role: "ADMIN",
      status: "ACTIF",
      emailVerified: new Date(),
    },
  });

  console.log("\n✅ Admin prêt :\n");
  console.log(`   Email       : ${admin.email}`);
  console.log(`   Mot de passe : ${password}`);
  console.log(`   Role        : ${admin.role}`);
  console.log(`   Status      : ${admin.status}`);
  console.log(`   2FA         : désactivé`);
  console.log("\n");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
