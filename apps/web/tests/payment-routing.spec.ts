import { test, expect } from "@playwright/test";
import {
  OPERATORS,
  PROVIDERS,
  routeFor,
  providersFor,
  resolveOperatorCode,
  countryFromPhone,
  listOperators,
} from "../lib/payments/registry";

/**
 * Cohérence du routage de paiement.
 *
 * Ces tests ne parlent à aucune passerelle : ils verrouillent le REGISTRE, qui
 * décide où part l'argent. Une erreur ici n'échoue pas forcément de façon
 * visible — elle peut router un paiement vers le mauvais réseau, ou faire
 * refuser un pays qu'on sert réellement. D'où un filet permanent.
 */

/** Réseaux acceptés par FeexPay, relevés sur leur SDK officiel. */
const FEEXPAY_NETWORKS = new Set([
  // NETWORK_API_MAPPING du SDK, pays par pays.
  "MTN", "MOOV", "CELTIIS BJ", "CORIS",   // Bénin
  "MTN CI", "MOOV CI", "ORANGE CI", "WAVE CI", // Côte d'Ivoire
  "ORANGE BF", "MOOV BF",                  // Burkina Faso
  "MTN CG",                                // Congo Brazzaville
  "ORANGE SN", "FREE SN",                  // Sénégal
  "MOOV TG", "TOGOCOM TG",                 // Togo
]);

/** Modes acceptés par FedaPay (POST /v1/transactions/{mode}), doc officielle. */
const FEDAPAY_MODES = new Set([
  "mtn_open", "moov", "sbin",       // Bénin
  "mtn_ci",                          // Côte d'Ivoire
  "moov_tg", "togocel",              // Togo
  "free_sn",                         // Sénégal
  "airtel_ne",                       // Niger
  "mtn_open_gn",                     // Guinée
]);

test("aucun code réseau FeexPay inventé", () => {
  const inconnus: string[] = [];
  for (const [op] of Object.entries(OPERATORS)) {
    const code = routeFor(op, "feexpay", "collect")?.code;
    if (code && !FEEXPAY_NETWORKS.has(code)) inconnus.push(`${op} → « ${code} »`);
  }
  expect(inconnus, "réseaux absents du SDK FeexPay").toEqual([]);
});

test("aucun mode FedaPay inventé", () => {
  // Un mode inconnu de FedaPay ne fait pas qu'échouer : il peut router le
  // paiement vers un autre opérateur que celui choisi par l'acheteur.
  const inconnus: string[] = [];
  for (const [op] of Object.entries(OPERATORS)) {
    for (const dir of ["collect", "payout"] as const) {
      const route = routeFor(op, "fedapay", dir);
      // Une route « hébergée » n'a pas de mode : elle redirige vers la page
      // sécurisée du fournisseur au lieu de pousser un débit.
      if (!route || route.params?.hosted) continue;
      if (!FEDAPAY_MODES.has(route.code)) inconnus.push(`${op}.${dir} → « ${route.code} »`);
    }
  }
  expect(inconnus, "modes absents de la doc FedaPay").toEqual([]);
});

test("chaque opérateur déclare un pays, une devise et une famille cohérents", () => {
  const invalides: string[] = [];
  for (const [op, entry] of Object.entries(OPERATORS)) {
    // Le Mobile Money est national : « orange_ci » n'existe pas au Sénégal.
    // La carte, elle, est pan-régionale et se rattache à une ZONE MONÉTAIRE —
    // son pays est volontairement vide, sinon elle ne serait proposée que dans
    // un seul pays de la zone.
    if (entry.family === "mobile_money" && !/^[a-z]{2}$/.test(entry.country)) {
      invalides.push(`${op}: pays « ${entry.country} » invalide pour du mobile money`);
    }
    if (entry.family === "card" && entry.country !== "") {
      invalides.push(`${op}: la carte doit couvrir toute la zone, pas le seul pays « ${entry.country} »`);
    }
    if (entry.currency !== "XOF" && entry.currency !== "XAF") invalides.push(`${op}: devise « ${entry.currency} »`);
    if (entry.family !== "mobile_money" && entry.family !== "card") invalides.push(`${op}: famille « ${entry.family} »`);
    if (!entry.label.trim()) invalides.push(`${op}: libellé vide`);
  }
  expect(invalides).toEqual([]);
});

test("un opérateur sans aucune route d'encaissement n'est jamais proposé", () => {
  // `isSupported` sert de garde côté produit : il doit refléter les routes.
  for (const [op] of Object.entries(OPERATORS)) {
    const routes = providersFor(op, "collect");
    const supported = routes.length > 0;
    expect(
      supported,
      `${op} : providersFor renvoie ${routes.length} route(s)`,
    ).toBe(routes.length > 0);
  }
});

test("les codes génériques du checkout se résolvent au bon opérateur pays", () => {
  const cas: Array<[string, string, string]> = [
    ["orange_money", "sn", "orange_sn"],
    ["orange_money", "ci", "orange_ci"],
    ["orange_money", "bf", "orange_bf"],
    ["wave", "ci", "wave_ci"],
    ["mtn_momo", "ci", "mtn_ci"],
    ["mtn_momo", "bj", "mtn_bj"],
    ["moov_money", "bj", "moov_bj"],
    ["moov_money", "tg", "moov_tg"],
  ];
  for (const [generique, pays, attendu] of cas) {
    expect(resolveOperatorCode(generique, { country: pays }), `${generique} + ${pays}`).toBe(attendu);
  }
});

