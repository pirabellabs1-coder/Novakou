// Bulk rebrand: FreelanceHigh → Novakou, freelancehigh.com → novakou.com
// Skips: node_modules, .next, .turbo, package.json, pnpm-lock, .git
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("apps/web");
const SKIP_DIRS = new Set([".next", ".turbo", "node_modules", ".git"]);
const SKIP_FILES = new Set(["package.json", "pnpm-lock.yaml"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".md", ".html"]);

// Patterns applied in order
const REPLACEMENTS = [
  // URLs first (more specific)
  [/https?:\/\/formations\.freelancehigh\.com/g, "https://novakou.com"],
  [/formations\.freelancehigh\.com/g, "novakou.com"],
  [/https?:\/\/freelancehigh\.com/g, "https://novakou.com"],
  [/freelancehigh\.com/g, "novakou.com"],
  // Brand string in UI text / comments — keep "@freelancehigh/" package scope intact via negative lookahead
  [/FreelanceHigh(?!\/)/g, "Novakou"],
];

// URL path fixes for /formations leftovers (route group (formations) is now root)
const URL_PATH_FIXES = [
  // affiliate / ref links
  [/`\$\{baseUrl\}\/formations\?ref=/g, "`${baseUrl}/?ref="],
  [/`\$\{process\.env\.NEXT_PUBLIC_APP_URL \|\| "https:\/\/novakou\.com"\}\/formations\?ref=/g, '`${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/?ref='],
  [/`\$\{process\.env\.NEXT_PUBLIC_APP_URL \|\| "https:\/\/novakou\.com"\}\/formations\//g, '`${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/'],
  [/\/formations\/formation\//g, "/formation/"],
  [/\/formations\/mentor\//g, "/mentor/"],
  [/\/formations\/apprenant\//g, "/apprenant/"],
  [/\/formations\/vendeur\//g, "/vendeur/"],
  [/\/formations\/admin\//g, "/admin/"],
  [/\/formations\/affilie\//g, "/affilie/"],
  [/"https:\/\/novakou\.com\/formations"/g, '"https://novakou.com"'],
];

let touched = 0;
let replacements = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && EXTS.has(path.extname(entry.name))) processFile(full);
  }
}

function processFile(file) {
  const rel = path.relative(ROOT, file);
  // Skip package.json-ish configs (monorepo package names)
  if (rel.endsWith("package.json") || rel.endsWith("tsconfig.json")) return;
  // Skip @freelancehigh package imports — they're the internal monorepo scope
  const before = fs.readFileSync(file, "utf8");
  let after = before;

  for (const [re, to] of REPLACEMENTS) after = after.replace(re, to);
  for (const [re, to] of URL_PATH_FIXES) after = after.replace(re, to);

  // Restore internal package imports (@freelancehigh/* was caught by FreelanceHigh regex? No, negative lookahead)
  // But also restore @freelancehigh scope (lowercase) in imports — not touched by case-sensitive regex.

  if (after !== before) {
    const delta = (before.match(/FreelanceHigh|freelancehigh\.com|formations\.freelancehigh/g) || []).length;
    replacements += delta;
    touched++;
    fs.writeFileSync(file, after, "utf8");
    console.log(`✓ ${rel}`);
  }
}

walk(ROOT);

// Also process packages/db seeds etc
const PKG_ROOTS = ["packages/db", "packages/types", "packages/ui", "packages/config"];
for (const p of PKG_ROOTS) {
  if (fs.existsSync(p)) walk(path.resolve(p));
}

console.log(`\nFiles touched: ${touched}`);
console.log(`Replacements: ${replacements}`);
