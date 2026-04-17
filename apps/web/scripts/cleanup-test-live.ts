// Cleanup: supprime la formation test + booking + availabilities créés par seed-test-live.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const FORMATION_SLUG = "mega-formation-freelance-test-live";
const MENTOR_EMAIL = "mentor.test@freelancehigh.local";
const BUYER_EMAIL = "apprenant.test@freelancehigh.local";

async function main() {
  console.log("\n🧹 Nettoyage données test…\n");

  const formation = await prisma.formation.findUnique({
    where: { slug: FORMATION_SLUG },
    include: { enrollments: true },
  });
  if (formation) {
    // delete platformRevenue for the formation enrollments
    const enrollmentIds = formation.enrollments.map((e) => e.id);
    if (enrollmentIds.length) {
      const r = await prisma.platformRevenue.deleteMany({
        where: { orderId: { in: enrollmentIds }, orderType: "formation" },
      });
      console.log(`✓ ${r.count} PlatformRevenue(s) formation supprimés`);
    }
    // Cascade delete formation → sections → lessons → enrollments
    await prisma.formation.delete({ where: { id: formation.id } });
    console.log(`✓ Formation "${formation.title}" supprimée (cascade)`);
  } else {
    console.log("✓ Aucune formation test à supprimer");
  }

  // Clean mentor bookings + availabilities + platformRevenue
  const mentor = await prisma.user.findUnique({
    where: { email: MENTOR_EMAIL },
    include: { mentorProfile: true },
  });
  if (mentor?.mentorProfile) {
    const bookings = await prisma.mentorBooking.findMany({
      where: { mentorId: mentor.mentorProfile.id },
    });
    if (bookings.length) {
      await prisma.platformRevenue.deleteMany({
        where: { orderId: { in: bookings.map((b) => b.id) }, orderType: "mentor" },
      });
      await prisma.mentorBooking.deleteMany({
        where: { mentorId: mentor.mentorProfile.id },
      });
      console.log(`✓ ${bookings.length} MentorBooking(s) supprimés`);
    }
    const avails = await prisma.mentorAvailability.deleteMany({
      where: { mentorId: mentor.mentorProfile.id },
    });
    console.log(`✓ ${avails.count} MentorAvailability supprimées`);
    // Reset totalSessions
    await prisma.mentorProfile.update({
      where: { id: mentor.mentorProfile.id },
      data: { totalSessions: 0, totalStudents: 0 },
    });
    console.log(`✓ Stats mentor reset`);
  }

  console.log("\n✅ Nettoyage terminé — DB prête pour test live interactif\n");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
