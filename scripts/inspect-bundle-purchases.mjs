import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");
const p = new PrismaClient();
const cnt = await p.productBundlePurchase.count();
console.log("Total ProductBundlePurchase:", cnt);
if (cnt > 0) {
  const r = await p.productBundlePurchase.findMany({ take: 3, orderBy: { createdAt: "desc" } });
  console.log("Sample:", r);
}
await p.$disconnect();
