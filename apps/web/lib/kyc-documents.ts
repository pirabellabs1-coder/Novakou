import { getSignedUrl } from "@/lib/supabase-storage";

const KYC_BUCKET = "kyc-documents";

function cleanStoragePath(path: string) {
  return path.replace(/^\/+/, "").replace(new RegExp(`^${KYC_BUCKET}/`), "");
}

export function getKycDocumentPath(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  if (!/^https?:\/\//i.test(raw)) {
    return cleanStoragePath(raw);
  }

  try {
    const url = new URL(raw);
    const marker = "/storage/v1/object/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const storagePath = url.pathname.slice(markerIndex + marker.length);
    const parts = storagePath.split("/");
    const bucketIndex = parts.findIndex((part) => part === KYC_BUCKET);
    if (bucketIndex === -1) return null;

    const path = parts.slice(bucketIndex + 1).join("/");
    return path ? cleanStoragePath(decodeURIComponent(path)) : null;
  } catch {
    return null;
  }
}

export function normalizeKycDocumentReference(value: string): string {
  return getKycDocumentPath(value) ?? value.trim();
}

export async function resolveKycDocumentUrl(value?: string | null): Promise<string> {
  const raw = value?.trim();
  if (!raw) return "";

  const path = getKycDocumentPath(raw);
  if (!path) return raw;

  return (await getSignedUrl(KYC_BUCKET, path, 3600)) ?? "";
}
