import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
async function main() {
  const p = new PrismaClient();
  const hash = await bcrypt.hash("TestE2E2026!", 10);
  const r = await p.user.updateMany({
    where: { email: "admin@novakou.com" },
    data: { passwordHash: hash, emailVerified: new Date() },
  });
  console.log("Admin password set (count=" + r.count + ")");
  await p.$disconnect();
}
main();
