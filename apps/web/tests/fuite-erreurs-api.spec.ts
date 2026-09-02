import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Une erreur interne ne doit JAMAIS atterrir sur l'ecran d'un utilisateur.
 *
 * Constate en production : un `err.message` renvoye tel quel affichait au
 * vendeur, sur sa page produit, une trace Prisma de plusieurs centaines de
 * lignes exposant le schema complet de la base. Le motif existait dans 130
 * endroits — parce que rien ne l'arretait.
 *
 * Ce test relit les routes et refuse le motif. Le detail va dans les logs
 * (console.error, donc Vercel et Sentry), l'ecran recoit une phrase courte.
 */

const RACINE = path.join(__dirname, "..", "app", "api");

// Ces routes ne repondent pas a un humain : les couper detruirait de
// l'observabilite sans rien proteger.
//   cron/, webhooks/  -> machines (Vercel Cron, passerelles de paiement)
//   formations/admin/ -> admin de confiance, et les outils de diagnostic
//                        (test-gateway, apply-migration…) ont BESOIN du brut
const HORS_PERIMETRE = ["cron/", "webhooks/", "formations/admin/", "formations/dev/"];

// Exception justifiee au cas par cas, par un commentaire sur la ligne au-dessus.
const MARQUEUR = "fuite-erreur-ok";

const FUITE =
  /(err|e|error|ex)\s+instanceof\s+Error\s*\?\s*\1\.message|\b(error|detail|message):\s*(err|e|error|ex)\.message/;

function routes(dossier: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) out.push(...routes(p));
    else if (e.name.endsWith(".ts")) out.push(p);
  }
  return out;
}

test("aucune route utilisateur ne renvoie le message d'une exception", () => {
  const coupables: string[] = [];

  for (const fichier of routes(RACINE)) {
    const rel = path.relative(RACINE, fichier).split(path.sep).join("/");
    if (HORS_PERIMETRE.some((p) => rel.startsWith(p))) continue;

    const lignes = fs.readFileSync(fichier, "utf8").split(/\r?\n/);
    lignes.forEach((ligne, i) => {
      if (!FUITE.test(ligne)) return;
      if (ligne.includes("console.")) return; // journalisation : c'est le but
      if (ligne.includes(MARQUEUR)) return;
      if ((lignes[i - 1] ?? "").includes(MARQUEUR)) return;
      coupables.push(`${rel}:${i + 1}  ${ligne.trim()}`);
    });
  }

  expect(
    coupables,
    "Ces lignes renvoient une erreur interne a un utilisateur. Renvoyez une " +
      "phrase courte et laissez le detail dans console.error. Si l'exception " +
      `est legitime, justifiez-la par un commentaire « ${MARQUEUR} : … ».\n` +
      coupables.join("\n"),
  ).toEqual([]);
});
