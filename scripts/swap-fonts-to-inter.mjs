// Replace Manrope/Plus Jakarta usages with Inter across the app.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("apps/web");
const SKIP = new Set([".next", ".turbo", "node_modules"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);

const PATTERNS = [
  // Inline fontFamily declarations
  [/fontFamily:\s*"'Manrope',\s*sans-serif"/g, `fontFamily: "var(--font-inter), Inter, sans-serif"`],
  [/fontFamily:\s*"'Plus Jakarta Sans',\s*sans-serif"/g, `fontFamily: "var(--font-inter), Inter, sans-serif"`],
  [/fontFamily:\s*"Manrope,\s*Arial,\s*sans-serif"/g, `fontFamily: "Inter, Arial, sans-serif"`],
  [/font-family:\s*'Manrope',\s*sans-serif/g, `font-family: var(--font-inter), 'Inter', sans-serif`],
  [/font-family:\s*var\(--font-plus-jakarta\)[^;]*;/g, `font-family: var(--font-inter), 'Inter', sans-serif;`],
  // CSS variable rename
  [/--font-plus-jakarta/g, "--font-inter"],
  [/plus-jakarta/g, "inter"],
];

let touched = 0, total = 0;

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (EXTS.has(path.extname(e.name))) {
      const before = fs.readFileSync(f, "utf8");
      let after = before;
      let changes = 0;
      for (const [re, to] of PATTERNS) {
        const m = after.match(re);
        if (m) changes += m.length;
        after = after.replace(re, to);
      }
      if (after !== before) {
        fs.writeFileSync(f, after, "utf8");
        touched++;
        total += changes;
        console.log("✓", path.relative(ROOT, f), `(${changes})`);
      }
    }
  }
}

walk(ROOT);
console.log(`\nFiles: ${touched}, replacements: ${total}`);
