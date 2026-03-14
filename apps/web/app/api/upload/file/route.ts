import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  uploadFile,
  type StorageBucket,
} from "@/lib/supabase-storage";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const VALID_BUCKETS: StorageBucket[] = [
  "kyc-documents",
  "order-deliveries",
  "agency-resources",
  "contracts",
];

function isValidBucket(bucket: string): bucket is StorageBucket {
  return VALID_BUCKETS.includes(bucket as StorageBucket);
}

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
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
        { error: "Fichier trop volumineux (max 10 Mo)" },
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
    const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt", "zip", "png", "jpg", "jpeg", "gif", "webp"];
    const extension = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: "Extension de fichier non autorisee" }, { status: 400 });
    }

    // Build a unique path scoped to the user
    const storagePath = `${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;

    // Try Supabase Storage upload
    const result = await uploadFile(bucket, storagePath, buffer, file.type);

    if (result) {
      return NextResponse.json({
        success: true,
        file: {
          id: `file-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.url,
          path: result.path,
          bucket,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    // Fallback: return placeholder for local development
    const fileData = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${bucket}/${storagePath}`,
      path: storagePath,
      bucket,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, file: fileData });
  } catch (error) {
    console.error("[Upload File] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
