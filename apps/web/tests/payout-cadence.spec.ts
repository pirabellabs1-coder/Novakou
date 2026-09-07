import { test, expect } from "@playwright/test";
import { sonderMaintenant } from "../lib/payout/cadence-sonde";

/**
 * Cadence des sondes de statut FeexPay.
 *
 * Ces sondes sortent par le proxy à IP fixe, dont le forfait se compte en
 * REQUÊTES. Une cadence trop serrée ne casse rien de visible : elle vide le
 * quota, le proxy se met à refuser, le code repart en direct, et FeexPay rejette
 * l'IP dynamique. Les versements sont alors refusés pour un motif qui ne dit
 * rien de la vraie cause — c'est exactement ce qui s'est produit en août 2026.
 *
 * D'où un test sur le COÛT, pas seulement sur la logique.
 */

const H = 3_600_000;
const J = 86_400_000;

/** Un passage du cron toutes les 10 minutes, sur `jours` jours. */
function compterSondes(ageInitialMs: number, jours: number): number {
  const cree = new Date("2026-09-01T00:00:00Z");
  const debut = cree.getTime() + ageInitialMs;
  let n = 0;
  for (let t = debut; t < debut + jours * J; t += 10 * 60_000) {
    if (sonderMaintenant(cree, new Date(t))) n++;
  }
  return n;
}

test("un versement frais est sondé à chaque passage", () => {
  const cree = new Date("2026-09-01T00:00:00Z");
  for (const minute of [0, 10, 20, 30, 40, 50]) {
    const t = new Date(cree.getTime() + 30 * 60_000);
    t.setUTCMinutes(minute);
    expect(sonderMaintenant(cree, t), `minute ${minute}`).toBe(true);
  }
});

test("passé une heure, une sonde par heure seulement", () => {
  const cree = new Date("2026-09-01T00:00:00Z");
  const base = cree.getTime() + 6 * H;
  const debutHeure = new Date(base);
  debutHeure.setUTCMinutes(0);
  const milieuHeure = new Date(base);
  milieuHeure.setUTCMinutes(30);
  expect(sonderMaintenant(cree, debutHeure)).toBe(true);
  expect(sonderMaintenant(cree, milieuHeure)).toBe(false);
});

test("passé un jour, quatre sondes par jour", () => {
  const cree = new Date("2026-09-01T00:00:00Z");
  const jour = (h: number) => {
    const d = new Date(cree.getTime() + 5 * J);
    d.setUTCHours(h, 0, 0, 0);
    return d;
  };
  for (const h of [1, 7, 13, 19]) expect(sonderMaintenant(cree, jour(h)), `${h}h`).toBe(true);
  for (const h of [0, 3, 9, 15, 22]) expect(sonderMaintenant(cree, jour(h)), `${h}h`).toBe(false);
});

test("un versement bloqué 14 jours reste loin du forfait proxy", () => {
  // Forfait Fixie « commuter » : 2 500 requêtes/mois, partagées par TOUS les
  // versements. Sans palier, un seul retrait bloqué en consommait 2 016 (81 %).
  const FORFAIT_MENSUEL = 2500;
  const sondes = compterSondes(0, 14);

  expect(
    sondes,
    `Un seul versement bloqué consomme ${sondes} requêtes du proxy sur 14 jours. ` +
      "Au-delà de 5 % du forfait mensuel, un deuxième retrait bloqué suffit à " +
      "vider le quota : le proxy refuse, les versements repartent par l'IP " +
      "dynamique de Vercel, et FeexPay les rejette tous. Si la cadence doit " +
      "vraiment être resserrée, augmenter le forfait Fixie DANS LE MÊME COMMIT.",
  ).toBeLessThan(FORFAIT_MENSUEL * 0.05);
});
