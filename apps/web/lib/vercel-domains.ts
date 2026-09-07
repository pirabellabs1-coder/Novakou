/**
 * Vercel Domains API helper.
 * Used by vendor/mentor custom domain flow. Server-only.
 *
 * Env vars required:
 *   VERCEL_API_TOKEN   — access token (scope: project domains)
 *   VERCEL_PROJECT_ID  — e.g. prj_...
 *   VERCEL_TEAM_ID     — optional, for team-owned projects
 */

import {
  slugUtilisableEnSousDomaine,
  sousDomaineDeBoutique,
} from "@/lib/formations/shop-subdomain";

const API = "https://api.vercel.com";

/**
 * Les domaines personnalisés sont-ils activés côté plateforme ? Sans token +
 * project id Vercel, aucun appel n'aboutit : on l'expose pour que les routes
 * renvoient un état « non configuré » clair au lieu d'un 500 cryptique.
 */
export function vercelDomainsConfigured(): boolean {
  return !!process.env.VERCEL_API_TOKEN && !!process.env.VERCEL_PROJECT_ID;
}

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

export interface VercelDomainConfig {
  misconfigured: boolean;
  aValues: string[];
  cnames: string[];
  conflicts: Array<{ name: string; type: string; value: string }>;
  recommendedIPv4: string[];
  recommendedCNAME: string[];
}

/**
 * Inspect actual DNS-side configuration. Vercel returns `misconfigured: true`
 * even when the project-domain itself is `verified` (e.g. wrong A record,
 * leftover host conflicts). Surface this to the vendor.
 */
export async function getDomainConfig(name: string): Promise<{ ok: boolean; data?: VercelDomainConfig; error?: string }> {
  const res = await call<{
    misconfigured?: boolean;
    aValues?: string[];
    cnames?: string[];
    conflicts?: Array<{ name: string; type: string; value: string }>;
    recommendedIPv4?: Array<{ rank: number; value: string[] }>;
    recommendedCNAME?: Array<{ rank: number; value: string }>;
  }>(`/v6/domains/${encodeURIComponent(name)}/config`, { method: "GET" });
  if (!res.ok || !res.data) return { ok: false, error: res.error ?? `vercel-config-failed:${res.status}` };
  return {
    ok: true,
    data: {
      misconfigured: !!res.data.misconfigured,
      aValues: res.data.aValues ?? [],
      cnames: res.data.cnames ?? [],
      conflicts: res.data.conflicts ?? [],
      recommendedIPv4: (res.data.recommendedIPv4 ?? [])
        .sort((a, b) => a.rank - b.rank)
        .flatMap((x) => x.value),
      recommendedCNAME: (res.data.recommendedCNAME ?? [])
        .sort((a, b) => a.rank - b.rank)
        .map((x) => x.value.replace(/\.$/, "")),
    },
  };
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

/**
 * User-facing DNS instructions. `apexName` is the registrable apex (e.g. `example.com`
 * for `shop.example.com`). When omitted we infer from the domain itself.
 */
export function dnsInstructions(domain: string, apexName?: string) {
  // Common ccTLDs that have a 2-part apex (example.co.uk, example.com.fr, etc.)
  const TWO_PART_TLDS = new Set([
    "co.uk", "ac.uk", "org.uk", "gov.uk",
    "co.nz", "com.au", "co.jp", "co.kr", "com.br", "com.mx",
    "co.za", "com.cn", "com.tw", "com.sg",
  ]);
  const parts = domain.split(".");
  let inferredApex = parts.slice(-2).join(".");
  if (parts.length >= 3 && TWO_PART_TLDS.has(parts.slice(-2).join("."))) {
    inferredApex = parts.slice(-3).join(".");
  }
  const apex = apexName ?? inferredApex;
  const isApex = domain === apex;
  const subPart = isApex ? "@" : domain.slice(0, -(apex.length + 1));

  const records = [];
  if (isApex) {
    records.push({ type: "A", name: "@", value: "216.198.79.1", note: "Domaine racine — IP Vercel" });
  } else {
    records.push({
      type: "CNAME",
      name: subPart,
      value: "cname.vercel-dns.com",
      note: "Sous-domaine — pointe vers Vercel",
    });
  }
  return { domain, apex, records };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Sous-domaine gratuit de boutique — `<slug>.novakou.com`
 *
 * Vercel n'accepte un domaine WILDCARD (`*.novakou.com`) que si le domaine
 * utilise SES serveurs de noms : le certificat wildcard passe par un défi
 * DNS-01 qu'il doit poser lui-même. novakou.com reste chez Cloudflare (MX de
 * la boîte du fondateur, SPF, DKIM Resend, DMARC) — basculer les NS pour un
 * sous-domaine gratuit risquerait l'e-mail transactionnel de toute la
 * plateforme.
 *
 * On inscrit donc CHAQUE sous-domaine individuellement sur le projet. Vercel
 * délivre alors un certificat par hôte (défi HTTP-01, aucun accès DNS requis)
 * et le CNAME joker posé une fois chez Cloudflare suffit à router le trafic.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Un domaine du projet, réduit à ce qui sert à décider quoi faire. */
export interface ProjectDomain {
  name: string;
  verified: boolean;
}

/**
 * TOUS les domaines du projet. La page est plafonnée à 100 par l'API : sans
 * pagination, un projet à 641 boutiques renverrait un inventaire tronqué, et
 * la synchronisation réinscrirait en boucle des domaines déjà présents.
 */
export async function listProjectDomains(): Promise<{ ok: boolean; domains: ProjectDomain[]; error?: string }> {
  const out: ProjectDomain[] = [];
  let until: number | null = null;
  // Garde-fou : 200 pages = 20 000 domaines. Au-delà, c'est une boucle, pas un inventaire.
  for (let page = 0; page < 200; page++) {
    const q = `limit=100${until ? `&until=${until}` : ""}`;
    const res: { ok: boolean; status: number; data: { domains?: ProjectDomain[]; pagination?: { next: number | null } } | null; error?: string } =
      await call(`/v9/projects/${projectId()}/domains?${q}`, { method: "GET" });
    if (!res.ok || !res.data) return { ok: false, domains: out, error: res.error ?? `vercel-list-failed:${res.status}` };
    for (const d of res.data.domains ?? []) out.push({ name: d.name, verified: !!d.verified });
    const next = res.data.pagination?.next ?? null;
    if (!next) return { ok: true, domains: out };
    until = next;
  }
  return { ok: true, domains: out };
}

/**
 * Inscrit le sous-domaine gratuit d'une boutique au moment où elle est créée,
 * pour qu'il soit joignable tout de suite plutôt qu'au prochain passage du
 * cron `sous-domaines-boutiques`.
 *
 * Ne lève JAMAIS : une indisponibilité de l'API Vercel ne doit pas empêcher un
 * vendeur de créer sa boutique. Le cron rattrape ce qui a échoué ici.
 */
export async function ensureShopSubdomain(slug: string): Promise<void> {
  if (!vercelDomainsConfigured()) return;
  if (!slugUtilisableEnSousDomaine(slug)) return;
  try {
    const res = await addDomain(sousDomaineDeBoutique(slug));
    if (!res.ok) console.warn("[sous-domaine boutique] ajout refusé:", slug, res.error);
  } catch (err) {
    console.warn("[sous-domaine boutique] ajout impossible:", slug, err);
  }
}
