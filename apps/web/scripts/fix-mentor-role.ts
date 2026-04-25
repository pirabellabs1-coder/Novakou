import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const u = await p.user.findUnique({
    where: { email: "mentor.test@freelancehigh.local" },
    select: { id: true, email: true, formationsRole: true, role: true, instructeurProfile: { select: { id: true } }, mentorProfile: { select: { id: true } } },
  });
  console.log("BEFORE:", JSON.stringify(u, null, 2));

  // Ensure formationsRole = "mentor" so that login redirects to /mentor/dashboard
  await p.user.update({
    where: { email: "mentor.test@freelancehigh.local" },
    data: { formationsRole: "mentor" },
  });
  const after = await p.user.findUnique({ where: { email: "mentor.test@freelancehigh.local" }, select: { formationsRole: true } });
  console.log("AFTER: formationsRole =", after?.formationsRole);

  await p.$disconnect();
}
main().catch(console.error);
