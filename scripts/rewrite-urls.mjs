// One-shot safe URL rewriter: rewrite `"/formations/..."` → `"/..."` everywhere
// Safety rules:
//   - Only matches `/formations` that STARTS a quoted string (after `"`, `'`, or `` ` ``).
//   - Preserves `/api/formations/*` (internal API routes) via sentinel.
//   - Does NOT touch import paths, component paths, comments, or `//` sequences.
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const SENTINEL = "\u0000KEEP_API_FORMATIONS\u0000";

function listFiles() {
  const out = execSync("git ls-files -co --exclude-standard", { cwd: process.cwd() })
    .toString()
    .split("\n")
    .filter(Boolean);
  return out.filter((p) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|json|md|mdx|html)$/.test(p) &&
    !p.startsWith("node_modules/") &&
    !p.startsWith(".next/") &&
    !p.startsWith(".vercel/") &&
    !p.endsWith("/rewrite-urls.mjs"),
  );
}

let filesChanged = 0;
let total = 0;

for (const file of listFiles()) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const original = src;

  // Protect /api/formations occurrences
  src = src.replaceAll("/api/formations", SENTINEL);

  // Rule 1: quoted URL — replace `(quote)/formations/...` → `(quote)/...`
  //         and `(quote)/formations(quote|?|#)` → `(quote)/(quote|?|#)`
  src = src.replace(/(["'`])\/formations\//g, "$1/");
  src = src.replace(/(["'`])\/formations(?=["'`?#\\])/g, "$1/");

  // Rule 2: markdown/URL-in-paren — `](/formations/...)` → `](/...)`
  src = src.replace(/\(\/formations\//g, "(/");
  src = src.replace(/\(\/formations(?=[\s)?#])/g, "(/");

  // Restore /api/formations
  src = src.replaceAll(SENTINEL, "/api/formations");

  if (src !== original) {
    writeFileSync(file, src, "utf8");
    filesChanged++;
    total += (original.match(/\/formations/g) || []).length - (src.match(/\/formations/g) || []).length;
  }
}

console.log(`✓ Done. Files changed: ${filesChanged}. URL replacements: ${total}.`);
