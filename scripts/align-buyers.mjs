// One-shot migration — Karim Benali + Fatou Diallo, bureau 2026-05-26
// Aligne `currentBuyers` sur `salesCount` pour tous les DigitalProduct,
// après le bug d'intégrité identifié à la réunion 11.
//
// Usage : node scripts/align-buyers.mjs            (dry-run, montre les écarts)
//         node scripts/align-buyers.mjs --apply    (applique l'alignement)
//
// Source de vérité : salesCount (incrémenté par checkout + gift + Stripe webhook).
// Les seeds manuels de social proof sont écrasés — décision du bureau.

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "🔧 MODE APPLY" : "🔍 MODE DRY-RUN (use --apply to commit)");

  const products = await prisma.digitalProduct.findMany({
    select: { id: true, slug: true, title: true, currentBuyers: true, salesCount: true },
    orderBy: { createdAt: "asc" },
  });

  const mismatched = products.filter((p) => p.currentBuyers !== p.salesCount);
  console.log(`Total produits : ${products.length}`);
  console.log(`Écarts détectés : ${mismatched.length}`);

  if (mismatched.length === 0) {
    console.log("✅ Rien à faire.");
    await prisma.$disconnect();
    return;
  }

  // Top 10 plus gros écarts pour visibilité
  const top = [...mismatched]
    .sort((a, b) => Math.abs(b.currentBuyers - b.salesCount) - Math.abs(a.currentBuyers - a.salesCount))
    .slice(0, 10);
  console.log("\nTop 10 écarts :");
  for (const p of top) {
    const diff = p.currentBuyers - p.salesCount;
    const sign = diff > 0 ? `+${diff}` : `${diff}`;
    console.log(`  ${p.slug.slice(0, 40).padEnd(40)} | curr=${p.currentBuyers.toString().padStart(5)} sales=${p.salesCount.toString().padStart(5)} | écart ${sign}`);
  }

  if (!APPLY) {
    console.log("\n💡 Relancer avec --apply pour appliquer l'alignement.");
    await prisma.$disconnect();
    return;
  }

  // Apply : une seule requête atomique
  const updated = await prisma.$executeRaw`
    UPDATE "DigitalProduct"
    SET "currentBuyers" = "salesCount"
    WHERE "currentBuyers" <> "salesCount"
  `;
  console.log(`\n✅ ${updated} lignes mises à jour.`);

  // Vérif post
  const check = await prisma.digitalProduct.count({
    where: { NOT: { currentBuyers: { equals: prisma.digitalProduct.fields.salesCount } } },
  }).catch(() => null);
  if (check !== null) console.log(`Vérif post-migration : ${check} écart(s) restant.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌", e);
  prisma.$disconnect();
  process.exit(1);
});
