/**
 * IP → approximate location lookup. Free + keyless (ipapi.co community
 * endpoint, ~1k req/day anon). Used for security notifications and
 * login-history UI. Never blocks auth — always returns quickly even on
 * failure.
 *
 * Cache results in-process for 6h to avoid re-fetching the same IP.
 */

type GeoResult = {
  ip: string;
  country: string | null; // ISO-3166 alpha-2
  countryName: string | null;
  region: string | null;
  city: string | null;
};

const cache = new Map<string, { at: number; data: GeoResult }>();
const TTL = 6 * 3600 * 1000;

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === "Unknown") return true;
  if (ip === "::1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  // 172.16.0.0 – 172.31.255.255
  const m = ip.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}

export async function lookupIp(ip: string): Promise<GeoResult> {
  const fallback: GeoResult = {
    ip,
    country: null,
    countryName: null,
    region: null,
    city: null,
  };

  if (isPrivateIp(ip)) return fallback;

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.at < TTL) return cached.data;

  try {
    // Free, no-key endpoint. Times out fast.
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: { "User-Agent": "Novakou/1.0" },
    });
    clearTimeout(t);
    if (!res.ok) return fallback;
    const j = (await res.json()) as {
      country_code?: string;
      country_name?: string;
      region?: string;
      city?: string;
      error?: boolean;
    };
    if (j.error) return fallback;
    const data: GeoResult = {
      ip,
      country: (j.country_code || "").toUpperCase() || null,
      countryName: j.country_name || null,
      region: j.region || null,
      city: j.city || null,
    };
    cache.set(ip, { at: Date.now(), data });
    return data;
  } catch {
    return fallback;
  }
}

/** "Abomey-Calavi, Bénin" or falls back gracefully. */
export function formatLocation(g: Pick<GeoResult, "city" | "region" | "countryName">): string {
  const parts = [g.city, g.region, g.countryName].filter(Boolean) as string[];
  // Dedupe (city == region happens with small countries).
  const dedup = parts.filter((v, i, arr) => arr.indexOf(v) === i);
  if (dedup.length === 0) return "Localisation inconnue";
  // Keep max 2 parts for readability
  return dedup.slice(0, 2).join(", ");
}
