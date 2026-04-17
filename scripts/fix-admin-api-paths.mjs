// Fix client fetch paths for admin dashboard.
// Most /api/admin/* endpoints only exist at /api/formations/admin/* (post-refactor).
// Keep-at-root whitelist: endpoints that ONLY exist at /api/admin/ (marketplace-side).
import fs from "node:fs";
import path from "node:path";

const ROOTS = [
  "apps/web/app/(formations-dashboard)",
  "apps/web/components",
];

const EXTS = new Set([".ts", ".tsx"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", ".turbo"]);

// endpoints that stay at /api/admin/* (only exist there)
const KEEP_AT_ROOT = new Set([
  "users",
  "verify-access-token",
  "seed",
  "seed-marketplace",
  "reset-data",
  "analytics",
  "audit-log",
  "badges",
  "blog",
  "boosts",
  "categories",
  "comptabilite",
  "config",
  "disputes",
  "email-test",
  "emails",
  "equipe",
  "finances",
  "notifications",
  "orders",
]);

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
  let delta = 0;
  // Match "...literal /api/admin/<segment>..." and decide per segment
  const after = before.replace(/(["'`])\/api\/admin\/([a-zA-Z0-9_-]+)/g, (m, q, seg) => {
    if (KEEP_AT_ROOT.has(seg)) return m;
    delta++;
    return `${q}/api/formations/admin/${seg}`;
  });
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    total += delta;
    touched++;
    console.log("✓", path.relative(".", file), `(${delta})`);
  }
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(path.resolve(r));

console.log(`\nFiles touched: ${touched}`);
console.log(`Replacements:  ${total}`);
