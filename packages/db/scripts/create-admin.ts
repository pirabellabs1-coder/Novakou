/**
 * Bootstrap secure admin account.
 *
 * Usage:
 *   pnpm --filter=db tsx scripts/create-admin.ts
 *
 * Env vars (optional):
 *   ADMIN_EMAIL      Email to use (default: admin@novakou.com)
 *   ADMIN_PASSWORD   Password to set (default: auto-generated)
 *   ADMIN_NAME       Display name (default: "Admin Novakou")
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateStrongPassword(): string {
  // 24 chars, includes uppercase, lowercase, digits, special — satisfies all policies
  const upper = "ABCDEFGHIJKLMNPQRSTUVWXYZ"; // excluded O
  const lower = "abcdefghijkmnopqrstuvwxyz"; // excluded l
  const digits = "23456789"; // excluded 0, 1
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  const bytes = crypto.randomBytes(24);
  let out = "";
  // Guarantee one of each class first
  out += upper[bytes[0] % upper.length];
  out += lower[bytes[1] % lower.length];
  out += digits[bytes[2] % digits.length];
  out += special[bytes[3] % special.length];
  for (let i = 4; i < 24; i++) {
    out += all[bytes[i] % all.length];
  }
  // Shuffle
  return out
    .split("")
    .sort(() => (crypto.randomBytes(1)[0] > 127 ? 1 : -1))
    .join("");
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@novakou.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || generateStrongPassword();
  const name = process.env.ADMIN_NAME || "Admin Novakou";

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  CRÉATION DU COMPTE ADMINISTRATEUR FREELANCEHIGH");
  console.log("══════════════════════════════════════════════════════════════\n");

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      status: "ACTIF",
      passwordHash,
      name,
      emailVerified: new Date(),
    },
    create: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      status: "ACTIF",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Compte admin prêt :\n");
  console.log(`   Email     : ${admin.email}`);
  console.log(`   Mot de passe : ${password}`);
  console.log(`   ID        : ${admin.id}`);
  console.log(`   Rôle      : ${admin.role}`);
  console.log(`   Nom       : ${admin.name}`);
  console.log("\n──────────────────────────────────────────────────────────────");
  console.log("  🔒 COPIEZ CES IDENTIFIANTS EN LIEU SÛR.");
  console.log("  Ils ne seront plus affichés après ce message.");
  console.log("──────────────────────────────────────────────────────────────");
  console.log("\nAccès admin :");
  console.log("  • /formations/connexion (se connecter)");
  console.log("  • /admin (dashboard admin général)");
  console.log("  • /admin/dashboard (admin formations)\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ Erreur lors de la création de l'admin :", err);
  process.exit(1);
});
