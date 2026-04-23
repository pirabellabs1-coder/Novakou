import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import pathModule from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const IS_DEV = process.env.DEV_MODE === "true";

// Service role client for server-side file operations
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export type StorageBucket =
  | "kyc-documents"
  | "order-deliveries"
  | "agency-resources"
  | "contracts"
  | "message-attachments"
  | "certificates";

// ── Dev mode local storage fallback ──
const DEV_STORAGE_DIR = pathModule.join(process.cwd(), "public", "uploads");

function ensureDevStorageDir(bucket: string, filePath: string) {
  const dir = pathModule.join(DEV_STORAGE_DIR, bucket, pathModule.dirname(filePath));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function devUpload(bucket: string, filePath: string, file: Buffer): { url: string; path: string } {
  ensureDevStorageDir(bucket, filePath);
  const fullPath = pathModule.join(DEV_STORAGE_DIR, bucket, filePath);
  fs.writeFileSync(fullPath, file);
  const url = `/uploads/${bucket}/${filePath}`;
  return { url, path: filePath };
}

function devGetUrl(bucket: string, filePath: string): string {
  return `/uploads/${bucket}/${filePath}`;
}

function devDelete(bucket: string, filePath: string): boolean {
  const fullPath = pathModule.join(DEV_STORAGE_DIR, bucket, filePath);
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    return true;
  } catch {
    return false;
  }
}

/** Auto-créé le bucket s'il n'existe pas (idempotent). */
async function ensureBucketExists(bucket: StorageBucket): Promise<void> {
  if (!supabase) return;
  try {
    const { data: existing } = await supabase.storage.getBucket(bucket);
    if (existing) return; // existe déjà
  } catch {
    // getBucket throw si n'existe pas — on tombe dans le create
  }
  const { error } = await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: 52428800, // 50MB
  });
  if (error && !error.message?.includes("already exists")) {
    console.warn("[Supabase Storage] Create bucket error:", error.message);
  }
}

// Upload a file to a private Supabase Storage bucket (falls back to local in dev)
export async function uploadFile(
  bucket: StorageBucket,
  path: string, // e.g. "user-123/passport.pdf"
  file: Buffer,
  contentType: string
): Promise<{ url: string; path: string } | null> {
  // Try Supabase first
  if (supabase) {
    try {
      // Auto-create bucket si absent (premier upload de la vie de la plateforme)
      await ensureBucketExists(bucket);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType, upsert: true });

      if (!error && data) {
        return { url: data.path, path: data.path };
      }
      console.error("[Supabase Storage] Upload error:", error);

      // Si erreur "Bucket not found", retry après create explicite
      if (error?.message?.toLowerCase().includes("bucket not found")) {
        await ensureBucketExists(bucket);
        const retry = await supabase.storage
          .from(bucket)
          .upload(path, file, { contentType, upsert: true });
        if (!retry.error && retry.data) {
          return { url: retry.data.path, path: retry.data.path };
        }
      }
    } catch (err) {
      console.error("[Supabase Storage] Upload exception:", err);
    }
  }

  // Dev fallback: store locally
  if (IS_DEV) {
    console.info("[Storage] Using local dev fallback for upload");
    return devUpload(bucket, path, file);
  }

  console.warn("[Supabase Storage] Not configured and not in dev mode");
  return null;
}

// Get a signed URL for a private file (expires in 1 hour by default)
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (!error && data) return data.signedUrl;
      console.error("[Supabase Storage] Signed URL error:", error);
    } catch (err) {
      console.error("[Supabase Storage] Signed URL exception:", err);
    }
  }

  // Dev fallback: return local URL
  if (IS_DEV) return devGetUrl(bucket, path);

  return null;
}

// Delete a file from a bucket
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (!error) return true;
    console.error("[Supabase Storage] Delete error:", error);
  }

  if (IS_DEV) return devDelete(bucket, path);

  return false;
}

// List files in a bucket path
export async function listFiles(bucket: StorageBucket, folder: string) {
  if (supabase) {
    const { data, error } = await supabase.storage.from(bucket).list(folder);
    if (!error) return data || [];
    console.error("[Supabase Storage] List error:", error);
  }

  // Dev fallback: list local files
  if (IS_DEV) {
    const dir = pathModule.join(DEV_STORAGE_DIR, bucket, folder);
    try {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir).map((name) => ({ name, id: name }));
    } catch {
      return [];
    }
  }

  return [];
}
