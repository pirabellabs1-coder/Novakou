import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const all = await p.mentorBooking.findMany({
    select: { id: true, status: true, escrowStatus: true, scheduledAt: true, paymentRef: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log(JSON.stringify(all, null, 2));
  await p.$disconnect();
}
main().catch(console.error);
