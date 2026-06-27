// Helper : transforme automatiquement les paths Supabase Storage stockés en
// DB en URLs signées fraîches, sur des objets retournés par Prisma.
//
// Problème adressé : beaucoup de champs DB stockent un PATH (ex:
// `userId/timestamp.jpg`) qui, rendus tels quels dans `<img src>` ou
// `<a href>`, sont résolus comme URLs relatives → 404 "Page introuvable".
//
// Ce helper navigue récursivement l'objet, repère les champs nommés (image,
// avatar, thumbnail, banner, fileUrl, etc.) et appelle resolveStorageFileUrl
// pour les transformer. Idempotent : si la valeur est déjà une URL signée
// fraîche ou une URL absolue externe (Cloudinary, Gravatar, etc.), elle
// est laissée intacte.
//
// Usage :
//   const data = await prisma.formation.findMany({ ... });
//   const resolved = await resolveStorageFields(data, { fallbackBucket: "order-deliveries" });
//   return NextResponse.json({ data: resolved });

import { resolveStorageFileUrl, type StorageBucket } from "@/lib/supabase-storage";
import { cldUrl } from "@/lib/cloudinary-url";

// Champs TOUJOURS images (sous-ensemble de URL_FIELDS) : on leur applique
// l'optimisation Cloudinary f_auto,q_auto (sans resize → dimensions préservées,
// zéro risque de layout). On EXCLUT volontairement url/fileUrl/videoUrl/pdfUrl…
// qui peuvent pointer vers des PDF/vidéos (les transformer les casserait).
const IMAGE_FIELDS = new Set([
  "image",
  "avatar",
  "thumbnail",
  "banner",
  "coverImage",
  "imageBannerUrl",
  "logoUrl",
  "previewUrl",
]);

// Noms de champs qu'on doit résoudre (case-sensitive). Cette liste couvre
// tous les champs de fichier connus du schéma Novakou. Ajouter ici si un
// nouveau champ apparaît.
const URL_FIELDS = new Set([
  "image",
  "avatar",
  "thumbnail",
  "banner",
  "coverImage",
  "fileUrl",
  "videoUrl",
  "audioUrl",
  "pdfUrl",
  "documentUrl",
  "certificateUrl",
  "attachmentUrl",
  "selfieUrl",
  "url", // ⚠ générique — utilisé par DigitalProductFile.url, Message.fileUrl
  "imageBannerUrl",
  "logoUrl",
  "previewUrl",
]);

interface ResolveOptions {
  /** Bucket par défaut quand le path n'est pas reconnaissable (defaut: order-deliveries) */
  fallbackBucket?: StorageBucket;
  /** TTL signed URL en secondes (defaut: 3600 = 1h) */
  expiresIn?: number;
  /** Si true, ajoute Content-Disposition: attachment au signed URL (pour download forcé) */
  download?: boolean | string;
  /** Liste de chemins à exclure du parcours (ex: ["seo.image", "metadata"]) */
  excludePaths?: string[];
}

/**
 * Parcourt récursivement un objet (ou un tableau) et résout tous les champs
 * dont le nom est dans URL_FIELDS. Mute pas l'input — retourne un nouveau
 * objet. Limite la profondeur à 6 niveaux pour éviter les cycles.
 */
export async function resolveStorageFields<T>(
  input: T,
  options: ResolveOptions = {},
): Promise<T> {
  const fallbackBucket = options.fallbackBucket ?? "order-deliveries";
  const expiresIn = options.expiresIn ?? 3600;
  const download = options.download;

  return (await walk(input, 0)) as T;

  async function walk(value: unknown, depth: number): Promise<unknown> {
    if (depth > 6 || value == null) return value;
    if (Array.isArray(value)) {
      return Promise.all(value.map((v) => walk(v, depth + 1)));
    }
    if (typeof value !== "object") return value;
    if (value instanceof Date) return value;

    // Lance TOUTES les promesses en parallèle puis assemble le résultat.
    // Sans ça, un objet avec 5 champs URL → 5 round-trips Supabase en
    // série = page lente. Avec Promise.all, ils partent en même temps.
    const obj = value as Record<string, unknown>;
    const entries = await Promise.all(
      Object.entries(obj).map(async ([key, v]) => {
        if (URL_FIELDS.has(key) && typeof v === "string" && v.length > 0) {
          const resolved = await resolveStorageFileUrl(v, fallbackBucket, expiresIn, download);
          // Images Cloudinary → format/qualité auto (AVIF/WebP). Sûr et global.
          return [key, IMAGE_FIELDS.has(key) ? cldUrl(resolved) : resolved] as const;
        }
        if (v && typeof v === "object") {
          return [key, await walk(v, depth + 1)] as const;
        }
        return [key, v] as const;
      }),
    );
    return Object.fromEntries(entries);
  }
}
