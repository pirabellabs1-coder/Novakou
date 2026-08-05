import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Deux défauts silencieux du 2026-08-04, tous deux invisibles jusqu'à ce qu'un
 * achat réel se bloque :
 *
 *  • la vérification de statut FeexPay partait SANS clé d'authentification.
 *    Le paiement arrivait bien sur le téléphone de l'acheteur, il confirmait,
 *    et nous ne pouvions jamais lire le résultat : la page « Confirmez sur
 *    votre téléphone » tournait indéfiniment, le produit n'était pas livré ;
 *
 *  • la consultation de statut FedaPay utilisait `fetch` au lieu de
 *    `payoutFetch`, contournant le proxy à IP fixe.
 */
const lire = (f: string) => readFileSync(join(process.cwd(), "lib", f), "utf8");

test("tout appel de passerelle porte une clé d'authentification", () => {
  for (const f of ["feexpay.ts", "fedapay.ts", "ipaymoney.ts"]) {
    const src = lire(f);
    // Chaque bloc d'appel doit contenir un en-tête d'authentification dans les
    // lignes qui suivent immédiatement l'URL.
    const blocs = src.split(/await (?:payoutFetch|fetch)\(/).slice(1);
    for (const b of blocs) {
      const debut = b.slice(0, 1200);
      // `headers,` = en-têtes construits plus haut (ils portent la clé).
      // `headers: { … }` écrit sur place DOIT contenir une authentification :
      // c'est précisément ce bloc-là qui était vide chez FeexPay.
      const litteral = debut.match(/headers:\s*\{([^}]*)\}/);
      if (!litteral) {
        expect(
          /headers,|headers:\s*await\s+authHeaders/.test(debut),
          `${f} : un appel n'envoie aucun en-tête`,
        ).toBe(true);
        continue;
      }
      expect(
        /Authorization|x-api-key|x-secret-key|Ipay-/.test(litteral[1]),
        `${f} : en-têtes sans clé — ${litteral[1].trim().slice(0, 60)}`,
      ).toBe(true);
    }
  }
});

test("aucun appel de passerelle ne contourne le proxy à IP fixe", () => {
  for (const f of ["feexpay.ts", "fedapay.ts", "ipaymoney.ts"]) {
    const src = lire(f);
    // `fetch(` nu vers une URL de fournisseur = sortie par l'IP de Vercel.
    expect(
      /await fetch\(`\$\{(?:base|IPAY_API_BASE|FEEXPAY[A-Z_]*)\}/.test(src),
      `${f} : un appel utilise fetch au lieu de payoutFetch`,
    ).toBe(false);
  }
});

test("le chemin de consultation FeexPay est celui qui existe vraiment", () => {
  const src = lire("feexpay.ts");
  // Vérifié par sondage : seul ce chemin répond 401 sans clé sur api-v2 (la
  // route existe), les autres répondent « Cannot GET » — aucune route.
  expect(src).toContain("/api/transactions/public/single/status/");
  expect(src).not.toContain("/api/transactions/getrequesttopay/integration/${encodeURIComponent(reference)}");
});
