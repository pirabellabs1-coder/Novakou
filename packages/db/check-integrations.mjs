import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const rows = await prisma.vendorIntegration.findMany({
  include: { instructeur: { select: { userId: true, user: { select: { email: true } } } } },
});
console.log(`Found ${rows.length} integration(s):`);
rows.forEach((r) => {
  console.log(
    `  - ${r.provider} | connected=${r.connected} | apiKey=${r.apiKey ? "[SET]" : "null"} | webhookUrl=${r.webhookUrl ?? "null"} | user=${r.instructeur.user?.email}`,
  );
});
process.exit(0);
