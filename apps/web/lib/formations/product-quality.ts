/**
 * Règles de qualité d'une fiche produit.
 *
 * Une boutique se juge en trois secondes. Un titre de quatre lettres, une
 * description vide ou une vignette étirée décrédibilisent la page — et le
 * vendeur ne s'en rend pas compte, parce que sur SON écran ça passe.
 *
 * Ces règles posent un plancher, jamais un plafond : on n'a aucune raison de
 * brider un vendeur qui écrit une belle description longue.
 *
 * Un SEUL module, partagé par la création et la modification. Deux jeux de
 * règles séparés finiraient par diverger, et l'un des deux laisserait passer
 * ce que l'autre refuse.
 */

/** Longueur minimale d'un titre : assez pour dire ce que c'est. */
export const MIN_TITRE = 10;

/** Longueur minimale d'une description : deux phrases, pas un mot. */
export const MIN_DESCRIPTION = 80;

/** Prix plancher d'un produit payant, en FCFA. Zéro reste autorisé (gratuit). */
export const PRIX_MINIMUM = 100;

/**
 * Dimensions attendues, telles que le rendu les utilise :
 *   • vignette — carrée, affichée dans les grilles marketplace ;
 *   • bannière — 16/9, en haut de la page produit.
 *
 * On tolère plus grand (on sait réduire), jamais plus petit : agrandir une
 * image floute, et c'est ce flou que voit l'acheteur.
 */
export const VIGNETTE = { largeur: 600, hauteur: 600, ratio: 1 };
export const BANNIERE = { largeur: 1280, hauteur: 720, ratio: 16 / 9 };

/** Écart de proportion toléré : 5 % absorbe les recadrages approximatifs. */
const TOLERANCE_RATIO = 0.05;

export type Dimensions = { largeur: number; hauteur: number };

/**
 * Lit les dimensions d'une image SANS la télécharger entièrement.
 *
 * On ne demande que les premiers octets : l'en-tête d'un PNG, d'un JPEG ou
 * d'un WebP porte déjà la taille. Télécharger des mégaoctets pour lire deux
 * nombres ralentirait chaque enregistrement de fiche.
 *
 * Rend `null` si le format est inconnu ou l'image injoignable — on ne bloque
 * JAMAIS un vendeur parce qu'une image n'a pas pu être lue : un doute
 * technique de notre côté ne doit pas ressembler à un refus de sa fiche.
 */
export async function lireDimensions(url: string): Promise<Dimensions | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(url, {
      headers: { Range: "bytes=0-65535" },
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (!res.ok && res.status !== 206) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return dimensionsDepuisEntete(buf);
  } catch {
    return null;
  }
}

/** Extrait la taille de l'en-tête binaire, par format. */
export function dimensionsDepuisEntete(b: Buffer): Dimensions | null {
  // ── PNG : la taille est dans le premier chunk IHDR, à offset fixe.
  if (b.length > 24 && b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") {
    return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20) };
  }

  // ── WebP : conteneur RIFF, trois variantes de bloc.
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const type = b.toString("ascii", 12, 16);
    if (type === "VP8 " && b.length > 30) {
      return { largeur: b.readUInt16LE(26) & 0x3fff, hauteur: b.readUInt16LE(28) & 0x3fff };
    }
    if (type === "VP8L" && b.length > 25) {
      const bits = b.readUInt32LE(21);
      return { largeur: (bits & 0x3fff) + 1, hauteur: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (type === "VP8X" && b.length > 30) {
      return {
        largeur: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
        hauteur: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
      };
    }
  }

  // ── JPEG : il faut parcourir les segments jusqu'au marqueur SOF.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marqueur = b[i + 1];
      // SOF0..SOF15, en excluant les marqueurs qui ne portent pas de taille.
      if (marqueur >= 0xc0 && marqueur <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marqueur)) {
        return { hauteur: b.readUInt16BE(i + 5), largeur: b.readUInt16BE(i + 7) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Vrai si l'image respecte le format attendu (taille ET proportions). */
export function respecteFormat(d: Dimensions, attendu: { largeur: number; hauteur: number; ratio: number }): boolean {
  if (d.largeur < attendu.largeur || d.hauteur < attendu.hauteur) return false;
  const ratio = d.largeur / d.hauteur;
  return Math.abs(ratio - attendu.ratio) / attendu.ratio <= TOLERANCE_RATIO;
}

/** Message expliquant CE QU'IL FAUT FAIRE, pas seulement ce qui ne va pas. */
export function messageFormat(
  quoi: "vignette" | "bannière",
  d: Dimensions,
  attendu: { largeur: number; hauteur: number },
): string {
  const forme = quoi === "vignette" ? "carrée" : "au format 16/9";
  return (
    `La ${quoi} fait ${d.largeur}×${d.hauteur} px. Il la faut ${forme}, ` +
    `d'au moins ${attendu.largeur}×${attendu.hauteur} px — sinon elle s'affiche ` +
    `déformée ou floue sur la boutique.`
  );
}

export type ProblemeFiche = { champ: string; message: string };

/**
 * Contrôle complet d'une fiche. Rend la LISTE des problèmes, pas seulement le
 * premier : corriger une chose à la fois, en revenant cinq fois, décourage.
 */
export async function verifierFiche(p: {
  titre?: string | null;
  description?: string | null;
  prix?: number | null;
  vignetteUrl?: string | null;
  banniereUrl?: string | null;
}): Promise<ProblemeFiche[]> {
  const out: ProblemeFiche[] = [];

  const titre = (p.titre ?? "").trim();
  if (titre.length < MIN_TITRE) {
    out.push({
      champ: "titre",
      message: `Le titre fait ${titre.length} caractère(s). Il en faut au moins ${MIN_TITRE} pour qu'un acheteur comprenne ce qu'il achète.`,
    });
  }

  // La description peut être du texte riche : on compte les caractères
  // VISIBLES, sinon un document vide plein de balises passerait le contrôle.
  const description = (p.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (description.length < MIN_DESCRIPTION) {
    out.push({
      champ: "description",
      message: `La description fait ${description.length} caractère(s). Il en faut au moins ${MIN_DESCRIPTION} : dites ce que l'acheteur obtient et à qui c'est destiné.`,
    });
  }

  // Le gratuit reste possible ; c'est le payant dérisoire qu'on écarte.
  const prix = typeof p.prix === "number" ? p.prix : NaN;
  if (Number.isFinite(prix) && prix > 0 && prix < PRIX_MINIMUM) {
    out.push({
      champ: "prix",
      message: `Le prix est de ${Math.round(prix)} FCFA. Le minimum est de ${PRIX_MINIMUM} FCFA — en dessous, les frais de la passerelle dépassent le montant encaissé.`,
    });
  }

  const [vignette, banniere] = await Promise.all([
    p.vignetteUrl ? lireDimensions(p.vignetteUrl) : Promise.resolve(null),
    p.banniereUrl ? lireDimensions(p.banniereUrl) : Promise.resolve(null),
  ]);
  if (vignette && !respecteFormat(vignette, VIGNETTE)) {
    out.push({ champ: "vignette", message: messageFormat("vignette", vignette, VIGNETTE) });
  }
  if (banniere && !respecteFormat(banniere, BANNIERE)) {
    out.push({ champ: "banniere", message: messageFormat("bannière", banniere, BANNIERE) });
  }

  return out;
}
