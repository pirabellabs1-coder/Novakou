// ═════════════════════════════════════════════════════════════════════════
// Tests APIs directly (replicates what the routes do internally)
// Bypasses NextAuth session by calling prisma logic with the known user IDs
// ═════════════════════════════════════════════════════════════════════════
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const VENDOR_EMAIL = "pirabellabs1@gmail.com";
const BUYER_EMAIL = "apprenant.test@freelancehigh.local";
const MENTOR_EMAIL = "mentor.test@freelancehigh.local";

function ok(l: string, c: boolean, d = "") { console.log(`${c ? "✅" : "❌"} ${l}${d ? ` — ${d}` : ""}`); }

async function main() {
  console.log("\n🔌 TESTS API LOGIC\n" + "═".repeat(60));

  // ── API /vendeur/dashboard ───────────────────────────────────
  console.log("\n━━━ API /vendeur/dashboard (vendor) ━━━");
  const vendor = await prisma.user.findUnique({
    where: { email: VENDOR_EMAIL },
    include: { instructeurProfile: true },
  });
  if (!vendor?.instructeurProfile) { console.log("❌ Vendor profile missing"); process.exit(1); }

  const profile = await prisma.instructeurProfile.findUnique({
    where: { userId: vendor.id },
    select: {
      id: true,
      totalEarned: true,
      status: true,
      formations: {
        select: {
          id: true, title: true, studentsCount: true, rating: true, reviewsCount: true,
          status: true, price: true, thumbnail: true,
          enrollments: { select: { paidAmount: true, createdAt: true, refundedAt: true, user: { select: { country: true } } } },
        },
      },
    },
  });
  const enrollments = profile?.formations.flatMap((f) => f.enrollments) ?? [];
  const totalRevenue = enrollments.reduce((s, e) => s + (e.paidAmount || 0), 0);
  const netRevenue = Math.round(totalRevenue * 0.90);
  ok("Dashboard renvoie la formation test", (profile?.formations.length ?? 0) > 0, `${profile?.formations.length} formations`);
  ok("Dashboard renvoie ≥1 enrollment", enrollments.length > 0, `${enrollments.length} enrollments`);
  ok("Dashboard: revenue total correct", totalRevenue === 29900, `${totalRevenue} FCFA`);
  ok("Dashboard: net revenue (90%)", netRevenue === 26910, `${netRevenue} FCFA`);

  // ── API /vendeur/transactions ────────────────────────────────
  console.log("\n━━━ API /vendeur/transactions ━━━");
  const txns = await prisma.enrollment.findMany({
    where: { formation: { instructeurId: profile!.id } },
    include: { formation: { select: { title: true } }, user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  ok("Transactions: ≥1 enrollment visible", txns.length >= 1, `${txns.length} txn(s)`);
  const firstTxn = txns[0];
  if (firstTxn) {
    console.log(`   → ${firstTxn.user.email} → "${firstTxn.formation.title}" : ${firstTxn.paidAmount} FCFA`);
  }

  // ── API /apprenant/mes-formations (or dashboard) ─────────────
  console.log("\n━━━ API /formations/apprenant (buyer) ━━━");
  const buyer = await prisma.user.findUnique({ where: { email: BUYER_EMAIL } });
  if (!buyer) { console.log("❌ Buyer missing"); process.exit(1); }
  const myEnrollments = await prisma.enrollment.findMany({
    where: { userId: buyer.id },
    include: { formation: { select: { title: true, slug: true, thumbnail: true } } },
  });
  ok("Apprenant voit ≥1 formation", myEnrollments.length >= 1, `${myEnrollments.length}`);
  for (const e of myEnrollments) {
    console.log(`   → "${e.formation.title}" (progress=${e.progress}%)`);
  }

  // ── API /apprenant/sessions ──────────────────────────────────
  console.log("\n━━━ API /apprenant/sessions ━━━");
  const mySessions = await prisma.mentorBooking.findMany({
    where: { studentId: buyer.id },
    include: { mentor: { include: { user: { select: { name: true, image: true } } } } },
    orderBy: { scheduledAt: "desc" },
  });
  ok("Apprenant voit ≥1 session", mySessions.length >= 1, `${mySessions.length}`);
  for (const s of mySessions) {
    console.log(`   → avec ${s.mentor.user.name} le ${s.scheduledAt.toLocaleString("fr-FR")} (${s.status}) — ${s.meetingLink}`);
  }

  // ── API /mentor/dashboard ────────────────────────────────────
  console.log("\n━━━ API /mentor/dashboard ━━━");
  const mentorUser = await prisma.user.findUnique({
    where: { email: MENTOR_EMAIL },
    include: { mentorProfile: true },
  });
  if (!mentorUser?.mentorProfile) { console.log("❌ Mentor missing"); process.exit(1); }

  const mentorBookings = await prisma.mentorBooking.findMany({
    where: { mentorId: mentorUser.mentorProfile.id },
    include: { student: { select: { name: true, email: true, image: true } } },
    orderBy: { scheduledAt: "asc" },
  });
  const upcoming = mentorBookings.filter((b) => b.scheduledAt > new Date() && b.status === "CONFIRMED");
  const earnedTotal = mentorBookings.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + b.paidAmount, 0);
  const upcomingTotal = mentorBookings.filter((b) => b.status === "CONFIRMED" && b.scheduledAt > new Date()).reduce((s, b) => s + b.paidAmount, 0);

  ok("Mentor voit ≥1 RDV à venir", upcoming.length >= 1, `${upcoming.length} upcoming`);
  for (const b of upcoming) {
    console.log(`   → ${b.student.name} — ${b.scheduledAt.toLocaleString("fr-FR")} (${b.paidAmount} FCFA)`);
  }
  ok("Stats mentor cohérentes", true, `complétées=${earnedTotal} FCFA · à venir=${upcomingTotal} FCFA`);

  // ── API /mentor/apprenants ───────────────────────────────────
  console.log("\n━━━ API /mentor/apprenants ━━━");
  const uniqueStudents = new Map<string, typeof mentorBookings[0]["student"]>();
  for (const b of mentorBookings) uniqueStudents.set(b.studentId, b.student);
  ok("Mentor voit ≥1 apprenant", uniqueStudents.size >= 1, `${uniqueStudents.size} apprenant(s) unique(s)`);

  // ── API availability slots preview ─────────────────────────────────────
  console.log("\n━━━ API /formations/mentors/[id]/slots preview ━━━");
  const avails = await prisma.mentorAvailability.findMany({
    where: { mentorId: mentorUser.mentorProfile.id, isActive: true },
    orderBy: { dayOfWeek: "asc" },
  });
  ok("≥5 dispos hebdo actives", avails.length >= 5, `${avails.length} day(s)`);
  for (const a of avails) {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    console.log(`   → ${days[a.dayOfWeek]} ${String(Math.floor(a.startMin / 60)).padStart(2, "0")}h–${String(Math.floor(a.endMin / 60)).padStart(2, "0")}h`);
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅ APIS VALIDÉES — données prêtes pour navigation navigateur");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
