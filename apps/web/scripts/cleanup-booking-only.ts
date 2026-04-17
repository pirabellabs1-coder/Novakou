// Clean only the test mentor booking (keep formation + availabilities)
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const bookings = await p.mentorBooking.findMany({
    where: { student: { email: "apprenant.test@freelancehigh.local" } },
    select: { id: true, status: true },
  });
  console.log(`Found ${bookings.length} booking(s) to clean`);
  for (const b of bookings) {
    await p.platformRevenue.deleteMany({ where: { orderId: b.id, orderType: "mentor" } });
    await p.mentorBooking.delete({ where: { id: b.id } });
    console.log(`✓ Deleted booking ${b.id} (status was ${b.status})`);
  }
  console.log("Done");
  await p.$disconnect();
}
main().catch(console.error);
