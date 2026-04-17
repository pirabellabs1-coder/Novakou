/**
 * Vercel Domains API helper.
 * Used by vendor/mentor custom domain flow. Server-only.
 *
 * Env vars required:
 *   VERCEL_API_TOKEN   — access token (scope: project domains)
 *   VERCEL_PROJECT_ID  — e.g. prj_...
 *   VERCEL_TEAM_ID     — optional, for team-owned projects
 */

const API = "https://api.vercel.com";

function token() {
  const t = process.env.VERCEL_API_TOKEN;
  if (!t) throw new Error("VERCEL_API_TOKEN missing");
  return t;
}

function projectId() {
  const p = process.env.VERCEL_PROJECT_ID;
  if (!p) throw new Error("VERCEL_PROJECT_ID missing");
  return p;
}

function teamQuery() {
  const t = process.env.VERCEL_TEAM_ID;
  return t ? `?teamId=${t}` : "";
}

async function call<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const url = `${API}${path}${path.includes("?") ? "&" : "?"}${teamQuery().replace(/^\?/, "")}`.replace(/&$/, "");
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const err =
        (data as { error?: { message?: string } })?.error?.message ??
        (typeof data === "string" ? data : `HTTP ${res.status}`);
      return { ok: false, status: res.status, data: data as T, error: err };
    }
    return { ok: true, status: res.status, data: data as T };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>;
  redirect?: string | null;
  createdAt?: number;
}

export interface DomainSetupResult {
  ok: boolean;
  error?: string;
  code?: string;
  domain?: VercelDomain;
  verification?: VercelDomain["verification"];
}

/** Add a domain to the Vercel project. Idempotent-ish: if already attached returns current state. */
export async function addDomain(name: string): Promise<DomainSetupResult> {
  const res = await call<VercelDomain>(`/v10/projects/${projectId()}/domains`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (res.ok && res.data) {
    return { ok: true, domain: res.data, verification: res.data.verification };
  }
  // If domain already attached to this project, fetch its state
  if (res.status === 409 || /already .* this project/i.test(res.error ?? "")) {
    const state = await getDomain(name);
    if (state.ok && state.domain)
      return { ok: true, domain: state.domain, verification: state.domain.verification };
  }
  return { ok: false, error: res.error ?? `vercel-add-failed:${res.status}` };
}

/** Get current status of a domain on our project. */
export async function getDomain(name: string): Promise<DomainSetupResult> {
  const res = await call<VercelDomain>(`/v9/projects/${projectId()}/domains/${encodeURIComponent(name)}`, {
    method: "GET",
  });
  if (res.ok && res.data) return { ok: true, domain: res.data, verification: res.data.verification };
  return { ok: false, error: res.error ?? `vercel-get-failed:${res.status}` };
}

/** Trigger verification: Vercel re-checks DNS / TXT and SSL. Returns verified=true when done. */
export async function verifyDomain(name: string): Promise<DomainSetupResult> {
  const res = await call<VercelDomain>(
    `/v9/projects/${projectId()}/domains/${encodeURIComponent(name)}/verify`,
    { method: "POST" },
  );
  if (res.ok && res.data) return { ok: true, domain: res.data, verification: res.data.verification };
  return { ok: false, error: res.error ?? `vercel-verify-failed:${res.status}` };
}

/** Remove a domain from the Vercel project. */
export async function removeDomain(name: string): Promise<{ ok: boolean; error?: string }> {
  const res = await call<{ uid?: string }>(
    `/v9/projects/${projectId()}/domains/${encodeURIComponent(name)}`,
    { method: "DELETE" },
  );
  if (res.ok) return { ok: true };
  // If not found, treat as success (idempotent cleanup)
  if (res.status === 404) return { ok: true };
  return { ok: false, error: res.error ?? `vercel-remove-failed:${res.status}` };
}

/** User-facing DNS instructions, independent of Vercel verification blob. */
export function dnsInstructions(domain: string) {
  const isApex = !domain.includes(".") || domain.split(".").length === 2;
  return {
    domain,
    records: [
      isApex
        ? { type: "A", name: "@", value: "76.76.21.21", note: "Apex record (domaine racine)" }
        : {
            type: "CNAME",
            name: domain.split(".")[0],
            value: "cname.vercel-dns.com",
            note: "Sous-domaine",
          },
    ],
  };
}
