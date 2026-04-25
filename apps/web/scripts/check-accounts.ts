// Quick check of test accounts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      instructeurProfile: { select: { id: true } },
      mentorProfile: { select: { id: true, isAvailable: true, sessionPrice: true } },
    },
  });

  console.log("\n=== USERS (20 derniers) ===");
  for (const u of users) {
    const flags: string[] = [];
    if (u.instructeurProfile) flags.push("INSTRUCTOR");
    if (u.mentorProfile) flags.push(`MENTOR(${u.mentorProfile.sessionPrice}€ avail=${u.mentorProfile.isAvailable})`);
    console.log(`- ${u.email} [${u.role}] ${flags.join(" ")} — ${u.name ?? ""}`);
  }

  const fCount = await prisma.formation.count();
  const cats = await prisma.formationCategory.findMany({ take: 5, select: { id: true, slug: true, name: true } });
  console.log(`\n=== ${fCount} formations, ${cats.length} catégories ===`);
  for (const c of cats) console.log(`- ${c.slug} (${c.id})`);

  await prisma.$disconnect();
}

main().catch(console.error);
