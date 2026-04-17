/**
 * Generate secure admin credentials + unique login slug.
 * Usage: pnpm --filter=db tsx scripts/secure-admin.ts
 *
 * - Creates/updates admin@novakou.com with a strong random password
 * - Generates a unique random slug for the admin login URL
 * - Prints everything needed to update .env.local and Vercel
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// Generate a strong random password: 20 chars, alphanumeric + symbols
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
  const lower = "abcdefghijkmnpqrstuvwxyz"; // no l, o
  const digits = "23456789"; // no 0, 1
  const symbols = "!@#$%&*-_+";
  const all = upper + lower + digits + symbols;

  const bytes = randomBytes(20);
  let pwd = "";
  // Guarantee at least one of each class
  pwd += upper[bytes[0] % upper.length];
  pwd += lower[bytes[1] % lower.length];
  pwd += digits[bytes[2] % digits.length];
  pwd += symbols[bytes[3] % symbols.length];
  for (let i = 4; i < 20; i++) {
    pwd += all[bytes[i] % all.length];
  }
  // Shuffle
  return pwd.split("").sort(() => (randomBytes(1)[0] > 127 ? 1 : -1)).join("");
}

// Generate unique slug: 3 blocks of random alphanumeric separated by "-"
function generateSlug(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(18);
  const parts: string[] = [];
  for (let p = 0; p < 3; p++) {
    let s = "";
    for (let i = 0; i < 6; i++) {
      s += chars[bytes[p * 6 + i] % chars.length];
    }
    parts.push(s);
  }
  return parts.join("-");
}

async function main() {
  const email = "admin@novakou.com";
  const password = generatePassword();
  const slug = generateSlug();

  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("  GÉNÉRATION IDENTIFIANTS SÉCURISÉS — ADMIN FREELANCEHIGH");
  console.log("════════════════════════════════════════════════════════════════\n");

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIF",
      emailVerified: new Date(),
      twoFactorEnabled: false,
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

  console.log("  ✅ Compte admin mis à jour dans la base\n");
  console.log("  ┌─────────────────────────────────────────────────────────────");
  console.log("  │  URL DE CONNEXION (secret — ne jamais partager publiquement)");
  console.log("  ├─────────────────────────────────────────────────────────────");
  console.log(`  │  Local : http://localhost:3000/backoffice/${slug}/connexion`);
  console.log(`  │  Prod  : https://novakou.com/backoffice/${slug}/connexion`);
  console.log("  └─────────────────────────────────────────────────────────────\n");
  console.log("  ┌─────────────────────────────────────────────────────────────");
  console.log("  │  IDENTIFIANTS");
  console.log("  ├─────────────────────────────────────────────────────────────");
  console.log(`  │  Email       : ${admin.email}`);
  console.log(`  │  Mot de passe: ${password}`);
  console.log(`  │  Rôle        : ${admin.role}`);
  console.log(`  │  2FA         : désactivé (à activer après 1ère connexion)`);
  console.log("  └─────────────────────────────────────────────────────────────\n");
  console.log("  ┌─────────────────────────────────────────────────────────────");
  console.log("  │  VARIABLE D'ENVIRONNEMENT À METTRE DANS .env.local + VERCEL");
  console.log("  ├─────────────────────────────────────────────────────────────");
  console.log(`  │  ADMIN_LOGIN_SLUG=${slug}`);
  console.log("  └─────────────────────────────────────────────────────────────\n");
  console.log("  ⚠️  CONSERVEZ CES INFOS DANS UN GESTIONNAIRE DE MOTS DE PASSE");
  console.log("     (1Password, Bitwarden, KeePass, etc.) — elles ne seront");
  console.log("     PLUS affichées.\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
