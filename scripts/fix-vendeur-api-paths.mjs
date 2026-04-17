// Fix /api/vendeur/* → /api/formations/vendeur/* in client code
// Only touches fetch/url strings in components/pages, NOT API routes themselves
import fs from "node:fs";
import path from "node:path";

const ROOTS = [
  "apps/web/app/(formations-dashboard)",
  "apps/web/app/(formations-affilie)",
  "apps/web/app/(formations)",
  "apps/web/components",
];

const EXTS = new Set([".ts", ".tsx"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", ".turbo"]);

let total = 0;
let touched = 0;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (EXTS.has(path.extname(e.name))) processFile(full);
  }
}

function processFile(file) {
  const before = fs.readFileSync(file, "utf8");
  // Only replace string literals that look like API fetch targets.
  // Avoid: /api/formations/... (already correct), and comments describing the vendor space page path /vendeur/...
  const after = before.replace(/(["'`])\/api\/vendeur\//g, "$1/api/formations/vendeur/");
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    const delta = (before.match(/["'`]\/api\/vendeur\//g) || []).length;
    total += delta;
    touched++;
    console.log("✓", path.relative(".", file), `(${delta})`);
  }
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(path.resolve(r));

console.log(`\nFiles touched: ${touched}`);
console.log(`Replacements:  ${total}`);
