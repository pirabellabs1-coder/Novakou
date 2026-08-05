import { test, expect } from "@playwright/test";
import { z } from "zod";

/**
 * Le nom saisi à l'inscription doit RESSEMBLER à un nom.
 *
 * Le 2026-08-05, un compte s'est inscrit sous « 774401381 » — un numéro de
 * téléphone. La liste des utilisateurs se remplit de comptes sans visage :
 * un vendeur ne peut pas traiter avec ça, et l'admin ne distingue plus un vrai
 * inscrit d'un robot.
 *
 * La règle reste VOLONTAIREMENT permissive : les noms d'Afrique de l'Ouest
 * portent apostrophes, traits d'union, accents et particules. Rejeter un vrai
 * client coûte plus cher que laisser passer un pseudonyme fantaisiste.
 */
const nom = z
  .string()
  .trim()
  .min(3)
  .refine((v) => (v.match(/\p{L}/gu) ?? []).length >= 2)
  .refine((v) => (v.match(/\d/g) ?? []).length <= (v.match(/\p{L}/gu) ?? []).length);

test("un numéro de téléphone est refusé", () => {
  for (const v of ["774401381", "+229 01 57 33 57 26", "0157335726", "12345"]) {
    expect(nom.safeParse(v).success, `« ${v} » ne devrait pas passer`).toBe(false);
  }
});

test("les vrais noms passent, accents et particules compris", () => {
  for (const v of [
    "Gildas Lissanon",
    "N'Guessan Kouamé",
    "Marie-Christine",
    "Abdoul Aziz Bâ",
    "Thierno Bah",
    "Ali",
  ]) {
    expect(nom.safeParse(v).success, `« ${v} » est un vrai nom`).toBe(true);
  }
});

test("un nom contenant quelques chiffres reste accepté", () => {
  // Un pseudonyme comme « Koffi237 » n'est pas un numéro : on ne rejette que
  // ce qui est MAJORITAIREMENT chiffré.
  expect(nom.safeParse("Koffi237").success).toBe(true);
  expect(nom.safeParse("Ab12345678").success, "trop de chiffres").toBe(false);
});

test("un nom trop court est refusé", () => {
  for (const v of ["", " ", "A", "Ab"]) {
    expect(nom.safeParse(v).success).toBe(false);
  }
});
