/**
 * Client request info helpers — extract IP, user-agent, and parse UA into
 * friendly browser/OS strings for security notifications.
 *
 * Works both with NextRequest (middleware) and next/headers() (server
 * components/route handlers).
 */

import { headers as nextHeaders } from "next/headers";
import type { NextRequest } from "next/server";

export interface ClientInfo {
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: "Mobile" | "Tablet" | "Desktop";
}

/** Pull the best-guess client IP from common proxy headers (Vercel, Cloudflare). */
export function getClientIp(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    // The first entry is the original client; the rest are proxies.
    return forwarded.split(",")[0]?.trim() || "Unknown";
  }
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-client-ip") ||
    "Unknown"
  );
}

/** Tiny, dependency-free UA parser — good enough for email alerts. */
export function parseUserAgent(ua: string): { browser: string; os: string; device: ClientInfo["device"] } {
  const uaLower = ua.toLowerCase();

  // OS
  let os = "Autre";
  if (uaLower.includes("windows nt 10")) os = "Windows 10/11";
  else if (uaLower.includes("windows nt 6")) os = "Windows 7/8";
  else if (uaLower.includes("windows")) os = "Windows";
  else if (uaLower.includes("mac os x") || uaLower.includes("macintosh")) os = "macOS";
  else if (uaLower.includes("android")) os = "Android";
  else if (uaLower.includes("iphone") || uaLower.includes("ipad") || uaLower.includes("ipod")) os = "iOS";
  else if (uaLower.includes("linux")) os = "Linux";

  // Browser (order matters — check specific strings first)
  let browser = "Navigateur";
  if (uaLower.includes("edg/")) browser = "Edge";
  else if (uaLower.includes("opr/") || uaLower.includes("opera")) browser = "Opera";
  else if (uaLower.includes("firefox/")) browser = "Firefox";
  else if (uaLower.includes("chrome/") && !uaLower.includes("chromium")) browser = "Chrome";
  else if (uaLower.includes("safari/") && !uaLower.includes("chrome")) browser = "Safari";
  else if (uaLower.includes("chromium")) browser = "Chromium";

  // Device
  let device: ClientInfo["device"] = "Desktop";
  if (/ipad|tablet/i.test(uaLower)) device = "Tablet";
  else if (/mobile|iphone|android(?!.*tablet)/i.test(uaLower)) device = "Mobile";

  return { browser, os, device };
}

/** Gather everything in one call from a standard Request headers bag. */
export function getClientInfoFromHeaders(h: Headers): ClientInfo {
  const userAgent = h.get("user-agent") || "Unknown";
  const { browser, os, device } = parseUserAgent(userAgent);
  return {
    ip: getClientIp(h),
    userAgent,
    browser,
    os,
    device,
  };
}

/** Same but from a NextRequest (middleware). */
export function getClientInfo(req: NextRequest): ClientInfo {
  return getClientInfoFromHeaders(req.headers);
}

/** Same but pulls from next/headers() (server component / route handler). */
export async function getClientInfoFromContext(): Promise<ClientInfo> {
  const h = await nextHeaders();
  return getClientInfoFromHeaders(h);
}

/** Human-friendly "Chrome on Windows" string for emails. */
export function formatClientInfo(info: ClientInfo): string {
  return `${info.browser} sur ${info.os} (${info.device})`;
}
