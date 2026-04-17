// ═════════════════════════════════════════════════════════════════════════
// E2E VERIFICATION — checks APIs return correct data after seed-test-live
// ═════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const VENDOR_EMAIL = "pirabellabs1@gmail.com";
const BUYER_EMAIL = "apprenant.test@freelancehigh.local";
const MENTOR_EMAIL = "mentor.test@freelancehigh.local";
const FORMATION_SLUG = "mega-formation-freelance-test-live";

function ok(label: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
  return cond;
}

async function main() {
  console.log("\n🔍 VERIFICATION E2E\n" + "═".repeat(60));

  const [vendor, buyer, mentor] = await Promise.all([
    prisma.user.findUnique({ where: { email: VENDOR_EMAIL }, include: { instructeurProfile: true } }),
    prisma.user.findUnique({ where: { email: BUYER_EMAIL } }),
    prisma.user.findUnique({ where: { email: MENTOR_EMAIL }, include: { mentorProfile: true } }),
  ]);

  if (!vendor || !buyer || !mentor) {
    console.error("❌ Comptes manquants, lance d'abord scripts/seed-test-live.ts");
    process.exit(1);
  }

  // ── A. VENDEUR ──────────────────────────────────────────────────────────
  console.log("\n━━━ VENDEUR (pirabellabs1@gmail.com) ━━━");
  const formation = await prisma.formation.findUnique({
    where: { slug: FORMATION_SLUG },
    include: {
      enrollments: true,
      _count: { select: { enrollments: true, sections: true } },
    },
  });
  ok("Formation publiée", formation?.status === "ACTIF", `status=${formation?.status}`);
  ok("Formation appartient au vendeur", formation?.instructeurId === vendor.instructeurProfile?.id);
  ok("Formation a >=1 section", (formation?._count.sections ?? 0) >= 1, `${formation?._count.sections} section(s)`);
  ok("Formation a >=1 enrollment", (formation?._count.enrollments ?? 0) >= 1, `${formation?._count.enrollments} enrollment(s)`);
  ok("studentsCount incrémenté", (formation?.studentsCount ?? 0) >= 1, `studentsCount=${formation?.studentsCount}`);

  const vendorRevenue = await prisma.platformRevenue.findMany({
    where: { orderType: "formation", orderId: { in: formation?.enrollments.map((e) => e.id) ?? [] } },
  });
  ok(
    "PlatformRevenue loggé pour formation",
    vendorRevenue.length > 0,
    `${vendorRevenue.length} entrée(s), vendorAmount=${vendorRevenue.reduce((s, r) => s + r.vendorAmount, 0)} FCFA`,
  );

  // Simulate what vendor dashboard API returns
  const vendorDashboardData = {
    totalRevenue: vendorRevenue.reduce((s, r) => s + r.grossAmount, 0),
    netRevenue: vendorRevenue.reduce((s, r) => s + r.vendorAmount, 0),
    totalStudents: formation?._count.enrollments ?? 0,
    totalProducts: await prisma.formation.count({ where: { instructeurId: vendor.instructeurProfile?.id } }),
  };
  console.log(
    `   → dashboard KPI : revenue=${vendorDashboardData.totalRevenue} net=${vendorDashboardData.netRevenue} students=${vendorDashboardData.totalStudents} products=${vendorDashboardData.totalProducts}`,
  );

  // ── B. ACHETEUR/APPRENANT ───────────────────────────────────────────────
  console.log("\n━━━ ACHETEUR/APPRENANT (apprenant.test@freelancehigh.local) ━━━");
  const buyerEnrollments = await prisma.enrollment.findMany({
    where: { userId: buyer.id },
    include: { formation: { select: { title: true, slug: true } } },
  });
  ok("Enrollment existe", buyerEnrollments.length >= 1, `${buyerEnrollments.length} enrollment(s)`);
  const targetEnrollment = buyerEnrollments.find((e) => e.formation.slug === FORMATION_SLUG);
  ok("Apprenant a accès à la formation test", !!targetEnrollment, `formation="${targetEnrollment?.formation.title}"`);
  ok("paidAmount > 0", (targetEnrollment?.paidAmount ?? 0) > 0, `paidAmount=${targetEnrollment?.paidAmount}`);

  const buyerBookings = await prisma.mentorBooking.findMany({
    where: { studentId: buyer.id },
    include: { mentor: { include: { user: { select: { email: true } } } } },
  });
  ok("Session mentor réservée", buyerBookings.length >= 1, `${buyerBookings.length} booking(s)`);
  const targetBooking = buyerBookings.find((b) => b.mentor.user.email === MENTOR_EMAIL);
  ok("Session avec Mentor Test", !!targetBooking, `scheduledAt=${targetBooking?.scheduledAt.toLocaleString("fr-FR")}`);
  ok("Statut CONFIRMED", targetBooking?.status === "CONFIRMED", `status=${targetBooking?.status}`);
  ok("meetingLink généré", !!targetBooking?.meetingLink, targetBooking?.meetingLink);

  // ── C. MENTOR ───────────────────────────────────────────────────────────
  console.log("\n━━━ MENTOR (mentor.test@freelancehigh.local) ━━━");
  const mentorProfile = mentor.mentorProfile!;
  const mentorAvailabilities = await prisma.mentorAvailability.findMany({ where: { mentorId: mentorProfile.id } });
  ok(
    "Disponibilités récurrentes définies",
    mentorAvailabilities.length >= 5,
    `${mentorAvailabilities.length} slot(s) hebdomadaires`,
  );

  const mentorBookings = await prisma.mentorBooking.findMany({
    where: { mentorId: mentorProfile.id },
    include: { student: { select: { email: true, name: true } } },
  });
  ok("Mentor a des bookings", mentorBookings.length >= 1, `${mentorBookings.length} booking(s)`);
  const mentorFromStudent = mentorBookings.find((b) => b.student.email === BUYER_EMAIL);
  ok("Mentor a Apprenant Test", !!mentorFromStudent, `student="${mentorFromStudent?.student.name}"`);

  const mentorRevenue = await prisma.platformRevenue.findMany({
    where: { orderType: "mentor", orderId: { in: mentorBookings.map((b) => b.id) } },
  });
  ok(
    "PlatformRevenue mentor loggé",
    mentorRevenue.length > 0,
    `${mentorRevenue.length} entrée(s), vendorAmount=${mentorRevenue.reduce((s, r) => s + r.vendorAmount, 0)} FCFA`,
  );

  // ── D. Admin finances ───────────────────────────────────────────────────
  console.log("\n━━━ ADMIN (commissions plateforme) ━━━");
  const allRevenue = await prisma.platformRevenue.findMany({
    where: { orderId: { in: [...(formation?.enrollments.map((e) => e.id) ?? []), ...mentorBookings.map((b) => b.id)] } },
  });
  const totalCommission = allRevenue.reduce((s, r) => s + r.commissionAmount, 0);
  console.log(`   → ${allRevenue.length} transaction(s), commission totale : ${totalCommission} FCFA`);

  console.log("\n" + "═".repeat(60));
  console.log("✅ VERIFICATION TERMINÉE");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ VERIFY FAILED :", err);
  process.exit(1);
});
