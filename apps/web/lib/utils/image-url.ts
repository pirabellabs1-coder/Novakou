/**
 * Avatar / image URL helpers — upscale to a sensible size for hero displays
 * without going through next/image (most usage sites already use raw <img>).
 *
 * Most user.image values come from one of:
 *  - Google OAuth: `https://lh3.googleusercontent.com/a/...=s96-c`
 *    → bump the `s` size param to request a larger source.
 *  - Cloudinary uploads: `https://res.cloudinary.com/<cloud>/image/upload/.../public_id.ext`
 *    → inject `c_fill,w_<size>,h_<size>,q_auto,f_auto,g_face` transforms.
 *  - Anything else → return as-is.
 */

const GOOGLE_HOSTS = ["googleusercontent.com"];
const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

/**
 * Return a higher-resolution version of an avatar URL when the source is a
 * known CDN we can transform. Returns the URL unchanged when the host is
 * unknown, the URL is already transformed, or `url` is null/empty.
 */
export function avatarSrc(url: string | null | undefined, size: number = 512): string | null {
  if (!url) return null;

  // Google: rewrite the size token. Profile photos look like
  // `.../a/AAcHTtX=s96-c` or `.../photo.jpg=s64`. We replace the trailing
  // `=s\d+(-c)?` with our requested size.
  if (GOOGLE_HOSTS.some((h) => url.includes(h))) {
    if (/=s\d+(-c)?$/.test(url)) {
      return url.replace(/=s\d+(-c)?$/, `=s${size}-c`);
    }
    // No size token — append one (Google accepts both forms).
    return `${url}${url.includes("=") ? "&" : "="}s${size}-c`;
  }

  // Cloudinary: only inject transforms if none are already present, so we
  // don't double-stack them on URLs that already include `c_fill,w_300/...`.
  if (url.includes(CLOUDINARY_HOST) && url.includes(CLOUDINARY_UPLOAD_MARKER)) {
    const [head, tail] = url.split(CLOUDINARY_UPLOAD_MARKER);
    // If the next path segment already starts with a transform (contains an
    // underscore-prefixed param), assume someone else did the work.
    const firstSegment = tail.split("/")[0] ?? "";
    const looksLikeTransform = /(^|,)([a-z]_)/.test(firstSegment);
    if (looksLikeTransform) return url;
    return `${head}${CLOUDINARY_UPLOAD_MARKER}c_fill,w_${size},h_${size},q_auto,f_auto,g_face/${tail}`;
  }

  return url;
}

/**
 * Optimise une image de PRODUIT (vignette de carte, bannière de fiche) servie
 * via <img> brut. Sur Cloudinary, injecte `c_limit,w_<width>,q_auto,f_auto` :
 *  - `q_auto` : compression intelligente ;
 *  - `f_auto` : format moderne (WebP/AVIF) selon le navigateur ;
 *  - `c_limit,w_` : ne sert jamais plus grand que nécessaire (pas de crop).
 * Gros gain de poids (souvent -70 à -90 %) sans changement visuel. Laisse les
 * URLs déjà transformées et les hôtes non-Cloudinary inchangés.
 */
export function productImageSrc(url: string | null | undefined, width: number = 800): string | null {
  if (!url) return null;
  if (url.includes(CLOUDINARY_HOST) && url.includes(CLOUDINARY_UPLOAD_MARKER)) {
    const [head, tail] = url.split(CLOUDINARY_UPLOAD_MARKER);
    const firstSegment = tail.split("/")[0] ?? "";
    if (/(^|,)([a-z]_)/.test(firstSegment)) return url; // déjà transformée
    // q_auto:eco = compression agressive (fichiers ~30-40 % plus légers que
    // q_auto) → chargement plus rapide, qualité réduite mais correcte.
    return `${head}${CLOUDINARY_UPLOAD_MARKER}c_limit,w_${width},q_auto:eco,f_auto/${tail}`;
  }
  return url;
}
