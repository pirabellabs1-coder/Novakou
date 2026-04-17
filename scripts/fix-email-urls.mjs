// Fix /formations/* URL leftovers in email templates and lib
import fs from "node:fs";
import path from "node:path";

const files = [
  "apps/web/lib/email/formations.ts",
  "apps/web/lib/email/kyc.ts",
  "apps/web/lib/email/layout-fh.ts",
  "apps/web/lib/email/mentor.ts",
  "apps/web/lib/email/templates/formation.ts",
  "apps/web/lib/email/templates-fh.ts",
  "apps/web/lib/events/registry.ts",
];

// Order: specific → generic
const PATCHES = [
  // Apprenant-side
  [/\/formations\/mes-formations/g, "/apprenant/mes-formations"],
  [/\/formations\/certificats/g, "/apprenant/certificats"],
  [/\/formations\/apprendre\//g, "/apprenant/formation/"],
  [/\/formations\/mes-cohorts\//g, "/apprenant/cohortes/"],
  [/\/formations\/kyc/g, "/kyc"],
  [/\/formations\/verification\//g, "/certificat/"],
  // Vendeur/instructeur-side
  [/\/formations\/instructeur\/apprenants/g, "/vendeur/etudiants"],
  [/\/formations\/instructeur\/creer/g, "/vendeur/produits/creer"],
  [/\/formations\/instructeur\/mes-formations/g, "/vendeur/produits"],
  [/\/formations\/instructeur\/dashboard/g, "/vendeur/dashboard"],
  [/\/formations\/instructeur/g, "/vendeur"],
  // Public pages
  [/\/formations\/mentors\//g, "/mentors/"],
  [/\/formations\/mentors(?!\w)/g, "/mentors"],
  [/\/formations\/explorer/g, "/explorer"],
  [/\/formations\/cgu/g, "/cgu"],
  [/\/formations\/confidentialite/g, "/confidentialite"],
  [/\/formations\/cookies/g, "/cookies"],
  [/\/formations\/reinitialiser-mot-de-passe/g, "/reinitialiser-mot-de-passe"],
  [/\/formations\/connexion/g, "/connexion"],
  [/\/formations\/inscription/g, "/inscription"],
  // Dashboards
  [/\/formations\/\$\{isVendor \? "vendeur" : "apprenant"\}\/dashboard/g, "${isVendor ? \"/vendeur\" : \"/apprenant\"}/dashboard"],
  [/\/dashboard\/formations/g, "/vendeur/produits"],
  [/\/admin\/formations\/liste/g, "/admin/formations"],
  // Formation slug — public page
  [/`\$\{APP_URL\}\/formations\/\$\{formationSlug\}`/g, "`${APP_URL}/formation/${formationSlug}`"],
  [/`\$\{getAppUrl\(\)\}\/formations`/g, "`${getAppUrl()}/`"],
  // Generic /formations/ → / (last)
  [/\/formations(?![a-zA-Z0-9_/\-])/g, ""],
];

for (const rel of files) {
  const file = path.resolve(rel);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  for (const [re, to] of PATCHES) after = after.replace(re, to);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    console.log("✓", rel);
  } else {
    console.log("– unchanged:", rel);
  }
}