test("un code déjà spécifique au pays passe tel quel", () => {
  // L'écran unique renvoie directement « orange_sn » : la résolution ne doit
  // pas le réécrire en fonction d'un pays différent.
  expect(resolveOperatorCode("orange_sn", { country: "ci" })).toBe("orange_sn");
  expect(resolveOperatorCode("mtn_bj", { country: "sn" })).toBe("mtn_bj");
});

test("sans pays ni numéro, aucun opérateur n'est deviné", () => {
  // Deviner ici enverrait le paiement vers un réseau au hasard.
  expect(resolveOperatorCode("orange_money", {})).toBeNull();
});

test("l'indicatif téléphonique identifie le pays", () => {
  const cas: Array<[string, string]> = [
    ["221771234567", "sn"],
    ["2250700000000", "ci"],
    ["22990000000", "bj"],
    ["22890000000", "tg"],
    ["22670000000", "bf"],
  ];
  for (const [numero, pays] of cas) {
    expect(countryFromPhone(numero), numero).toBe(pays);
  }
});

test("le numéro suffit à résoudre l'opérateur quand le pays manque", () => {
  expect(resolveOperatorCode("orange_money", { phone: "221771234567" })).toBe("orange_sn");
  expect(resolveOperatorCode("wave", { phone: "2250700000000" })).toBe("wave_ci");
});

test("tout opérateur encaissable appartient à un pays listé", () => {
  const encaissables = listOperators({ direction: "collect" });
  expect(encaissables.length, "aucun opérateur encaissable").toBeGreaterThan(0);
  for (const op of encaissables) {
    expect(OPERATORS[op.code], `${op.code} absent de OPERATORS`).toBeTruthy();
  }
});

test("un pays payable uniquement par carte reste proposable", () => {
  // Le calcul des pays ignorait les entrées « carte » (qui n'ont pas de pays) :
  // tout pays sans mobile money encaissable disparaissait de la liste, alors
  // que la carte y fonctionnait. Le Mali était invendable en silence.
  const paysXof = new Set(
    Object.values(OPERATORS)
      .filter((o) => o.currency === "XOF" && o.country)
      .map((o) => o.country),
  );
  expect(paysXof.has("ml"), "le Mali doit rester connu du registre").toBe(true);

  // La carte XOF doit avoir au moins une route, sinon aucun pays sans mobile
  // money encaissable ne serait vendable.
  expect(providersFor("card_xof", "collect").length).toBeGreaterThan(0);
});

test("iPay Money ne declare que des types de paiement connus", () => {
  // Leur API route vers le bon operateur d'apres le NUMERO : deux valeurs
  // suffisent, et en inventer une troisieme ferait echouer la transaction.
  const attendus = new Set(["mobile", "card"]);
  const inconnus: string[] = [];
  for (const [op] of Object.entries(OPERATORS)) {
    const code = routeFor(op, "ipaymoney", "collect")?.code;
    if (code && !attendus.has(code)) inconnus.push(`${op} → « ${code} »`);
  }
  expect(inconnus).toEqual([]);
});

test("chaque operateur du Niger a bien une passerelle", () => {
  const niger = Object.entries(OPERATORS).filter(([, o]) => o.country === "ne");
  expect(niger.length, "aucun operateur nigerien").toBeGreaterThan(0);
  for (const [code] of niger) {
    expect(providersFor(code, "collect").length, `${code} sans passerelle`).toBeGreaterThan(0);
  }
});

test("la carte reste servie par plusieurs passerelles", () => {
  // La carte est le seul moyen de certains pays (Mali) : une passerelle unique
  // y couperait toutes les ventes en cas de panne.
  expect(providersFor("card_xof", "collect").length).toBeGreaterThan(1);
});

/**
 * Une CARTE ne se confirme pas sur un téléphone : elle exige une page
 * sécurisée, et nous n'avons pas le droit de collecter un numéro de carte sur
 * nos pages (PCI-DSS).
 *
 * Le classement général met la page hébergée en DERNIER — c'est juste pour le
 * Mobile Money, où l'on veut garder l'acheteur chez nous. Appliqué à la carte,
 * il faisait tenter d'abord des passerelles qui ne rendaient aucune page :
 * l'acheteur atterrissait sur « Confirmez sur votre téléphone » et regardait
 * tourner indéfiniment.
 */
test("la carte part d'abord sur une page sécurisée", () => {
  const enc = PROVIDERS.filter((p) => p.directions.includes("collect"));
  const routes = enc
    .map((p) => ({ id: p.id, route: routeFor("card_xof", p.id, "collect") }))
    .filter((x) => x.route);
  expect(routes.length, "aucune passerelle ne sert la carte").toBeGreaterThan(0);
  // Au moins une doit héberger la page — sinon la carte est invendable.
  expect(routes.some((x) => x.route?.params?.hosted === "1")).toBe(true);
});

test("le Mobile Money garde le débit direct en tête", () => {
  // L'inverse de la carte : ici on veut que l'acheteur reste sur notre page.
  const r = routeFor("mtn_bj", "feexpay", "collect");
  expect(r, "FeexPay doit servir MTN Bénin en débit direct").toBeTruthy();
  expect(r?.params?.hosted).toBeUndefined();
});
