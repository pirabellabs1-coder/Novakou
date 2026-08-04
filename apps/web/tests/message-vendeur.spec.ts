import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Un vendeur ne doit JAMAIS lire le nom d'une passerelle, ni croire qu'un
 * compte qui n'est pas le sien pose problème.
 *
 * Le 2026-08-04, l'écran de retrait lui annonçait : « Le solde de votre compte
 * FeexPay est insuffisant pour ce virement. » Il n'a pas de compte FeexPay —
 * c'est celui de la plateforme. Le message l'accusait d'un problème qui n'était
 * pas le sien, et exposait une infrastructure qui ne le regarde pas.
 */
const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

const PASSERELLES = /feexpay|fedapay|kkiapay|ipay ?money|moneroo|paygenius/i;

test("les erreurs de retrait rendues au vendeur ne nomment aucune passerelle", () => {
  for (const f of [
    "app/api/formations/wallet/route.ts",
    "app/api/formations/affilie/retraits/route.ts",
  ]) {
    const src = lire(f);
    // On isole les messages effectivement renvoyés au navigateur.
    const messages = src.match(/error:\s*(?:"[^"]*"|`[^`]*`)(?:\s*\+\s*(?:"[^"]*"|`[^`]*`))*/g) ?? [];
    for (const m of messages) {
      expect(m, `${f} expose une passerelle : ${m.slice(0, 90)}`).not.toMatch(PASSERELLES);
    }
  }
});

test("le motif de refus lu par le vendeur reste neutre", () => {
  const src = lire("lib/payout/process-withdrawal.ts");
  // `refusedReason` s'affiche dans l'historique du vendeur ; `errorMessage`
  // porte le détail technique et reste réservé à l'admin.
  expect(src).toContain("refusedReason: MOTIF_PUBLIC");
  expect(src).toMatch(/const MOTIF_PUBLIC\s*=/);
  const motif = src.slice(src.indexOf("const MOTIF_PUBLIC"), src.indexOf("const MOTIF_PUBLIC") + 400);
  expect(motif).not.toMatch(PASSERELLES);
});

test("les panneaux de notification ne débordent plus sur mobile", () => {
  for (const f of [
    "components/notifications/NovakouNotificationBell.tsx",
    "components/notifications/NotificationBell.tsx",
  ]) {
    const src = lire(f);
    // Une largeur fixe ancrée à droite déborde par la gauche sur un écran
    // étroit : le panneau doit se caler sur l'écran avant le palier `sm`.
    expect(src, `${f} garde une largeur fixe sur mobile`).toContain("fixed left-3 right-3");
    expect(src).toMatch(/sm:absolute/);
  }
});

/**
 * Le circuit du versement est un outil d'ADMIN. Il nomme les passerelles, ce
 * qu'un vendeur ne doit jamais lire.
 */
test("le circuit n'est rendu que dans l'espace admin", () => {
  const admin = lire("app/(formations-dashboard)/admin/retraits-vendeurs/page.tsx");
  expect(admin).toContain("CircuitVersement");
  for (const f of [
    "app/(formations-dashboard)/wallet/page.tsx",
    "app/(formations-affilie)/affilie/retraits/page.tsx",
    "app/(formations-dashboard)/mentor/finances/page.tsx",
  ]) {
    expect(lire(f), `${f} exposerait le circuit à un vendeur`).not.toContain("_circuit");
  }
});

/**
 * Le pipeline doit rester pilotable par table : ajouter une passerelle est une
 * entrée d'adaptateur, jamais une branche dans la boucle qui porte les règles
 * de sûreté monétaire.
 */
test("l'orchestrateur ne connaît plus aucune passerelle par son nom", () => {
  const src = lire("lib/payout/execute.ts");
  const boucle = src.slice(src.indexOf("for (const provider of order)"));
  expect(boucle, "la boucle teste encore une passerelle en dur").not.toMatch(/provider === "(feexpay|fedapay)"/);
  expect(src).toContain("const ADAPTATEURS");
});
