import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

// Upload a file to a private Supabase Storage bucket
export async function uploadFile(
  bucket: StorageBucket,
  path: string, // e.g. "user-123/passport.pdf"
  file: Buffer,
  contentType: string
): Promise<{ url: string; path: string } | null> {
  if (!supabase) {
    console.warn("[Supabase Storage] Not configured");
    return null;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });

  if (error) {
    console.error("[Supabase Storage] Upload error:", error);
    return null;
  }

  return { url: data.path, path: data.path };
}

// Get a signed URL for a private file (expires in 1 hour by default)
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("[Supabase Storage] Signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}

// Delete a file from a bucket
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error("[Supabase Storage] Delete error:", error);
    return false;
  }

  return true;
}

// List files in a bucket path
export async function listFiles(bucket: StorageBucket, folder: string) {
  if (!supabase) return [];

  const { data, error } = await supabase.storage.from(bucket).list(folder);
  if (error) {
    console.error("[Supabase Storage] List error:", error);
    return [];
  }

  return data || [];
}
