/**
 * Nuclear clean: delete ALL users except admin@novakou.com.
 * One by one to avoid statement timeout on cascade.
 */
import { PrismaClient } from "@prisma/client";

// Use DIRECT_URL to bypass pgbouncer limits
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const KEEP_EMAIL = "admin@novakou.com";

  console.log("\n══ KEEP ONLY MAIN ADMIN ══\n");

  const keeper = await prisma.user.findUnique({
    where: { email: KEEP_EMAIL },
    select: { id: true },
  });
  if (!keeper) {
    console.error(`  ❌ ${KEEP_EMAIL} introuvable`);
    process.exit(1);
  }

  const toDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true },
  });

  console.log(`  ${toDelete.length} user(s) à supprimer\n`);

  let ok = 0, fail = 0;
  for (const u of toDelete) {
    try {
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`  ✓ ${u.email ?? u.id}`);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${u.email ?? u.id} : ${e instanceof Error ? e.message.slice(0, 80) : e}`);
      fail++;
    }
  }

  const remaining = await prisma.user.count();
  console.log(`\n  Résultat: ${ok} supprimés, ${fail} échecs. Total restant: ${remaining}\n`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
