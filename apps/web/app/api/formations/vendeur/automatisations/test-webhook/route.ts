import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

import { getActiveShopId } from "@/lib/formations/active-shop";
function isValidUrl(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function buildDemoPayload(selected: string[]): Record<string, unknown> {
  const flat: Record<string, unknown> = {
    "customer.firstName": "Sophie",
    "customer.lastName": "Martin",
    "customer.email": "sophie.martin@example.com",
    "customer.phone": "+33 6 12 34 56 78",
    "customer.country": "FR",
    "customer.locale": "fr",
    "product.id": "prod_demo_001",
    "product.title": "Formation Marketing Digital",
    "product.price": 49,
    "product.kind": "formation",
    "order.id": "ord_demo_001",
    "order.total": 49,
    "order.currency": "EUR",
    "order.paidAt": new Date().toISOString(),
  };
  const out: Record<string, unknown> = {};
  for (const key of selected) {
    if (!(key in flat)) continue;
    const parts = key.split(".");
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = flat[key];
  }
  out._test = true;
  out._source = "Novakou automation test";
  return out;
}

/**
 * POST /api/vendeur/automatisations/test-webhook
 * Body: { url, method, headers, selectedFields }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });

    const body = await request.json().catch(() => ({}));
    if (!isValidUrl(body.url)) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    const method = typeof body.method === "string" ? body.method.toUpperCase() : "POST";
    if (!["GET", "POST", "PUT"].includes(method)) {
      return NextResponse.json({ error: "Méthode non supportée" }, { status: 400 });
    }

    const rawHeaders = Array.isArray(body.headers) ? body.headers : [];
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Novakou-Automation/1.0",
    };
    for (const h of rawHeaders) {
      if (
        h &&
        typeof h.key === "string" &&
        typeof h.value === "string" &&
        h.key.trim() &&
        !/[\r\n]/.test(h.key) &&
        !/[\r\n]/.test(h.value)
      ) {
        headers[h.key.trim()] = h.value;
      }
    }

    const selectedFields = Array.isArray(body.selectedFields)
      ? body.selectedFields.filter((f: unknown): f is string => typeof f === "string")
      : [];
    const payload = buildDemoPayload(selectedFields);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let status = 0;
    let responseBody = "";
    try {
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (method !== "GET") {
        init.body = JSON.stringify(payload);
      }
      const res = await fetch(body.url, init);
      status = res.status;
      const text = await res.text();
      responseBody = text.slice(0, 2000);
    } catch (fetchErr) {
      clearTimeout(timeout);
      return NextResponse.json({
        error:
          fetchErr instanceof Error
            ? fetchErr.name === "AbortError"
              ? "Timeout (10s)"
              : fetchErr.message
            : "Erreur réseau",
      });
    }
    clearTimeout(timeout);

    return NextResponse.json({
      status,
      body: responseBody,
      sentPayload: payload,
    });
  } catch (err) {
    console.error("[test-webhook POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
