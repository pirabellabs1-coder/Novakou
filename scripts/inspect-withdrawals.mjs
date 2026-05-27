// Lecture DB des InstructorWithdrawal récents pour diagnostiquer les payouts ratés.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");
const p = new PrismaClient();

const all = await p.instructorWithdrawal.findMany({
  orderBy: { createdAt: "desc" },
  take: 30,
  include: {
    instructeur: {
      select: { user: { select: { email: true, country: true } } },
    },
  },
});

console.log(`Total withdrawals (récents 30) : ${all.length}\n`);

// Par statut
const byStatus = {};
for (const w of all) byStatus[w.status] = (byStatus[w.status] ?? 0) + 1;
console.log("Par statut :", byStatus);

// Échecs détaillés
console.log("\n=== Détail des échecs / refus ===");
const failed = all.filter((w) => w.status === "REFUSE" || w.errorMessage);
for (const w of failed.slice(0, 15)) {
  console.log("---");
  console.log("  id:", w.id);
  console.log("  status:", w.status);
  console.log("  method:", w.method, "→ provider:", w.paymentProvider ?? "—");
  console.log("  amount:", w.amount, "FCFA");
  console.log("  country:", w.instructeur?.user?.country ?? "—");
  console.log("  accountDetails:", JSON.stringify(w.accountDetails));
  console.log("  refusedReason:", w.refusedReason ?? "—");
  console.log("  errorMessage:", w.errorMessage ? w.errorMessage.slice(0, 200) : "—");
  console.log("  paymentRef:", w.paymentRef ?? "—");
  console.log("  failureCode:", w.failureCode ?? "—");
  console.log("  createdAt:", w.createdAt.toISOString());
  console.log("  processedAt:", w.processedAt?.toISOString() ?? "—");
}

// Pending (EN_ATTENTE)
const pending = all.filter((w) => w.status === "EN_ATTENTE");
console.log(`\n=== ${pending.length} EN_ATTENTE ===`);
for (const w of pending.slice(0, 5)) {
  console.log(`  ${w.id} | ${w.method} | ${w.amount} FCFA | accountDetails=${JSON.stringify(w.accountDetails)}`);
}

await p.$disconnect();
