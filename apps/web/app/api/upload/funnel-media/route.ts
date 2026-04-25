import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const BUCKET = "funnel-media";
const MAX_SIZE_MB = 50;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

/**
 * POST /api/upload/funnel-media
 * Body: FormData with a "file" field (image or video)
 * Returns: { url, path, mime, size }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non supporté : ${file.type}. Formats acceptés : JPG, PNG, WebP, GIF, SVG, MP4, WebM, MOV.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : ${MAX_SIZE_MB} MB.` },
        { status: 400 }
      );
    }

    // Generate safe path: userId/timestamp-random.ext
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const randomId = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}-${randomId}.${ext}`;
    const path = `${session.user.id || "anon"}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!supabase) {
      // Dev fallback — return a mock URL (in real dev, would save to public/)
      return NextResponse.json({
        data: {
          url: `https://via.placeholder.com/800?text=Dev+mode+${encodeURIComponent(file.name)}`,
          path,
          mime: file.type,
          size: file.size,
          dev: true,
        },
      });
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "31536000", // 1 year
        upsert: false,
      });

    if (error) {
      console.error("[funnel-media upload]", error);
      // Try to create bucket if it doesn't exist
      if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
        await supabase.storage.createBucket(BUCKET, {
          public: true,
          fileSizeLimit: MAX_SIZE,
        }).catch(() => null);
        // Retry upload
        const retry = await supabase.storage
          .from(BUCKET)
          .upload(path, buffer, { contentType: file.type, cacheControl: "31536000", upsert: false });
        if (retry.error) {
          return NextResponse.json({ error: retry.error.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = urlData?.publicUrl ?? "";

    return NextResponse.json({
      data: {
        url,
        path: data?.path ?? path,
        mime: file.type,
        size: file.size,
      },
    });
  } catch (err) {
    console.error("[funnel-media upload]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Larger body size for file uploads
export const runtime = "nodejs";
export const maxDuration = 60;
