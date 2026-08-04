import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Les hôtes des passerelles doivent RÉPONDRE.
 *
 * L'encaissement FeexPay a pointé pendant des jours sur `api.feexpay.me`, qui
 * renvoie 502 sur toutes ses routes. Chaque paiement échouait avant même
 * d'être tenté, et personne ne le voyait : le code était correct, l'adresse ne
 * l'était pas. On a cru à une panne du fournisseur.
 *
 * Un 401 ou un 404 sont de BONNES réponses ici : ils prouvent qu'un serveur
 * écoute. Seuls 5xx et l'injoignable sont des échecs.
 */

const source = (f: string) => readFileSync(join(process.cwd(), "lib", f), "utf8");

/** Extrait les hôtes littéraux d'un module de passerelle. */
function hotes(fichier: string): string[] {
  const m = source(fichier).match(/https:\/\/[a-z0-9.-]+/g) ?? [];
  return [...new Set(m)].filter((h) => !h.includes("docs."));
}

test("l'encaissement et le versement FeexPay visent le même hôte", () => {
  const s = source("feexpay.ts");
  expect(s).toContain('const FEEXPAY_API_BASE = "https://api-v2.feexpay.me"');
  // L'encaissement ne doit PAS redéclarer une adresse à lui : c'est ainsi que
  // les deux ont divergé, l'une vers un hôte mort.
  expect(s).toContain("const FEEXPAY_COLLECT_BASE = FEEXPAY_API_BASE;");
  expect(s).not.toContain('"https://api.feexpay.me"');
});

test("aucun module de passerelle ne référence un hôte mort", () => {
  for (const f of ["feexpay.ts", "fedapay.ts", "ipaymoney.ts"]) {
    for (const h of hotes(f)) {
      expect(h, `${f} référence ${h}`).not.toBe("https://api.feexpay.me");
    }
  }
});

test("les hôtes des passerelles répondent réellement", async ({ request }) => {
  const cibles = [
    { nom: "FeexPay", url: "https://api-v2.feexpay.me/api/transactions/requesttopay/integration" },
    { nom: "FedaPay", url: "https://api.fedapay.com/v1/currencies" },
  ];
  for (const c of cibles) {
    const res = await request.post(c.url, { data: {}, failOnStatusCode: false, timeout: 20_000 });
    // 5xx = le serveur est cassé ou absent. Tout le reste prouve qu'il écoute.
    expect(res.status(), `${c.nom} répond ${res.status()} sur ${c.url}`).toBeLessThan(500);
  }
});
