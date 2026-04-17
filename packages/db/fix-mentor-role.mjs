import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const u = await prisma.user.update({
  where: { email: "mentor.test@freelancehigh.local" },
  data: { formationsRole: "mentor" },
});
console.log("Updated:", u.email, "→", u.formationsRole);
process.exit(0);
