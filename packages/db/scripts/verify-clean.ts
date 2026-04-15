import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [formations, products, mentors, enrollments, purchases, reviews, funnels, workflows, sequences, users, admins] =
    await Promise.all([
      prisma.formation.count(),
      prisma.digitalProduct.count(),
      prisma.mentorProfile.count(),
      prisma.enrollment.count(),
      prisma.digitalProductPurchase.count(),
      prisma.formationReview.count(),
      prisma.salesFunnel.count(),
      prisma.automationWorkflow.count(),
      prisma.emailSequence.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);

  console.log("\n════ ÉTAT DE LA BASE APRÈS WIPE ════\n");
  console.log(`  Formations            : ${formations}`);
  console.log(`  Produits digitaux     : ${products}`);
  console.log(`  Profils mentors       : ${mentors}`);
  console.log(`  Inscriptions          : ${enrollments}`);
  console.log(`  Achats produits       : ${purchases}`);
  console.log(`  Reviews               : ${reviews}`);
  console.log(`  Funnels de vente      : ${funnels}`);
  console.log(`  Workflows auto        : ${workflows}`);
  console.log(`  Séquences email       : ${sequences}`);
  console.log(`  ────────────────────────────`);
  console.log(`  Users total           : ${users}`);
  console.log(`  Admins                : ${admins}\n`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
