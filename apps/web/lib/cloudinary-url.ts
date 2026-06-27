// Optimisation des images Cloudinary par l'URL (format auto AVIF/WebP, qualité
// auto, redimensionnement). Les URLs Cloudinary sont STABLES (non signées) donc
// le résultat est parfaitement cacheable par le navigateur + CDN.
//
// Problème résolu : les images produits étaient livrées en TAILLE ORIGINALE
// (`/image/upload/v123/novakou/portfolio/xxx`) — une photo 2000px chargée dans
// une vignette de 300px → pages lentes, data gaspillée. `f_auto,q_auto` à lui
// seul réduit le poids de 60-80 %, le resize (`w_`,`h_`) encore plus.
//
// Idempotent & non destructif : si l'URL contient déjà des transformations,
// on FUSIONNE (on n'écrase jamais un paramètre déjà posé par un humain). Les
// URLs non-Cloudinary (Supabase signées, Gravatar…) sont renvoyées intactes.

export interface CldOpts {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "fit" | "thumb";
  /** Qualité Cloudinary — défaut "auto". */
  quality?: string;
}

const IMG_MARKER = "/image/upload/";

export function cldUrl(
  url: string | null | undefined,
  opts: CldOpts = {},
): string | null | undefined {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;
  const idx = url.indexOf(IMG_MARKER);
  if (idx === -1) return url; // /raw/upload/ (PDF, vidéo…) → ne pas toucher

  const head = url.slice(0, idx + IMG_MARKER.length);
  const rest = url.slice(idx + IMG_MARKER.length);
  const segs = rest.split("/");
  const firstSeg = segs[0] || "";

  const isVersion = /^v\d+$/.test(firstSeg);
  // Un segment de transformation ressemble à "f_auto,q_auto,w_600" : des
  // paires "xx_valeur" séparées par des virgules.
  const looksTransform = !isVersion && /(^|,)[a-z]{1,4}_/.test(firstSeg);

  // Paramètres souhaités.
  const want: Record<string, string> = { f: "auto", q: opts.quality ?? "auto" };
  if (opts.crop) want.c = opts.crop;
  if (opts.width) want.w = String(opts.width);
  if (opts.height) want.h = String(opts.height);

  // Paramètres déjà présents (priorité à l'existant — on ne réécrase pas).
  const existing: Record<string, string> = {};
  let tailSegs = segs;
  if (looksTransform) {
    for (const p of firstSeg.split(",")) {
      const us = p.indexOf("_");
      if (us > 0) existing[p.slice(0, us)] = p.slice(us + 1);
    }
    tailSegs = segs.slice(1);
  }

  const merged: Record<string, string> = { ...want, ...existing };
  const order = ["f", "q", "c", "w", "h"];
  const transform = [
    ...order.filter((k) => merged[k] != null).map((k) => `${k}_${merged[k]}`),
    ...Object.keys(merged)
      .filter((k) => !order.includes(k))
      .map((k) => `${k}_${merged[k]}`),
  ].join(",");

  return `${head}${transform}/${tailSegs.join("/")}`;
}
