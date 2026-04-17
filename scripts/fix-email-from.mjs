// Replace `noreply@novakou.com` → `contact@novakou.com` in email fallbacks.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("apps/web");
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SKIP = new Set(["node_modules", ".next", ".turbo", ".git"]);
let touched = 0, count = 0;

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (EXTS.has(path.extname(e.name))) {
      const before = fs.readFileSync(f, "utf8");
      const after = before.replace(/noreply@novakou\.com/g, "contact@novakou.com");
      if (after !== before) {
        fs.writeFileSync(f, after, "utf8");
        const n = (before.match(/noreply@novakou\.com/g) || []).length;
        count += n;
        touched++;
        console.log("✓", path.relative(ROOT, f), `(${n})`);
      }
    }
  }
}
walk(ROOT);
console.log(`\nFiles: ${touched}, replacements: ${count}`);
