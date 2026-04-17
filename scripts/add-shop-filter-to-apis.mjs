// Add active-shop filter + assignment to vendor marketing/automation/integration APIs.
// Heuristic: in route.ts files under apps/web/app/api/formations/vendeur/{marketing,automatisations,api-keys,integrations,funnels}/...
//   - if `where: { instructeurId:` is present, append `, ...(activeShopId ? { shopId: activeShopId } : {})`
//   - if `data: { instructeurId:` is present, append `, shopId: activeShopId`
//   - inject `import { getActiveShopId } from "@/lib/formations/active-shop";` if missing
//   - inject `const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });` after resolveVendorContext
//
// IMPORTANT: This is a best-effort scaffold; we'll review unusual files manually.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("apps/web/app/api/formations/vendeur");
const TARGET_DIRS = [
  "marketing",
  "automatisations",
  "api-keys",
  "integrations",
  "funnels",
];

let touched = 0;
let total = 0;

function processFile(file) {
  let txt = fs.readFileSync(file, "utf8");
  let mods = 0;

  // 1) Inject import
  if (!txt.includes('@/lib/formations/active-shop')) {
    if (txt.includes('@/lib/formations/active-user')) {
      txt = txt.replace(
        /import\s*{\s*resolveVendorContext\s*}\s*from\s*"@\/lib\/formations\/active-user";\s*/,
        (m) => m + 'import { getActiveShopId } from "@/lib/formations/active-shop";\n',
      );
      mods++;
    }
  }

  // 2) Inject activeShopId resolution after the first ctx call
  if (!txt.includes('activeShopId')) {
    const re = /(const\s+ctx\s*=\s*await\s+resolveVendorContext\([^)]*\);\s*if\s*\(!ctx\)[^;]*;)/m;
    if (re.test(txt)) {
      txt = txt.replace(
        re,
        `$1\n    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });`,
      );
      mods++;
    }
  }

  // 3) Filter where clauses: where: { instructeurId: ... } → add ...(activeShopId ? { shopId: activeShopId } : {})
  const whereRe = /where:\s*\{\s*instructeurId:\s*([^,}]+?)(\s*[,}])/g;
  txt = txt.replace(whereRe, (m, val, end) => {
    if (m.includes('shopId')) return m;
    mods++;
    return `where: { instructeurId: ${val}, ...(activeShopId ? { shopId: activeShopId } : {})${end}`;
  });

  // 4) Add shopId on create payloads: data: { instructeurId: ... } → also add shopId
  const dataRe = /data:\s*\{\s*([^}]*?)instructeurId:\s*([^,}]+?)(\s*[,}])/g;
  txt = txt.replace(dataRe, (m, prefix, val, end) => {
    if (m.includes('shopId')) return m;
    mods++;
    return `data: { ${prefix}instructeurId: ${val}, shopId: activeShopId${end}`;
  });

  if (mods > 0) {
    fs.writeFileSync(file, txt, "utf8");
    touched++;
    total += mods;
    console.log("✓", path.relative(".", file), `(${mods})`);
  }
}

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.isFile() && e.name.endsWith("route.ts")) processFile(f);
  }
}

for (const sub of TARGET_DIRS) {
  const full = path.join(ROOT, sub);
  if (fs.existsSync(full)) walk(full);
}

console.log(`\nFiles: ${touched}, modifications: ${total}`);
