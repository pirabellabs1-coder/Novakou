import { test, expect } from "@playwright/test";
import {
  DEVISES,
  PAYS_AFFICHAGE,
  convertirDepuisFcfa,
  deviseDuPays,
  formaterPrix,
  montantAFacturer,
  montantVersFcfa,
} from "@/lib/currency/rates";
import { OPERATORS } from "@/lib/payments/registry";
import { PAYS_DESSINES } from "@/components/formations/CountryFlag";

test("l'acheteur est débité exactement du montant qu'il a lu", () => {
  // Affichage et encaissement doivent partager le MÊME calcul, sinon le prix
  // annoncé et le prix débité divergent — et c'est l'acheteur qui le découvre.
  for (const p of PAYS_AFFICHAGE) {
    const d = deviseDuPays(p.code);
    expect(montantAFacturer(5000, d.code).montant).toBe(convertirDepuisFcfa(5000, d));
  }
});

test("une devise inconnue fait ÉCHOUER l'encaissement, jamais passer le montant brut", () => {
  // Le coeur du garde-fou : envoyer 5 000 tel quel sur un opérateur guinéen
  // débiterait 5 000 GNF au lieu de ~73 000. Mieux vaut refuser la vente.
  for (const mauvais of ["", "   ", "EUR", "XYZ", null, undefined]) {
    expect(() => montantAFacturer(5000, mauvais)).toThrow();
  }
  expect(() => montantAFacturer(0, "XOF")).toThrow();
  expect(() => montantAFacturer(-100, "XOF")).toThrow();
});

test("la zone franc n'est pas altérée par la conversion d'encaissement", () => {
  // XOF et XAF sont à parité : le montant transmis doit rester identique, sans
  // quoi on casserait les dix pays qui encaissent déjà.
  for (const code of ["XOF", "XAF"] as const) {
    expect(montantAFacturer(5000, code).montant).toBe(5000);
    expect(montantVersFcfa(5000, code)).toBe(5000);
  }
});

test("le montant annoncé par la passerelle revient en FCFA sans perte de garde-fou", () => {
  // Le garde-fou de livraison refuse quand le montant reçu est INFÉRIEUR au
  // prix. Le retour doit donc toujours atteindre le prix d'origine, sinon une
  // commande payée serait refusée à la livraison.
  for (const p of PAYS_AFFICHAGE) {
    const d = deviseDuPays(p.code);
    for (const prix of [500, 5000, 25000, 100000]) {
      const facture = montantAFacturer(prix, d.code).montant;
      expect(montantVersFcfa(facture, d.code), `${p.nom} à ${prix}`).toBeGreaterThanOrEqual(prix);
    }
  }
});

/**
 * La conversion n'est qu'un AFFICHAGE — mais un affichage faux fait fuir un
 * acheteur au dernier écran, ou pire, lui promet un prix qu'on ne pratique pas.
 */

test("la zone FCFA n'est jamais convertie", () => {
  // XOF et XAF sont à parité fixe. Le moindre écart ici signalerait qu'un taux
  // s'est glissé là où il ne devait pas y en avoir.
  for (const pays of ["BJ", "CI", "SN", "TG", "ML", "NE", "BF", "CM", "CG", "GA"]) {
    expect(convertirDepuisFcfa(5000, deviseDuPays(pays))).toBe(5000);
  }
});

test("un pays inconnu retombe sur le FCFA", () => {
  for (const inconnu of ["", "  ", "ZZ", null, undefined]) {
    expect(deviseDuPays(inconnu).code).toBe("XOF");
  }
});

test("l'arrondi ne descend jamais sous le prix réel", () => {
  // Afficher moins que le prix pratiqué, c'est faire découvrir un montant
  // supérieur au moment de payer.
  for (const devise of Object.values(DEVISES)) {
    for (const prix of [100, 999, 1000, 4999, 25000, 123456]) {
      const affiche = convertirDepuisFcfa(prix, devise);
      expect(affiche).toBeGreaterThanOrEqual(prix * devise.pourUnFcfa - 0.5);
    }
  }
});

test("la conversion reste monotone", () => {
  // Un produit plus cher ne doit jamais s'afficher moins cher qu'un autre.
  const gnf = deviseDuPays("GN");
  let precedent = 0;
  for (const prix of [100, 500, 1000, 5000, 10000, 50000]) {
    const v = convertirDepuisFcfa(prix, gnf);
    expect(v).toBeGreaterThanOrEqual(precedent);
    precedent = v;
  }
});

test("la Guinée s'affiche en GNF, pas en FCFA", () => {
  const gnf = deviseDuPays("GN");
  expect(gnf.code).toBe("GNF");
  expect(convertirDepuisFcfa(5000, gnf)).toBeGreaterThan(50000);
  expect(formaterPrix(5000, gnf)).toContain("GNF");
});

