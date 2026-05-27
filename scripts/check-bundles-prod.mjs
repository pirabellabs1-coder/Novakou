import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");
const p = new PrismaClient();
const b = await p.productBundle.findMany({ select: { slug: true, title: true, isActive: true }, take: 5 });
console.log("Total bundles:", await p.productBundle.count());
console.log("Bundles actifs:", await p.productBundle.count({ where: { isActive: true } }));
for (const x of b) console.log(`  ${x.isActive ? "✓" : "✗"} /bundle/${x.slug} — ${x.title}`);
await p.$disconnect();
