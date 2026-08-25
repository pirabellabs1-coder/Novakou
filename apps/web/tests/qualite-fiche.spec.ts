import { test, expect } from "@playwright/test";
import {
  verifierFiche, dimensionsDepuisEntete, respecteFormat,
  VIGNETTE, BANNIERE, MIN_TITRE, MIN_DESCRIPTION,
} from "../lib/formations/product-quality";
import { SEUIL_MARKETPLACE_FCFA, FILTRE_PRIX_MARKETPLACE } from "../lib/formations/seuils";

/**
 * Une boutique se juge en trois secondes. Un titre de quatre lettres, une
 * description vide ou une vignette étirée décrédibilisent la page — et le
 * vendeur ne le voit pas, parce que sur SON écran ça passe.
 *
 * Ces règles posent un PLANCHER, jamais un plafond : rien ne justifie de
 * brider un vendeur qui écrit long et bien.
 */

const bonneFiche = {
  titre: "Formation complète en marketing digital",
  description:
    "Vous apprendrez à construire une audience, à écrire des pages qui vendent " +
    "et à lancer vos premières campagnes rentables, même en partant de zéro.",
  prix: 15000,
};

test("une fiche correcte passe sans remarque", async () => {
  expect(await verifierFiche(bonneFiche)).toHaveLength(0);
});

test("un titre trop court est refusé, avec le compte exact", async () => {
  const p = await verifierFiche({ ...bonneFiche, titre: "Pack" });
  expect(p.map((x) => x.champ)).toContain("titre");
  expect(p[0].message).toContain(String(MIN_TITRE));
});

test("une description vide de sens est refusée même remplie de balises", async () => {
  // Un éditeur riche produit du HTML : sans compter les caractères VISIBLES,
  // un document vide plein de <p></p> passerait le contrôle.
  const p = await verifierFiche({ ...bonneFiche, description: "<p></p><div><br></div>" });
  expect(p.map((x) => x.champ)).toContain("description");
});

test("le prix ne bloque plus la publication — il ne joue que sur la visibilité marketplace", async () => {
  // Décision fondateur 2026-08-24 : un produit sous le seuil reste publiable
  // et vendable ; il est seulement absent de la marketplace publique.
  expect(await verifierFiche({ ...bonneFiche, prix: 0 })).toHaveLength(0);
  expect(await verifierFiche({ ...bonneFiche, prix: SEUIL_MARKETPLACE_FCFA - 1 })).toHaveLength(0);
  // La clause de visibilité garde le gratuit et le seuil, écarte l'entre-deux.
  const [gratuit, auSeuil] = FILTRE_PRIX_MARKETPLACE.OR;
  expect(gratuit).toEqual({ price: 0 });
  expect(auSeuil).toEqual({ price: { gte: SEUIL_MARKETPLACE_FCFA } });
});

test("aucune limite haute n'est imposée", async () => {
  const p = await verifierFiche({
    ...bonneFiche,
    // Long mais écrit normalement : c'est la LONGUEUR qu'on teste ici, pas
    // la règle anti-majuscules (couverte par son propre test).
    titre: "Titre particulièrement long et détaillé ".repeat(10).trim(),
    description: "D".repeat(20000),
    prix: 5_000_000,
  });
  expect(p, "un vendeur qui écrit long ne doit pas être bridé").toHaveLength(0);
});

test("les dimensions se lisent dans l'en-tête PNG", () => {
  // En-tête PNG minimal : signature + IHDR portant 800×600.
  const b = Buffer.alloc(26);
  b.writeUInt8(0x89, 0); b.write("PNG", 1, "ascii");
  b.writeUInt32BE(800, 16); b.writeUInt32BE(600, 20);
  expect(dimensionsDepuisEntete(b)).toEqual({ largeur: 800, hauteur: 600 });
});

test("trop petit ou mal proportionné est refusé, plus grand est accepté", () => {
  // Vignette : carrée, au moins 600×600.
  expect(respecteFormat({ largeur: 600, hauteur: 600 }, VIGNETTE)).toBe(true);
  expect(respecteFormat({ largeur: 1200, hauteur: 1200 }, VIGNETTE)).toBe(true);
  expect(respecteFormat({ largeur: 400, hauteur: 400 }, VIGNETTE), "trop petit → flou à l'affichage").toBe(false);
  expect(respecteFormat({ largeur: 900, hauteur: 600 }, VIGNETTE), "pas carrée → déformée").toBe(false);
  // Bannière : 16/9, au moins 1280×720.
  expect(respecteFormat({ largeur: 1280, hauteur: 720 }, BANNIERE)).toBe(true);
  expect(respecteFormat({ largeur: 1920, hauteur: 1080 }, BANNIERE)).toBe(true);
  expect(respecteFormat({ largeur: 1280, hauteur: 1280 }, BANNIERE)).toBe(false);
});

test("une image illisible ne bloque JAMAIS le vendeur", async () => {
  // Un doute technique de notre côté ne doit pas ressembler à un refus de sa
  // fiche : sans dimensions lisibles, on laisse passer.
  const p = await verifierFiche({ ...bonneFiche, vignetteUrl: "https://exemple.invalide/x.png" });
  expect(p.filter((x) => x.champ === "vignette")).toHaveLength(0);
});

test("tous les problèmes sont rendus d'un coup", async () => {
  // Corriger une chose à la fois, en revenant cinq fois, décourage.
  // (Le prix ne compte plus parmi les défauts : depuis la décision fondateur
  // du 2026-08-24, il ne bloque plus la publication — il ne joue que sur la
  // visibilité marketplace.)
  const p = await verifierFiche({ titre: "Pack", description: "court", prix: 10 });
  expect(p.map((x) => x.champ)).toEqual(expect.arrayContaining(["titre", "description"]));
  expect(p.length).toBeGreaterThanOrEqual(2);
  expect(MIN_DESCRIPTION).toBeGreaterThan(0);
});
