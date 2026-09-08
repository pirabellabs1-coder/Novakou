import { test, expect } from "@playwright/test";
import {
  visiteursParPays,
  visiteursUniques,
  PAYS_INCONNU,
  tauxRebond,
  type EvenementSuivi,
} from "../lib/formations/stats-pays";

/**
 * « D'ou viennent mes visiteurs ? » est la question sur laquelle un vendeur
 * decide ou il met son budget publicitaire. Un chiffre faux ici ne se voit
 * pas : il reste plausible, et l'argent part au mauvais endroit.
 *
 * Deux pieges guettent cette agregation, tous deux deja rencontres :
 *   - compter des PAGES VUES au lieu de PERSONNES (un curieux qui ouvre huit
 *     fiches n'est pas huit visiteurs) ;
 *   - agreger des evenements NON restreints au vendeur — c'etait le cas de la
 *     ligne « Visiteurs » du tunnel, qui affichait a chacun le trafic de toute
 *     la plateforme.
 */

const e = (sessionId: string, country?: string | null): EvenementSuivi => ({ sessionId, country });

test("un visiteur qui ouvre plusieurs pages reste UN visiteur", () => {
  const r = visiteursParPays([e("s1", "CI"), e("s1", "CI"), e("s1", "CI")]);
  expect(r).toHaveLength(1);
  expect(r[0]).toMatchObject({ country: "CI", visitors: 1, views: 3 });
});

test("deux personnes du meme pays comptent pour deux", () => {
  const r = visiteursParPays([e("s1", "SN"), e("s2", "SN")]);
  expect(r[0]).toMatchObject({ country: "SN", visitors: 2, views: 2 });
});

test("les pays sont classes par nombre de visiteurs", () => {
  const r = visiteursParPays([
    e("s1", "CI"),
    e("s2", "SN"), e("s3", "SN"), e("s4", "SN"),
    e("s5", "BJ"), e("s6", "BJ"),
  ]);
  expect(r.map((x) => x.country)).toEqual(["SN", "BJ", "CI"]);
});

test("a egalite de visiteurs, le pays le plus consulte passe devant", () => {
  // Sans ce depart, l'ordre dependrait de l'ordre d'arrivee des evenements —
  // le classement changerait d'un rafraichissement a l'autre.
  const r = visiteursParPays([e("s1", "TG"), e("s2", "ML"), e("s2", "ML")]);
  expect(r.map((x) => x.country)).toEqual(["ML", "TG"]);
});

test("le pays de la session prend le relais quand l'evenement n'en porte pas", () => {
  // Le premier appel d'une session renseigne le pays ; les suivants l'omettent.
  const paysDeSession = new Map([["s1", "CM"]]);
  const r = visiteursParPays([e("s1", null), e("s1", undefined)], paysDeSession);
  expect(r[0]).toMatchObject({ country: "CM", visitors: 1, views: 2 });
});

test("un pays non geolocalise n'est pas invente, il est marque inconnu", () => {
  // Le ranger dans un pays plausible serait pire que de l'avouer.
  const r = visiteursParPays([e("s1", null), e("s2", "")]);
  expect(r[0]).toMatchObject({ country: PAYS_INCONNU, visitors: 2 });
});

test("les libelles de pays sont normalises en code ISO-2", () => {
  // « Côte d'Ivoire » et « CI » sont le meme pays : sans normalisation, ils
  // apparaissaient sur deux lignes, chacune avec la moitie du trafic.
  const r = visiteursParPays([e("s1", "CI"), e("s2", "Côte d'Ivoire")]);
  expect(r).toHaveLength(1);
  expect(r[0]).toMatchObject({ country: "CI", visitors: 2 });
});

test("les codes non geographiques ne deviennent pas des pays", () => {
  // Cloudflare envoie « XX » quand il ne sait pas geolocaliser et « T1 » pour
  // Tor. Ils ont la FORME d'un code pays et traversaient donc la collecte puis
  // la normalisation : le vendeur voyait une ligne « XX », drapeau casse,
  // qu'il prenait pour un pays reel.
  const r = visiteursParPays([e("s1", "XX"), e("s2", "T1"), e("s3", "ZZ")]);
  expect(r).toHaveLength(1);
  expect(r[0]).toMatchObject({ country: PAYS_INCONNU, visitors: 3 });
});

