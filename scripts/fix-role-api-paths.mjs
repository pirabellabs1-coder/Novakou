// Fix client fetch paths for apprenant/mentor/affilie roles.
// These APIs only exist under /api/formations/* — the plain /api/apprenant, /api/mentor, /api/affilie do NOT exist.
// Admin is skipped because both /api/admin/* and /api/formations/admin/* exist with different route sets.
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

const PATTERNS = [
  [/(["'`])\/api\/apprenant\//g, "$1/api/formations/apprenant/"],
  [/(["'`])\/api\/mentor\//g, "$1/api/formations/mentor/"],
  [/(["'`])\/api\/affilie\//g, "$1/api/formations/affilie/"],
];

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
  let after = before;
  let deltaFile = 0;
  for (const [re, to] of PATTERNS) {
    const matches = after.match(re);
    if (matches) deltaFile += matches.length;
    after = after.replace(re, to);
  }
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    total += deltaFile;
    touched++;
    console.log("✓", path.relative(".", file), `(${deltaFile})`);
  }
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(path.resolve(r));

console.log(`\nFiles touched: ${touched}`);
console.log(`Replacements:  ${total}`);
