import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@novakou.com";
  const testPassword = "QYKddGNGon5KcFS0It!9";

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      passwordHash: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) { console.log("❌ User pas trouvé"); return; }

  console.log(`\n  User: ${user.email}`);
  console.log(`  ID: ${user.id}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  Status: ${user.status}`);
  console.log(`  2FA enabled: ${user.twoFactorEnabled}`);
  console.log(`  Hash prefix: ${user.passwordHash?.slice(0, 20)}...`);

  const valid = await bcrypt.compare(testPassword, user.passwordHash ?? "");
  console.log(`\n  Test password '${testPassword}' vs DB hash:`);
  console.log(`  → ${valid ? "✅ VALID" : "❌ INVALID"}\n`);

  // Test with a few variants in case
  const variants = [
    "QYKddGNGon5KcFS0It!9",
    "qykddgngon5kcfs0it!9",
    "QYKddGNGon5KcFS0It!9 ", // trailing space
    "FH@dmin2026!Secure#",   // the vercel one
  ];
  for (const v of variants) {
    const ok = await bcrypt.compare(v, user.passwordHash ?? "");
    console.log(`  '${v}' → ${ok ? "✓" : "✗"}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
