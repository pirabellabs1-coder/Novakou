import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
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

    // In production, upload to Cloudinary via server-side SDK
    // For now, convert to data URL for local development
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
