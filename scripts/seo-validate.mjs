// Validateur Rich Results local — crawl localhost:3000 sur les URLs clés
// SEO, extrait tous les `<script type="application/ld+json">`, parse et
// vérifie la conformité Schema.org. Output : rapport par URL avec
// status ✅ / ⚠️ / ❌ et erreurs détaillées.
//
// Usage :
//   1. Lancer le dev server : pnpm dev
//   2. node scripts/seo-validate.mjs
//
// Pas besoin d'API key — validation 100% locale basée sur les règles
// Google Search Central pour les rich results (étoiles, FAQ, breadcrumb,
// Course, Product, Person, Store, Organization, WebSite, Article).

import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SEO_BASE || "http://localhost:3000";

// URLs à auditer. La plupart sont publiques (pas de session requise).
// Pour les URLs dynamiques (formation/produit/mentor), on prend le premier
// slug réel via une requête à l'API /api ou on saute si rien en DB.
const URLS = [
  { url: "/", expected: ["Organization", "WebSite"] },
  { url: "/explorer", expected: ["BreadcrumbList"] },
  { url: "/aide", expected: ["FAQPage", "BreadcrumbList"] },
  { url: "/tarifs", expected: [] },
  { url: "/a-propos", expected: [] },
  { url: "/affiliation", expected: [] },
  { url: "/contact", expected: [] },
  { url: "/guides", expected: [] },
  { url: "/guides/mobile-money-encaisser-paiements", expected: ["Article"] },
  { url: "/guides/fixer-prix-formation", expected: ["Article"] },
  // /instructeurs (index) n'existe pas — seul /instructeurs/[id] est servi.
  // On ne le teste donc plus ici (retiré aussi du sitemap).
  { url: "/mentors", expected: [] },
];

// Schemas Google rich-result-eligibles + leurs champs requis (subset
// minimum qui déclenche les rich results — source : developers.google.com/
// search/docs/appearance/structured-data).
const SCHEMA_RULES = {
  Organization: {
    required: ["name", "url"],
    recommended: ["logo", "sameAs", "contactPoint"],
  },
  WebSite: {
    required: ["name", "url"],
    recommended: ["potentialAction"],
  },
  Person: {
    required: ["name"],
    recommended: ["jobTitle", "image", "url", "worksFor"],
  },
  Store: {
    required: ["name", "url"],
    recommended: ["logo", "image", "parentOrganization"],
  },
  Course: {
    required: ["name", "description", "provider"],
    recommended: ["offers", "aggregateRating", "hasCourseInstance", "image"],
  },
  Product: {
    required: ["name", "image"],
    recommended: ["offers", "aggregateRating", "brand", "description"],
  },
  Article: {
    required: ["headline", "author"],
    recommended: ["datePublished", "image", "publisher"],
  },
  FAQPage: {
    required: ["mainEntity"],
    validator: (obj) => {
      if (!Array.isArray(obj.mainEntity)) return "mainEntity doit être un array";
      if (obj.mainEntity.length < 2) return "mainEntity doit avoir ≥ 2 questions";
      for (const q of obj.mainEntity) {
        if (q["@type"] !== "Question") return "Chaque mainEntity doit être Question";
        if (!q.name) return "Question.name manquant";
        if (!q.acceptedAnswer?.text) return "Question.acceptedAnswer.text manquant";
        if (q.acceptedAnswer.text.length < 30) return `Réponse trop courte (<30 char) : "${q.name}"`;
      }
      return null;
    },
  },
  BreadcrumbList: {
    required: ["itemListElement"],
    validator: (obj) => {
      if (!Array.isArray(obj.itemListElement)) return "itemListElement doit être array";
      if (obj.itemListElement.length < 2) return "BreadcrumbList doit avoir ≥ 2 niveaux";
      for (const item of obj.itemListElement) {
        if (!item.position) return "ListItem.position manquant";
        if (!item.name) return "ListItem.name manquant";
      }
      return null;
    },
  },
  AggregateRating: {
    required: ["ratingValue", "reviewCount"],
    validator: (obj) => {
      const rv = Number(obj.ratingValue);
      const rc = Number(obj.reviewCount);
      if (isNaN(rv) || rv < 0 || rv > 5) return `ratingValue hors-bornes : ${obj.ratingValue}`;
      if (isNaN(rc) || rc < 1) return `reviewCount doit être ≥ 1 (sinon Google rejette) : ${obj.reviewCount}`;
      return null;
    },
  },
};

function extractJsonLdBlocks(html) {
  // Match tous les <script type="application/ld+json">...</script>
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      // Peut être un graph (@graph) ou un objet
      if (parsed["@graph"]) {
        for (const item of parsed["@graph"]) blocks.push({ raw, parsed: item });
      } else {
        blocks.push({ raw, parsed });
      }
    } catch (err) {
      blocks.push({ raw, parsed: null, parseError: err.message });
    }
  }
  return blocks;
}

function validateBlock(parsed) {
  const errors = [];
  const warnings = [];
  if (!parsed || typeof parsed !== "object") {
    errors.push("Pas un objet JSON valide");
    return { errors, warnings };
  }
  if (!parsed["@context"]) errors.push("@context manquant");
  const type = parsed["@type"];
  if (!type) {
    errors.push("@type manquant");
    return { errors, warnings };
  }
  const rule = SCHEMA_RULES[type];
  if (!rule) {
    // Pas de règle connue — on skip (pas un type rich-result Google)
    return { errors, warnings, skipped: true };
  }
  for (const field of rule.required ?? []) {
    if (!parsed[field]) errors.push(`${type}.${field} manquant (REQUIS)`);
  }
  for (const field of rule.recommended ?? []) {
    if (!parsed[field]) warnings.push(`${type}.${field} recommandé`);
  }
  if (rule.validator) {
    const issue = rule.validator(parsed);
    if (issue) errors.push(issue);
  }
  return { errors, warnings };
}

