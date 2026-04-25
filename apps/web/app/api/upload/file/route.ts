import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/api-rate-limit";
import {
  uploadFile,
  getSignedUrl,
  type StorageBucket,
} from "@/lib/supabase-storage";
import { uploadImage } from "@/lib/cloudinary";

const IS_DEV = process.env.DEV_MODE === "true";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

// Magic bytes pour valider le type reel du fichier (pas seulement l'extension client)
interface MagicSignature {
  bytes: number[];
  offset?: number; // Default 0
}

const MAGIC_BYTES: Record<string, MagicSignature[]> = {
  pdf: [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  png: [{ bytes: [0x89, 0x50, 0x4E, 0x47] }], // .PNG
  jpg: [{ bytes: [0xFF, 0xD8, 0xFF] }],
  jpeg: [{ bytes: [0xFF, 0xD8, 0xFF] }],
  gif: [{ bytes: [0x47, 0x49, 0x46, 0x38] }], // GIF8
  webp: [{ bytes: [0x52, 0x49, 0x46, 0x46] }], // RIFF (WebP)
  zip: [{ bytes: [0x50, 0x4B, 0x03, 0x04] }, { bytes: [0x50, 0x4B, 0x05, 0x06] }], // PK
  doc: [{ bytes: [0xD0, 0xCF, 0x11, 0xE0] }], // OLE2
  docx: [{ bytes: [0x50, 0x4B, 0x03, 0x04] }], // ZIP (OOXML)
  // Audio formats
  webm: [{ bytes: [0x1A, 0x45, 0xDF, 0xA3] }], // EBML (WebM/Matroska)
  ogg: [{ bytes: [0x4F, 0x67, 0x67, 0x53] }], // OggS
  mp4: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], // ftyp box at offset 4
  m4a: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], // ftyp box (same as MP4)
  mp3: [{ bytes: [0x49, 0x44, 0x33] }, { bytes: [0xFF, 0xFB] }], // ID3 tag or MPEG sync
  mov: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }], // ftyp box (QuickTime)
};

function validateMagicBytes(buffer: Buffer, extension: string): boolean {
  const signatures = MAGIC_BYTES[extension];
  // Extensions sans magic bytes connus — on accepte
  if (!signatures) return ["txt", "rar", "7z", "xls", "xlsx", "ppt", "pptx"].includes(extension);
  return signatures.some((sig) => {
    const offset = sig.offset || 0;
    return sig.bytes.every((byte, i) => buffer.length > offset + i && buffer[offset + i] === byte);
  });
}

const VALID_BUCKETS: StorageBucket[] = [
  "kyc-documents",
  "order-deliveries",
  "agency-resources",
  "contracts",
  "message-attachments",
];

function isValidBucket(bucket: string): bucket is StorageBucket {
  return VALID_BUCKETS.includes(bucket as StorageBucket);
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication (dev mode fallback)
    const session = await auth();
    const userId = session?.user?.id || (IS_DEV ? "dev-user" : null);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Rate limit: 20 uploads/hour per user
    const rl = rateLimit(`upload:${userId}`, 20, 3600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop d'uploads. Réessayez dans quelques minutes." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "order-deliveries";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Le fichier depasse la taille maximale de 25 MB" },
        { status: 400 }
      );
    }

    if (!isValidBucket(bucket)) {
      return NextResponse.json(
        {
          error: `Bucket invalide. Valeurs acceptees : ${VALID_BUCKETS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file extension
    const ALLOWED_EXTENSIONS = [
      "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",
      "zip", "rar", "7z",
      "png", "jpg", "jpeg", "gif", "webp",
      "mp4", "webm", "mov",
      "ogg", "m4a", "mp3",
    ];
    const extension = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: "Extension de fichier non autorisee" }, { status: 400 });
    }

    // Valider les magic bytes pour empecher les fichiers deguises
    if (!validateMagicBytes(buffer, extension)) {
      return NextResponse.json(
        { error: "Le contenu du fichier ne correspond pas a son extension. Upload refuse." },
        { status: 400 }
      );
    }

    // Build a unique path scoped to the user
    const storagePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;

    // Try Supabase Storage upload (may throw on read-only filesystem like Vercel)
    let supabaseResult: { url: string; path: string } | null = null;
    try {
      supabaseResult = await uploadFile(bucket, storagePath, buffer, file.type);
    } catch (storageErr) {
      console.warn("[Upload File] Supabase Storage failed:", storageErr);
    }

    if (supabaseResult) {
      const signedUrl = await getSignedUrl(bucket, supabaseResult.path, 3600);
      return NextResponse.json({
        success: true,
        file: {
          id: `file-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: signedUrl || supabaseResult.url,
          path: supabaseResult.path,
          bucket,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    // Fallback: Cloudinary for image files when Supabase Storage is unavailable
    const isImageFile = ["png", "jpg", "jpeg", "gif", "webp"].includes(extension);
    if (isImageFile) {
      const cloudinaryResult = await uploadImage(buffer, {
        folder: `freelancehigh/${bucket}`,
        publicId: `${userId}_${Date.now()}`,
      });

      if (cloudinaryResult) {
        return NextResponse.json({
          success: true,
          file: {
            id: cloudinaryResult.publicId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: cloudinaryResult.url,
            path: cloudinaryResult.publicId,
            bucket,
            uploadedAt: new Date().toISOString(),
          },
        });
      }
    }

    console.error("[Upload File] Storage unavailable — Supabase and Cloudinary both failed");
    return NextResponse.json(
      { error: "Stockage indisponible. Veuillez reessayer." },
      { status: 503 }
    );
  } catch (error) {
    console.error("[Upload File] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
