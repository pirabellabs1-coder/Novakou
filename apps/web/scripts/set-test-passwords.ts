// Sets a known password for all test accounts so user can login in the browser
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const TEST_PASSWORD = "TestE2E2026!";
const EMAILS = [
  "pirabellabs1@gmail.com",   // VENDOR (INSTRUCTOR)
  "apprenant.test@freelancehigh.local",  // BUYER/APPRENANT
  "mentor.test@freelancehigh.local",     // MENTOR
];

async function main() {
  const hash = await bcrypt.hash(TEST_PASSWORD, 10);
  for (const email of EMAILS) {
    const r = await prisma.user.updateMany({
      where: { email },
      data: { passwordHash: hash, emailVerified: new Date() },
    });
    console.log(`${r.count > 0 ? "✓" : "✗"} ${email}`);
  }
  console.log(`\n🔑 Mot de passe pour tous les comptes : ${TEST_PASSWORD}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
