// ═════════════════════════════════════════════════════════════════════════
// SEED LIVE TEST — E2E production-like scenario
// ═════════════════════════════════════════════════════════════════════════
// 1. Creates a published formation (sold by pirabellabs1 / Lissanon Sylvain)
// 2. Enrollment = Apprenant Test buys this formation
// 3. MentorAvailability + Booking = Apprenant Test books a session with Mentor Test
// ═════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const VENDOR_EMAIL = "pirabellabs1@gmail.com";
const BUYER_EMAIL = "apprenant.test@freelancehigh.local";
const MENTOR_EMAIL = "mentor.test@freelancehigh.local";

async function main() {
  console.log("\n🚀 Seeding test data…\n");

  // ── 1. Find users ────────────────────────────────────────────────────────
  const vendor = await prisma.user.findUnique({
    where: { email: VENDOR_EMAIL },
    include: { instructeurProfile: true },
  });
  if (!vendor) throw new Error(`Vendor ${VENDOR_EMAIL} not found`);
  if (!vendor.instructeurProfile) throw new Error(`Vendor has no InstructeurProfile`);

  const buyer = await prisma.user.findUnique({ where: { email: BUYER_EMAIL } });
  if (!buyer) throw new Error(`Buyer ${BUYER_EMAIL} not found`);

  const mentorUser = await prisma.user.findUnique({
    where: { email: MENTOR_EMAIL },
    include: { mentorProfile: true },
  });
  if (!mentorUser) throw new Error(`Mentor ${MENTOR_EMAIL} not found`);
  if (!mentorUser.mentorProfile) throw new Error(`Mentor has no MentorProfile`);

  console.log(`✓ Vendor      : ${vendor.email} (instructorId=${vendor.instructeurProfile.id})`);
  console.log(`✓ Buyer       : ${buyer.email} (id=${buyer.id})`);
  console.log(`✓ Mentor      : ${mentorUser.email} (mentorId=${mentorUser.mentorProfile.id})`);

  // ── 2. Use an existing category ──────────────────────────────────────────
  const category = await prisma.formationCategory.findFirst({
    where: { slug: "business-freelancing" },
  });
  if (!category) throw new Error("Category 'business-freelancing' not found");

  // ── 3. Create formation (or re-use existing test one) ────────────────────
  const slug = "mega-formation-freelance-test-live";
  let formation = await prisma.formation.findUnique({ where: { slug } });
  if (formation) {
    console.log(`✓ Formation existante trouvée : ${formation.id}`);
  } else {
    formation = await prisma.formation.create({
      data: {
        slug,
        title: "Mega Formation Freelance — Test Live",
        shortDesc: "Devenez freelance en 30 jours avec un plan d'action concret et personnalisé.",
        description:
          "Cette formation complète vous guide étape par étape pour lancer votre activité de freelance en 30 jours. Vous apprendrez à trouver vos premiers clients, fixer vos tarifs, gérer votre administratif et vous positionner comme expert dans votre niche.",
        learnPoints: [
          "Définir votre positionnement et votre niche",
          "Trouver vos 3 premiers clients en 30 jours",
          "Construire votre portfolio et votre marque personnelle",
          "Maîtriser les aspects juridiques et fiscaux",
        ],
        requirements: ["Aucun prérequis technique", "Un ordinateur et une connexion internet"],
        targetAudience: "Entrepreneurs débutants, salariés en reconversion, étudiants en fin de cursus",
        locale: "fr",
        categoryId: category.id,
        instructeurId: vendor.instructeurProfile.id,
        thumbnail:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
        level: "DEBUTANT",
        language: ["fr"],
        duration: 480, // 8 heures
        price: 29900, // 29 900 FCFA (~45 €)
        originalPrice: 49900,
        isFree: false,
        hasCertificate: true,
        minScore: 80,
        status: "ACTIF",
        publishedAt: new Date(),
        studentsCount: 0,
        rating: 0,
        reviewsCount: 0,
        viewsCount: 0,
      },
    });
    console.log(`✓ Formation créée : ${formation.id}`);

    // Create 1 section + 2 lessons so the course is actually usable
    const section = await prisma.section.create({
      data: {
        formationId: formation.id,
        title: "Introduction — Votre stratégie freelance",
        order: 1,
      },
    });

    await prisma.lesson.createMany({
      data: [
        {
          sectionId: section.id,
          title: "Bienvenue dans la formation",
          type: "VIDEO",
          order: 1,
          duration: 300,
          content: "Présentation du parcours et des résultats à atteindre.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
        {
          sectionId: section.id,
          title: "Définir votre niche idéale",
          type: "VIDEO",
          order: 2,
          duration: 420,
          content: "Identifier le marché rentable où vous pouvez briller.",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ],
    });
    console.log(`✓ 1 section + 2 leçons créées`);
  }

  // ── 4. Enrollment (buyer purchases the formation) ────────────────────────
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_formationId: { userId: buyer.id, formationId: formation.id } },
  });

  let enrollment = existingEnrollment;
  if (enrollment) {
    console.log(`✓ Enrollment existant : ${enrollment.id}`);
  } else {
    enrollment = await prisma.enrollment.create({
      data: {
        userId: buyer.id,
        formationId: formation.id,
        progress: 0,
        paidAmount: formation.price,
      },
    });
    console.log(`✓ Enrollment créé : ${enrollment.id} (paidAmount=${formation.price} FCFA)`);

    // Update formation stats
    await prisma.formation.update({
      where: { id: formation.id },
      data: { studentsCount: { increment: 1 } },
    });

    // Log platform revenue (5% commission)
    const commissionRate = 0.05;
    const commissionAmount = Math.round(formation.price * commissionRate);
    const vendorAmount = formation.price - commissionAmount;
    await prisma.platformRevenue.create({
      data: {
        orderId: enrollment.id,
        orderType: "formation",
        grossAmount: formation.price,
        commissionRate,
        commissionAmount,
        vendorAmount,
        paymentRef: `test_live_${enrollment.id.slice(0, 8)}`,
      },
    });
    console.log(`✓ PlatformRevenue : gross=${formation.price} commission=${commissionAmount} vendor=${vendorAmount}`);
  }

  // ── 5. Mentor availability + slot ────────────────────────────────────────
  // Recurring weekly: Mon-Fri, 9:00 - 17:00
  const existingAvailabilities = await prisma.mentorAvailability.count({
    where: { mentorId: mentorUser.mentorProfile.id },
  });
  if (existingAvailabilities === 0) {
    for (let day = 1; day <= 5; day++) {
      await prisma.mentorAvailability.create({
        data: {
          mentorId: mentorUser.mentorProfile.id,
          dayOfWeek: day,
          startMin: 9 * 60,
          endMin: 17 * 60,
          isActive: true,
        },
      });
    }
    console.log(`✓ Disponibilités récurrentes Lun-Ven 9h-17h créées (5)`);
  } else {
    console.log(`✓ ${existingAvailabilities} disponibilités déjà présentes`);
  }

  // ── 6. MentorBooking (apprenant reserves a session) ──────────────────────
  // Slot: tomorrow at 14:00 for 60 minutes
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const existingBooking = await prisma.mentorBooking.findFirst({
    where: {
      mentorId: mentorUser.mentorProfile.id,
      studentId: buyer.id,
      scheduledAt: tomorrow,
    },
  });

  let booking = existingBooking;
  if (booking) {
    console.log(`✓ Booking existant : ${booking.id}`);
  } else {
    const meetingRoomId = `nk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    booking = await prisma.mentorBooking.create({
      data: {
        mentorId: mentorUser.mentorProfile.id,
        studentId: buyer.id,
        status: "CONFIRMED",
        scheduledAt: tomorrow,
        durationMinutes: 60,
        paidAmount: mentorUser.mentorProfile.sessionPrice,
        studentGoals:
          "Je voudrais être accompagné pour définir mon positionnement freelance et trouver mes premiers clients en développement web.",
        meetingLink: `https://meet.jit.si/${meetingRoomId}`,
        meetingRoomId,
      },
    });
    console.log(`✓ Booking créé : ${booking.id}`);
    console.log(`  → scheduledAt : ${tomorrow.toLocaleString("fr-FR")}`);
    console.log(`  → meetingLink : https://meet.jit.si/${meetingRoomId}`);

    // Update mentor stats
    await prisma.mentorProfile.update({
      where: { id: mentorUser.mentorProfile.id },
      data: {
        totalSessions: { increment: 1 },
      },
    });

    // Log platform revenue for mentor booking
    const commissionRate = 0.1;
    const gross = mentorUser.mentorProfile.sessionPrice;
    const commissionAmount = Math.round(gross * commissionRate);
    const vendorAmount = gross - commissionAmount;
    await prisma.platformRevenue.create({
      data: {
        orderId: booking.id,
        orderType: "mentor",
        grossAmount: gross,
        commissionRate,
        commissionAmount,
        vendorAmount,
        paymentRef: `test_mentor_${booking.id.slice(0, 8)}`,
      },
    });
    console.log(`✓ PlatformRevenue mentor : gross=${gross} commission=${commissionAmount} vendor=${vendorAmount}`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ SEED TERMINÉ — URLs à tester");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n📚 FORMATION CREÉE");
  console.log(`   slug             : ${formation.slug}`);
  console.log(`   Page publique    : http://localhost:3001/formation/${formation.slug}`);
  console.log(`   Prix             : ${formation.price.toLocaleString("fr-FR")} FCFA`);
  console.log("\n🛒 ACHAT SIMULÉ");
  console.log(`   Acheteur         : ${buyer.email}`);
  console.log(`   Montant          : ${formation.price.toLocaleString("fr-FR")} FCFA`);
  console.log("\n📅 RDV MENTOR");
  console.log(`   Mentor           : ${mentorUser.email}`);
  console.log(`   Apprenant        : ${buyer.email}`);
  console.log(`   Date             : ${tomorrow.toLocaleString("fr-FR")}`);
  console.log(`   Lien meeting     : ${booking.meetingLink}`);
  console.log("\n🔗 À VISITER DANS LE NAVIGATEUR");
  console.log("   ► Espace VENDEUR (pirabellabs1@gmail.com) :");
  console.log("     http://localhost:3001/vendeur/dashboard");
  console.log("     http://localhost:3001/vendeur/produits");
  console.log("     http://localhost:3001/vendeur/transactions");
  console.log("     http://localhost:3001/vendeur/statistiques");
  console.log("\n   ► Espace ACHETEUR/APPRENANT (apprenant.test@freelancehigh.local) :");
  console.log("     http://localhost:3001/apprenant/dashboard");
  console.log("     http://localhost:3001/apprenant/mes-formations");
  console.log("     http://localhost:3001/apprenant/sessions");
  console.log("\n   ► Espace MENTOR (mentor.test@freelancehigh.local) :");
  console.log("     http://localhost:3001/mentor/dashboard");
  console.log("     http://localhost:3001/mentor/calendrier");
  console.log("     http://localhost:3001/mentor/apprenants");
  console.log("     http://localhost:3001/mentor/finances");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ SEED FAILED :", err);
  process.exit(1);
});
