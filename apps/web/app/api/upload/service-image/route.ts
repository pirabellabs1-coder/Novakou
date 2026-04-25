import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { uploadImage } from "@/lib/cloudinary";
import { uploadFile, getSignedUrl, type StorageBucket } from "@/lib/supabase-storage";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Magic bytes for image validation
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

function validateImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer.length > i && buffer[i] === byte)
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Formats acceptés : JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `La taille maximum est de 5 MB. Votre fichier fait ${(file.size / (1024 * 1024)).toFixed(1)} MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes
    if (!validateImageMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "Le contenu du fichier ne correspond pas au format image declare. Upload refuse." },
        { status: 400 }
      );
    }

    // 1. Essai Cloudinary (premier choix — CDN, transforms)
    const result = await uploadImage(buffer, {
      folder: "novakou/services",
      publicId: `svc_${session.user.id}_${Date.now()}`,
    });

    if (result) {
      return NextResponse.json({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        id: result.publicId,
        provider: "cloudinary",
      });
    }

    // 2. Fallback Supabase Storage (fonctionne sur Vercel prod)
    try {
      const ext = file.type.split("/")[1] || "bin";
      const suffix = crypto.randomBytes(6).toString("hex");
      const safeUser = session.user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
      const filename = `${Date.now()}-${safeUser}-${suffix}.${ext}`;
      const bucket: StorageBucket = "agency-resources";
      const storagePath = `services/${safeUser}/${filename}`;
      const supabase = await uploadFile(bucket, storagePath, buffer, file.type);
      if (supabase) {
        const signed = await getSignedUrl(bucket, supabase.path, 60 * 60 * 24 * 7);
        if (signed) {
          return NextResponse.json({
            url: signed,
            publicId: supabase.path,
            id: supabase.path,
            provider: "supabase",
          });
        }
      }
    } catch (err) {
      console.error("[Upload service-image] Supabase fallback failed:", err);
    }

    return NextResponse.json(
      { error: "Stockage indisponible. Réessayez dans quelques instants." },
      { status: 503 }
    );
  } catch (error) {
    console.error("[Upload service-image] Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
