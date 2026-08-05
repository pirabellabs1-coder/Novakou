import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Un compte peut vendre, acheter, mentorer et parrainer EN MÊME TEMPS.
 *
 * L'écran admin ne connaissait que deux cases — « Instructeur » ou
 * « Apprenant » — et rangeait chaque compte dans une seule. Un vendeur qui
 * achète aussi disparaissait donc de la liste des clients, et mentors comme
 * affiliés n'existaient nulle part.
 */
const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

test("l'écran admin nomme les rôles comme la plateforme les nomme", () => {
  const src = lire("app/(formations-dashboard)/admin/utilisateurs/page.tsx");
  for (const r of ["Vendeur", "Client", "Mentor", "Affilié"]) {
    expect(src, `le rôle « ${r} » doit apparaître`).toContain(r);
  }
  // « Instructeur » et « Apprenant » sont des noms internes hérités : ils ne
  // doivent plus être montrés à l'admin.
  expect(src).not.toContain("Instructeur");
  expect(src).not.toContain("Apprenant");
});

test("chaque rôle a son filtre côté serveur", () => {
  const src = lire("app/api/formations/admin/utilisateurs/route.ts");
  for (const f of ["vendeurs", "clients", "mentors", "affilies"]) {
    expect(src, `filtre « ${f} » manquant`).toContain(`filter === "${f}"`);
  }
});

test("un client est celui qui a acquis quelque chose, pas « celui qui n'est pas vendeur »", () => {
  const src = lire("app/api/formations/admin/utilisateurs/route.ts");
  // L'ancien calcul comptait comme « apprenants » tous les inscrits sans
  // profil vendeur — y compris ceux qui n'ont jamais rien fait. On croyait
  // alors avoir des acheteurs qu'on n'avait pas.
  expect(src).toContain("enrollments: { some: {} }");
  expect(src).not.toContain('where: { instructeurProfile: { is: null } }');
});

test("les rôles sont cumulables, jamais exclusifs", () => {
  const src = lire("app/api/formations/admin/utilisateurs/route.ts");
  for (const champ of ["estVendeur", "estClient", "estMentor", "estAffilie"]) {
    expect(src).toContain(champ);
  }
});
