#!/usr/bin/env node
/**
 * Replace "Lissanon Gildas" (and variants) with "Pirabel Labs" across code.
 * Keeps semantic correctness : "Fondée par Lissanon Gildas" → "Éditée par Pirabel Labs".
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd(), "apps/web");
const SKIP = new Set([".next", "node_modules", ".turbo", "dist", "out"]);

const REPLACEMENTS = [
  // "Fondée par Lissanon Gildas" → "Éditée par Pirabel Labs"
  ["Fondée par Lissanon Gildas", "Éditée par Pirabel Labs"],
  ["Fondee par Lissanon Gildas", "Editee par Pirabel Labs"],
  ["Founded by Lissanon Gildas", "Published by Pirabel Labs"],
  // "Fondateur" signature
  ["Lissanon Gildas, Fondateur", "L'équipe Pirabel Labs"],
  ["Lissanon Gildas, Founder", "The Pirabel Labs team"],
  // Plain name
  ["Lissanon Gildas", "Pirabel Labs"],
  ["Gildas LISSANON", "Pirabel Labs"],
  ["LISSANON Gildas", "Pirabel Labs"],
];

let edited = 0;
let total = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|json|md|mdx|html)$/.test(entry)) {
      total++;
      let src = readFileSync(full, "utf8");
      let changed = false;
      for (const [from, to] of REPLACEMENTS) {
        if (src.includes(from)) {
          src = src.split(from).join(to);
          changed = true;
        }
      }
      if (changed) {
        writeFileSync(full, src);
        console.log(`✓ ${full.replace(ROOT, "")}`);
        edited++;
      }
    }
  }
}

walk(ROOT);
console.log(`\n${edited}/${total} fichiers modifiés`);