test("la liste est bornee aux pays les plus frequents", () => {
  // Vingt pays REELS : le referentiel refuse les codes inventes, et un test
  // qui les melangerait mesurerait la troncature sur une seule ligne « ?? ».
  const codes = [
    "CI", "SN", "BJ", "TG", "ML", "BF", "NE", "CM", "GA", "CG",
    "CD", "RW", "UG", "ZM", "KE", "TZ", "GN", "SL", "MA", "TN",
  ];
  const beaucoup = codes.map((c, i) => e(`s${i}`, c));
  expect(visiteursParPays(beaucoup, new Map(), 15)).toHaveLength(15);
  expect(visiteursParPays(beaucoup, new Map(), 5)).toHaveLength(5);
});

test("aucun evenement ne produit aucune ligne, pas une ligne a zero", () => {
  expect(visiteursParPays([])).toEqual([]);
});

test("les visiteurs uniques du tunnel comptent des personnes, pas des pages", () => {
  // C'est la correction du bug : la ligne « Visiteurs » comptait les page_view
  // de TOUTE la plateforme. Elle compte desormais des sessions du vendeur.
  expect(visiteursUniques([e("s1"), e("s1"), e("s2"), e("s2"), e("s2")])).toBe(2);
  expect(visiteursUniques([])).toBe(0);
});

// ── Taux de rebond ────────────────────────────────────────────────────────

/**
 * Le taux de rebond juge la qualite d'une page d'arrivee : trop haut, la
 * publicite amene les mauvaises personnes, ou la page ne tient pas sa promesse.
 * Un vendeur peut couper une campagne sur ce chiffre — il doit etre juste.
 */

const ev = (sessionId: string, type: string): EvenementSuivi => ({ sessionId, type });

test("une session d'une seule page, sans rien faire, est un rebond", () => {
  expect(tauxRebond([ev("s1", "shop_view")])).toMatchObject({ sessions: 1, rebonds: 1, taux: 100 });
});

test("une session qui lit deux pages n'est pas un rebond", () => {
  expect(tauxRebond([ev("s1", "shop_view"), ev("s1", "product_view")])).toMatchObject({
    sessions: 1,
    rebonds: 0,
    taux: 0,
  });
});

test("un visiteur d'une seule page qui CLIQUE n'est pas un rebond", () => {
  // Le point de la definition : compter cet acheteur potentiel comme un rebond
  // donnerait au vendeur un chiffre decourageant et faux.
  const r = tauxRebond([ev("s1", "product_view"), ev("s1", "add_to_cart")]);
  expect(r).toMatchObject({ sessions: 1, rebonds: 0 });
});

test("un achat depuis une seule page n'est jamais un rebond", () => {
  expect(tauxRebond([ev("s1", "product_view"), ev("s1", "purchase")]).rebonds).toBe(0);
});

test("le taux se calcule sur l'ensemble des sessions", () => {
  const r = tauxRebond([
    ev("s1", "shop_view"),                          // rebond
    ev("s2", "shop_view"),                          // rebond
    ev("s3", "shop_view"), ev("s3", "product_view"), // non
    ev("s4", "product_view"), ev("s4", "cta_click"), // non
  ]);
  expect(r).toMatchObject({ sessions: 4, rebonds: 2, taux: 50 });
});

test("le taux garde une decimale plutot que d'arrondir a l'entier", () => {
  // 1 rebond sur 3 = 33,3 % : arrondir a 33 % suffirait, mais la decimale rend
  // les petites variations lisibles quand le trafic est faible.
  const r = tauxRebond([
    ev("s1", "shop_view"),
    ev("s2", "shop_view"), ev("s2", "product_view"),
    ev("s3", "shop_view"), ev("s3", "product_view"),
  ]);
  expect(r.taux).toBe(33.3);
});

test("sans aucune session, le taux est indetermine et non pas zero", () => {
  // « 0 % de rebond » se lit comme une excellente nouvelle. C'est un piege :
  // cela veut dire « aucune donnee ». L'ecran doit afficher « — ».
  expect(tauxRebond([])).toMatchObject({ sessions: 0, rebonds: 0, taux: null });
});

test("un evenement sans type est traite en consultation, pas en interaction", () => {
  // Prudence sur la collecte ancienne : surestimer l'engagement flatterait le
  // chiffre, ce qui est la pire erreur possible sur cet indicateur.
  expect(tauxRebond([{ sessionId: "s1" }]).rebonds).toBe(1);
});

test("une session qui n'a QU'une interaction ne compte pas comme un rebond", () => {
  expect(tauxRebond([ev("s1", "cta_click")])).toMatchObject({ sessions: 1, rebonds: 0 });
});
