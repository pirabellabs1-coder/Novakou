/**
 * Formats déterministes (identiques serveur et navigateur) : passer par
 * `toLocaleDateString` exposait à une hydratation divergente selon l'ICU.
 */

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « 2024-03-08T… » → « mars 2024 » ; chaîne vide si la date est invalide. */
export function moisAnnee(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** « 8 mars 2024 ». */
export function dateLongue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const j = d.getUTCDate();
  return `${j === 1 ? "1er" : j} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** « 12500 » → « 12 500 » (espace fine insécable). */
export function nombre(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** « 4.666 » → « 4,7 ». */
export function note(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

/** Pluriel simple : « 1 avis », « 3 produits ». */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${nombre(n)} ${n > 1 ? plurielForme : singulier}`;
}

/** Prénom d'un nom complet, capitalisé ; repli quand il manque. */
export function prenom(nom: string | null | undefined, repli = "Un élève"): string {
  const p = (nom ?? "").trim().split(/\s+/)[0] ?? "";
  if (!p) return repli;
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

/** Première phrase (ou ~160 caractères) d'une bio, pour l'accroche du hero. */
export function accroche(bio: string | null | undefined, max = 160): string {
  const texte = (bio ?? "").replace(/\s+/g, " ").trim();
  if (!texte) return "";
  const phrase = texte.match(/^.+?[.!?](\s|$)/)?.[0]?.trim();
  const base = phrase && phrase.length <= max ? phrase : texte;
  if (base.length <= max) return base;
  return `${base.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
