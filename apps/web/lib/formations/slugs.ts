import { prisma } from "@/lib/prisma";

/**
 * Slugs publics (boutiques, produits, formations).
 *
 * Deux règles qui n'étaient pas respectées avant :
 *  1. Un slug ne doit PAS porter de suffixe aléatoire quand le nom est libre.
 *     `Date.now().toString(36)` était ajouté systématiquement, d'où des URLs
 *     du type /boutique/gildas-lissanon-mohmv3rm, illisibles et sans valeur SEO.
 *  2. On ne coupe jamais en plein mot. `.slice(0, 80)` produisait des URLs
 *     comme …-paye-en-euros-ou-en-doll (« dollars » amputé).
 */

export type SlugEntity = "shop" | "product" | "formation";

/** Mots vides retirés seulement si le titre est trop long : ils n'apportent rien en SEO. */
const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "l",
  "et", "ou", "a", "au", "aux", "en", "dans", "pour", "par", "sur",
  "avec", "sans", "vos", "votre", "vous", "ses", "son", "sa", "ce", "cet", "cette",
]);

/** Segments qu'un slug ne doit jamais occuper : ils masqueraient une vraie route. */
export const RESERVED_SLUGS = new Set([
  "a-propos", "aide", "contact", "plan-du-site", "mentions-legales",
  "conditions", "confidentialite", "cookies", "by-domain", "api",
  "admin", "checkout", "panier", "connexion", "inscription", "explorer",
]);

/** Normalise en minuscules sans accents, séparé par des tirets. Aucune troncature. */
export function slugifyRaw(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Slug lisible et borné, coupé UNIQUEMENT sur une frontière de mot.
 * Au-delà de `maxLength`, on retire d'abord les mots vides, puis on tronque
 * au dernier tiret — jamais au milieu d'un mot.
 */
export function slugify(text: string, maxLength = 70): string {
  const raw = slugifyRaw(text);
  if (!raw) return "";
  if (raw.length <= maxLength) return raw;

  // 1re passe : sans les mots vides.
  const words = raw.split("-").filter(Boolean);
  const trimmed = words.filter((w) => !STOP_WORDS.has(w));
  const candidate = (trimmed.length >= 3 ? trimmed : words).join("-");
  if (candidate.length <= maxLength) return candidate;

  // 2e passe : on empile les mots tant qu'on tient dans la limite.
  const out: string[] = [];
  let len = 0;
  for (const w of candidate.split("-")) {
    const next = len === 0 ? w.length : len + 1 + w.length;
    if (next > maxLength) break;
    out.push(w);
    len = next;
  }
  // Un seul mot plus long que la limite : là seulement, on coupe net.
  return out.length > 0 ? out.join("-") : candidate.slice(0, maxLength);
}

async function slugTaken(entity: SlugEntity, slug: string): Promise<boolean> {
  if (entity === "shop") return !!(await prisma.vendorShop.findUnique({ where: { slug }, select: { id: true } }));
  if (entity === "product") return !!(await prisma.digitalProduct.findUnique({ where: { slug }, select: { id: true } }));
  return !!(await prisma.formation.findUnique({ where: { slug }, select: { id: true } }));
}

/**
 * Renvoie le slug le plus propre encore disponible.
 * Le nom est libre → on le garde tel quel (pas de suffixe parasite).
 * Sinon on incrémente lisiblement : -2, -3… puis, en dernier recours seulement,
 * un suffixe temporel pour garantir la sortie de boucle.
 */
export async function uniqueSlug(
  entity: SlugEntity,
  desired: string,
  fallback = "boutique",
): Promise<string> {
  const base = slugify(desired) || fallback;
  // Un slug réservé serait masqué par une vraie route : on le préfixe.
  const safeBase = RESERVED_SLUGS.has(base) ? `${base}-${fallback}` : base;

  if (!(await slugTaken(entity, safeBase))) return safeBase;

  for (let i = 2; i <= 50; i++) {
    const candidate = `${safeBase}-${i}`;
    if (!(await slugTaken(entity, candidate))) return candidate;
  }
  return `${safeBase}-${Date.now().toString(36)}`;
}

/**
 * Enregistre l'ancien slug pour que son URL réponde 301 au lieu de 404.
 * À appeler à CHAQUE changement de slug. Ne doit jamais faire échouer
 * l'opération métier appelante : en cas d'erreur on journalise et on continue.
 */
export async function recordSlugChange(
  entity: SlugEntity,
  oldSlug: string,
  newSlug: string,
): Promise<void> {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return;
  try {
    await prisma.$transaction([
      // L'ancien slug pointe désormais vers la nouvelle cible.
      prisma.slugHistory.upsert({
        where: { entity_oldSlug: { entity, oldSlug } },
        create: { entity, oldSlug, newSlug },
        update: { newSlug },
      }),
      // Renommages en chaîne (a → b → c) : on recâble les anciennes entrées
      // directement sur la cible finale, pour éviter les redirections en cascade.
      prisma.slugHistory.updateMany({
        where: { entity, newSlug: oldSlug },
        data: { newSlug },
      }),
      // Le nouveau slug est de nouveau actif : il ne doit plus rediriger.
      prisma.slugHistory.deleteMany({ where: { entity, oldSlug: newSlug } }),
    ]);
  } catch (err) {
    console.error("[slugs] recordSlugChange:", err);
  }
}

/** Slug courant correspondant à un ancien slug, ou null si inconnu. */
export async function resolveOldSlug(
  entity: SlugEntity,
  oldSlug: string,
): Promise<string | null> {
  if (!oldSlug) return null;
  try {
    const row = await prisma.slugHistory.findUnique({
      where: { entity_oldSlug: { entity, oldSlug } },
      select: { newSlug: true },
    });
    if (!row || row.newSlug === oldSlug) return null;
    // On ne redirige que vers une cible qui existe réellement.
    return (await slugTaken(entity, row.newSlug)) ? row.newSlug : null;
  } catch (err) {
    console.error("[slugs] resolveOldSlug:", err);
    return null;
  }
}
