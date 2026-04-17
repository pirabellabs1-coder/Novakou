import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "apprenant.test@freelancehigh.local";
const passwordHash = await bcrypt.hash("ApprenantPass2026!", 10);

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      formationsRole: "apprenant",
      emailVerified: new Date(),
      status: "ACTIF",
      name: "Apprenant Test",
    },
  });
  console.log("Updated existing apprenant:", email);
} else {
  const u = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Apprenant Test",
      role: "CLIENT",
      formationsRole: "apprenant",
      status: "ACTIF",
      plan: "GRATUIT",
      kyc: 2,
      emailVerified: new Date(),
    },
  });
  console.log("Created apprenant:", u.email, "id:", u.id);
}
process.exit(0);
