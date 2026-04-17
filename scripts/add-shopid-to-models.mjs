// Add `shopId String?` to specific Prisma models, just after their instructeurId line.
import fs from "node:fs";

const file = "packages/db/prisma/schema.prisma";
const txt = fs.readFileSync(file, "utf8");

const modelsToTouch = [
  "MarketingPixel",
  "AffiliateProgram",
  "DiscountCode",
  "EmailSequence",
  "SalesFunnel",
  "SmartPopup",
  "CampaignTracker",
  "AutomationWorkflow",
  "VendorIntegration",
  "VendorWebhook",
  "VendorApiKey",
  "InstructorWithdrawal",
];

let updated = txt;
for (const m of modelsToTouch) {
  const re = new RegExp(`(model ${m} \\{[^}]*?instructeurId\\s+String[^\\n]*\\n)`, "s");
  if (!re.test(updated)) {
    console.log("− skip (model or instructeurId not found):", m);
    continue;
  }
  if (updated.match(new RegExp(`model ${m}[^}]*shopId\\s+String`, "s"))) {
    console.log("✓ already has shopId:", m);
    continue;
  }
  updated = updated.replace(re, `$1  shopId          String?\n`);
  console.log("+ added shopId to:", m);
}

fs.writeFileSync(file, updated, "utf8");
console.log("\nDone.");
