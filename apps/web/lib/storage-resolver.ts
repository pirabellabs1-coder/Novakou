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

    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(obj)) {
      if (URL_FIELDS.has(key) && typeof v === "string" && v.length > 0) {
        out[key] = await resolveStorageFileUrl(v, fallbackBucket, expiresIn, download);
      } else if (v && typeof v === "object") {
        out[key] = await walk(v, depth + 1);
      } else {
        out[key] = v;
      }
    }
    return out;
  }
}
