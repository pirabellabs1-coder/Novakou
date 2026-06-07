// Fix the "| Novakou | Novakou" double suffix on guide titles.
//
// Le root layout (apps/web/app/layout.tsx) définit :
//   title: { template: "%s | Novakou" }
// Donc tout `metadata.title: "Foo | Novakou"` rend "Foo | Novakou | Novakou".
//
// Mais les openGraph.title / twitter.title NE SONT PAS templatés — ils
// veulent donc avoir "| Novakou" pour l'identité visuelle des cards
// sociales.
//
// Solution : pour chaque guide qui utilise une constante `SEO_TITLE`,
// on splitte en :
//   const SEO_TITLE      = "Foo";                  // sans suffix
//   const SEO_TITLE_FULL = "Foo | Novakou";        // avec suffix
// Le metadata.title utilise SEO_TITLE (le template ajoute "| Novakou").
// Les openGraph.title / twitter.title utilisent SEO_TITLE_FULL.
//
// Pour les guides qui ont juste `title: "Foo | Novakou"` direct dans
// metadata sans constante, on retire seulement le " | Novakou" du field
// principal et on duplique dans og/twitter si besoin.

import fs from "node:fs";
import path from "node:path";

const GUIDES_DIR = "apps/web/app/(formations)/guides";

const files = fs.readdirSync(GUIDES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(GUIDES_DIR, d.name, "page.tsx"))
  .filter((p) => fs.existsSync(p));

let totalChanged = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // CAS 1 : Constante SEO_TITLE avec " | Novakou"
  //   const SEO_TITLE = "Foo | Novakou";
  // → on retire " | Novakou" de la constante. Le template root ajoutera
  //   le suffix sur metadata.title; openGraph.title et twitter.title
  //   perdront le suffix mais auront déjà siteName: "Novakou" → OK.
  content = content.replace(
    /(const\s+SEO_TITLE\s*=\s*["'])([^"']+?)\s*\|\s*Novakou(["'])/g,
    "$1$2$3",
  );

  // CAS 2 : Direct dans metadata sans constante
  //   title: "Foo | Novakou",
  // Mais on doit éviter de toucher openGraph.title et twitter.title qui
  // sont sur des indentations plus profondes. Regex précise : title à
  // l'indentation 2 espaces (top-level metadata).
  content = content.replace(
    /^(\s{2}title:\s*["'])([^"']+?)\s*\|\s*Novakou(["'],?\s*)$/gm,
    "$1$2$3",
  );

  // CAS 3 : "title:\n    \"Foo | Novakou\","  (multi-line declaration)
  content = content.replace(
    /^(\s{2}title:\s*\n\s+["'])([^"']+?)\s*\|\s*Novakou(["'],?\s*)$/gm,
    "$1$2$3",
  );

  // CAS 4 : alternative "| Guide Novakou" → garder juste le titre sans suffix Guide
  content = content.replace(
    /^(\s{2}title:\s*["'])([^"']+?)\s*\|\s*Guide\s+Novakou(["'],?\s*)$/gm,
    "$1$2$3",
  );

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    totalChanged += 1;
    console.log(`✓ ${file}`);
  } else {
    // pas de changement
  }
}

console.log(`\n${totalChanged} / ${files.length} fichiers modifiés.`);
