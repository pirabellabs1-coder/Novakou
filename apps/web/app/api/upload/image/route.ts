import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Magic bytes pour valider le contenu reel de l'image
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

function validateImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
}

const FOLDER_MAP: Record<string, string> = {
  avatar: "freelancehigh/avatars",
  service: "freelancehigh/services",
  portfolio: "freelancehigh/portfolio",
};

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mime] ?? "bin";
}

/**
 * Sauvegarde locale (dev / fallback) : écrit dans apps/web/public/uploads/
 * et retourne l'URL publique /uploads/<filename>.
 */
async function saveLocally(buffer: Buffer, mime: string, userId: string) {
  const publicDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(publicDir, { recursive: true });

  const ext = extFromMime(mime);
  const suffix = crypto.randomBytes(6).toString("hex");
  const safeUser = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  const filename = `${Date.now()}-${safeUser}-${suffix}.${ext}`;
  const filePath = path.join(publicDir, filename);

  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    publicId: filename,
    provider: "local" as const,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "service";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Format non supporte. Formats acceptes : JPEG, PNG, GIF, WebP",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `La taille maximum est de 5 MB. Votre fichier fait ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Valider les magic bytes pour empecher les fichiers deguises en images
    if (!validateImageMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "Le contenu du fichier ne correspond pas au format image declare. Upload refuse." },
        { status: 400 }
      );
    }

    // Try Cloudinary first (if configured, typically in production)
    const hasCloudinary = !!process.env.CLOUDINARY_URL;
    if (hasCloudinary) {
      const cloudinaryFolder = FOLDER_MAP[folder] || "freelancehigh/uploads";
      const result = await uploadImage(buffer, {
        folder: cloudinaryFolder,
        publicId: `${session.user.id}_${Date.now()}`,
      });

      if (result) {
        return NextResponse.json({
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format,
          provider: "cloudinary",
        });
      }
      // fall through to local if Cloudinary failed
    }

    // Fallback: save to local disk (public/uploads/)
    // Works in dev (no CLOUDINARY_URL) AND as fallback if Cloudinary fails
    const saved = await saveLocally(buffer, file.type, session.user.id);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[Upload Image] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
