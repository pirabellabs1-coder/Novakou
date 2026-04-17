/**
 * Clean demo / test / migrated users from the database.
 *
 * Supprime les comptes:
 *   - instructeur-dev@* (ancien Instructeur Démo)
 *   - *@migrated.dev (comptes migrés depuis ancien système)
 *   - *@example.com (tests)
 *   - *@test.com (tests)
 *   - emails commençant par "dev-" (seeds)
 *
 * Conserve:
 *   - admin@novakou.com (compte admin principal)
 *   - Tous les VRAIS utilisateurs qui ont un vrai email
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n══ CLEAN DEMO USERS ══\n");

  // Find demo users by patterns
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "instructeur-dev", mode: "insensitive" } },
        { email: { endsWith: "@migrated.dev", mode: "insensitive" } },
        { email: { endsWith: "@example.com", mode: "insensitive" } },
        { email: { endsWith: "@test.com", mode: "insensitive" } },
        { email: { startsWith: "dev-", mode: "insensitive" } },
      ],
      // Never delete the admin account
      role: { not: "ADMIN" },
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  console.log(`  ${demoUsers.length} user(s) démo détecté(s):\n`);
  for (const u of demoUsers) {
    console.log(`    - ${u.email.padEnd(50)} (${u.role})  ${u.name ?? ""}`);
  }

  if (demoUsers.length === 0) {
    console.log("  Aucun user démo à supprimer.\n");
    await prisma.$disconnect();
    return;
  }

  console.log("\n  Suppression en cours...\n");

  const ids = demoUsers.map((u) => u.id);
  const result = await prisma.user.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`  ✓ ${result.count} user(s) supprimé(s) (+ toutes leurs relations via CASCADE).\n`);

  // Final count
  const remaining = await prisma.user.count();
  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  console.log(`  Base finale: ${remaining} users dont ${admins} admin(s).\n`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