test("chaque pays proposé au visiteur a bien une devise", () => {
  // Un pays listé dans le sélecteur mais absent de la table retomberait
  // silencieusement en FCFA — le visiteur croirait avoir choisi.
  for (const p of PAYS_AFFICHAGE) {
    const d = deviseDuPays(p.code);
    expect(d.pourUnFcfa).toBeGreaterThan(0);
    expect(d.symbole.length).toBeGreaterThan(0);
    // Hors zone franc, retomber sur le FCFA signifierait que le pays a été
    // ajouté au sélecteur sans qu'on lui donne de devise.
    const zoneFranc = ["BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG", "CM", "CF", "TD", "CG", "GQ", "GA"];
    if (!zoneFranc.includes(p.code)) {
      expect(d.code, `${p.nom} retombe sur le FCFA`).not.toBe("XOF");
    }
  }
});

test("toute devise déclarée est atteignable par un pays du sélecteur", () => {
  // Le sens qui manquait. On avait défini LRD et UGX sans jamais proposer le
  // Liberia ni l'Ouganda : une devise que personne ne peut choisir n'existe
  // pas, et rien ne le signalait.
  const atteintes = new Set(PAYS_AFFICHAGE.map((p) => deviseDuPays(p.code).code));
  for (const code of Object.keys(DEVISES)) {
    expect(atteintes.has(code as keyof typeof DEVISES), `${code} n'est proposé à personne`).toBe(true);
  }
});

test("les deux unions monétaires sont listées en entier", () => {
  // Un pays de la zone franc oublié retomberait sur le FCFA par défaut, donc
  // afficherait juste : l'oubli serait invisible jusqu'à ce qu'un acheteur
  // cherche son pays et ne le trouve pas.
  const listes = new Set(PAYS_AFFICHAGE.map((p) => p.code));
  for (const c of ["BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG"]) {
    expect(listes.has(c), `UEMOA : ${c} manque`).toBe(true);
    expect(deviseDuPays(c).code).toBe("XOF");
  }
  for (const c of ["CM", "CF", "TD", "CG", "GQ", "GA"]) {
    expect(listes.has(c), `CEMAC : ${c} manque`).toBe(true);
    expect(deviseDuPays(c).code).toBe("XAF");
  }
});

test("aucun pays n'est proposé deux fois", () => {
  const codes = PAYS_AFFICHAGE.map((p) => p.code);
  expect(new Set(codes).size).toBe(codes.length);
});

test("la devise du registre et celle de l'affichage ne divergent jamais", () => {
  // Deux tables de devises finiraient par se contredire, et l'ecart se paierait
  // en montants debites faux. Le registre decide de ce qu'on facture, le
  // selecteur de ce qu'on affiche : les deux doivent dire la meme chose.
  for (const [cle, op] of Object.entries(OPERATORS)) {
    if (!op.country || op.family === "card") continue;
    const attendue = deviseDuPays(op.country).code;
    expect(op.currency, `${cle} (${op.country})`).toBe(attendue);
  }
});

test("tout opérateur encaissable a une devise convertible", () => {
  // Un operateur dont la devise n'est pas dans la table ferait echouer la vente
  // au moment du paiement — mieux vaut le savoir ici qu'en production.
  for (const [cle, op] of Object.entries(OPERATORS)) {
    if (Object.keys(op.collect).length === 0) continue;
    expect(() => montantAFacturer(5000, op.currency), `${cle}`).not.toThrow();
  }
});

test("le prix affiché reste lisible", () => {
  // Intl sépare les milliers par une espace fine insécable (U+202F) : c'est la
  // typographie française correcte, on la normalise plutôt que de l'interdire.
  const lisible = (s: string) => s.replace(/[  ]/g, " ");
  expect(lisible(formaterPrix(5000, deviseDuPays("BJ")))).toBe("5 000 F CFA");
  expect(lisible(formaterPrix(0, deviseDuPays("GN")))).toBe("0 GNF");
});

test("chaque pays du sélecteur a un vrai drapeau dessiné", () => {
  // Sans ce test, un pays ajouté sans son dessin afficherait une pastille grise
  // avec son code ISO au milieu de vrais drapeaux — exactement ce qui faisait
  // paraître la liste bâclée avec les emoji sous Windows.
  const dessines = new Set(PAYS_DESSINES);
  for (const p of PAYS_AFFICHAGE) {
    expect(dessines.has(p.code.toLowerCase()), `${p.nom} (${p.code}) n'a pas de drapeau`).toBe(true);
  }
});

test("chaque pays encaissable a un vrai drapeau dessiné", () => {
  // L'écran de paiement affiche aussi des drapeaux : un pays ouvert à la vente
  // sans son dessin y apparaîtrait en pastille grise.
  const dessines = new Set(PAYS_DESSINES);
  const paysVente = new Set(
    Object.values(OPERATORS)
      .filter((o) => o.country && Object.keys(o.collect).length > 0)
      .map((o) => o.country.toLowerCase()),
  );
  for (const c of paysVente) {
    expect(dessines.has(c), `${c} est vendable mais n'a pas de drapeau`).toBe(true);
  }
});
