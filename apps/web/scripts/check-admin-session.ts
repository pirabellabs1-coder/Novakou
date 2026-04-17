import { PrismaClient } from "@prisma/client";
async function main() {
  const p = new PrismaClient();
  const u = await p.user.findUnique({ where: { email: "admin@novakou.com" }, select: { id: true, email: true, role: true, formationsRole: true } });
  console.log(u);
  await p.$disconnect();
}
main();
