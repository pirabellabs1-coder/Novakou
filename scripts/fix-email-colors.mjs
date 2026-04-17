// Replace FreelanceHigh purple (#6C2BD9, #8B5CF6) by Novakou green
// (#006e2f primary, #22c55e secondary). Backgrounds rejigged accordingly.
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["apps/web/lib/email", "apps/web/components/emails"];
const EXTS = new Set([".ts", ".tsx"]);
let touched = 0, count = 0;

const REPLACE = [
  // Pure brand color hexes (case-insensitive via separate regexes for each)
  [/#6C2BD9/g, "#006e2f"],
  [/#6c2bd9/g, "#006e2f"],
  [/#8B5CF6/g, "#22c55e"],
  [/#8b5cf6/g, "#22c55e"],
  // Light purple tints used for backgrounds
  [/#f3f0ff/g, "#ecfdf5"],
  [/#f0e8ff/g, "#dcfce7"],
  [/#e8f4ff/g, "#ecfdf5"],
];

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === ".turbo") continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (EXTS.has(path.extname(e.name))) {
      const before = fs.readFileSync(f, "utf8");
      let after = before;
      for (const [re, to] of REPLACE) after = after.replace(re, to);
      if (after !== before) {
        fs.writeFileSync(f, after, "utf8");
        const n = REPLACE.reduce((acc, [re]) => acc + (before.match(re) || []).length, 0);
        count += n;
        touched++;
        console.log("✓", path.relative(".", f), `(${n})`);
      }
    }
  }
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(path.resolve(r));
console.log(`\nFiles: ${touched}, replacements: ${count}`);