async function auditUrl({ url, expected }) {
  const fullUrl = `${BASE}${url}`;
  let html = "";
  try {
    const res = await fetch(fullUrl, { redirect: "follow" });
    if (!res.ok) {
      return { url, status: "ERROR", http: res.status, blocks: [] };
    }
    html = await res.text();
  } catch (err) {
    return { url, status: "ERROR", error: err.message, blocks: [] };
  }

  const blocks = extractJsonLdBlocks(html);
  const blockReports = blocks.map((b) => {
    if (b.parseError) {
      return { type: "(parse error)", errors: [`JSON invalide : ${b.parseError}`], warnings: [] };
    }
    const validation = validateBlock(b.parsed);
    return {
      type: b.parsed?.["@type"] ?? "(unknown)",
      ...validation,
    };
  });

  const typesFound = blockReports.map((r) => r.type).filter((t) => t && t !== "(unknown)");
  const missing = expected.filter((e) => !typesFound.includes(e));

  // Vérifie aussi metadata OG essentielle
  const hasOgImage = /<meta property="og:image" content="[^"]+"/i.test(html);
  const hasOgTitle = /<meta property="og:title" content="[^"]+"/i.test(html);
  const hasTwitterCard = /<meta name="twitter:card" content="summary_large_image"/i.test(html);
  const hasCanonical = /<link rel="canonical" href="[^"]+"/i.test(html);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);

  const meta = {
    title: titleMatch?.[1] ?? null,
    titleLen: titleMatch?.[1]?.length ?? 0,
    description: descMatch?.[1] ?? null,
    descLen: descMatch?.[1]?.length ?? 0,
    hasOgImage,
    hasOgTitle,
    hasTwitterCard,
    hasCanonical,
  };

  const allErrors = blockReports.flatMap((r) => r.errors.map((e) => `[${r.type}] ${e}`));
  const allWarnings = blockReports.flatMap((r) => r.warnings.map((w) => `[${r.type}] ${w}`));
  if (missing.length) allErrors.push(`Types attendus manquants : ${missing.join(", ")}`);
  if (!hasOgImage) allErrors.push("og:image manquant");
  if (!hasCanonical) allWarnings.push("canonical manquant");
  if (meta.titleLen > 65) allWarnings.push(`title trop long (${meta.titleLen} char > 65)`);
  if (meta.titleLen < 25) allWarnings.push(`title trop court (${meta.titleLen} char < 25)`);
  if (meta.descLen > 160) allWarnings.push(`description trop longue (${meta.descLen} char > 160)`);
  if (meta.descLen < 100) allWarnings.push(`description trop courte (${meta.descLen} char < 100)`);

  const status = allErrors.length ? "❌" : allWarnings.length ? "⚠️ " : "✅";

  return {
    url,
    status,
    http: 200,
    typesFound,
    blockCount: blocks.length,
    errors: allErrors,
    warnings: allWarnings,
    meta,
  };
}

(async () => {
  console.log(`\n🔍 SEO Rich Results Validator — ${BASE}\n`);
  console.log("─".repeat(80));

  const results = [];
  for (const target of URLS) {
    process.stdout.write(`Auditing ${target.url.padEnd(50)} … `);
    const r = await auditUrl(target);
    results.push(r);
    console.log(r.status);
  }

  console.log("\n" + "─".repeat(80));
  console.log("📊 RAPPORT DÉTAILLÉ\n");

  let totalErrors = 0;
  let totalWarnings = 0;
  for (const r of results) {
    console.log(`\n${r.status}  ${r.url}`);
    console.log(`    HTTP ${r.http ?? "?"}  ·  ${r.blockCount ?? 0} JSON-LD blocks  ·  types: ${r.typesFound?.join(", ") || "—"}`);
    if (r.meta) {
      console.log(`    title (${r.meta.titleLen}c): ${r.meta.title?.slice(0, 80) ?? "—"}`);
      console.log(`    desc  (${r.meta.descLen}c): ${r.meta.description?.slice(0, 80) ?? "—"}`);
      console.log(`    og:image: ${r.meta.hasOgImage ? "✓" : "✗"}  ·  twitter:card: ${r.meta.hasTwitterCard ? "✓" : "✗"}  ·  canonical: ${r.meta.hasCanonical ? "✓" : "✗"}`);
    }
    if (r.errors?.length) {
      totalErrors += r.errors.length;
      for (const e of r.errors) console.log(`    ❌ ${e}`);
    }
    if (r.warnings?.length) {
      totalWarnings += r.warnings.length;
      for (const w of r.warnings) console.log(`    ⚠️  ${w}`);
    }
  }

  console.log("\n" + "─".repeat(80));
  console.log(`\n📈 RÉSUMÉ : ${results.filter((r) => r.status === "✅").length}/${results.length} pages OK · ${totalErrors} erreurs · ${totalWarnings} avertissements\n`);

  // Sauve aussi en JSON pour CI ou comparaison future
  const outFile = path.join("screenshots", `seo-report-${new Date().toISOString().split("T")[0]}.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`💾 Rapport sauvé : ${outFile}\n`);

  // Exit non-zero si erreurs (utile en CI)
  process.exit(totalErrors > 0 ? 1 : 0);
})();
