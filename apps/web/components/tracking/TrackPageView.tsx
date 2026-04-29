"use client";

/**
 * TrackPageView — composant client qui fire un event tracking sur chaque
 * navigation. Monté UNE FOIS dans le root layout pour couvrir 100 % du
 * site automatiquement (espaces vendeur / apprenant / mentor / affilié /
 * public / admin), et accepte des props optionnelles pour enrichir les
 * events sur les pages détaillées (produit, formation, boutique, mentor).
 *
 * Logique :
 *   - sessionId stocké dans sessionStorage (durée onglet)
 *   - utm + referrer capturés au premier event
 *   - dedup local : on ne re-fire pas le même event pour la même URL en <2s
 *   - utilise navigator.sendBeacon quand disponible (pas de race au unload)
 *   - silencieux : aucune erreur ne casse la page si /api/track est down
 */

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface TrackPageViewProps {
  /**
   * Type d'event spécifique. Par défaut "page_view". Spécifier pour les
   * pages détaillées : "product_view", "formation_view", "shop_view",
   * "mentor_view", "affiliate_landing_view", etc.
   */
  type?: string;
  /** Type d'entité — "product" | "formation" | "shop" | "mentor" | "affiliate" | "lesson" | "category". */
  entityType?: string;
  /** ID de l'entité — productId, formationId, shopId, mentorId, etc. */
  entityId?: string;
  /** Métadonnées supplémentaires (titre, prix, vendor, etc.) */
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = "nk_session_id";
const LAST_FIRED_KEY = "nk_last_fired";

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = genId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return genId();
  }
}

function readUTM(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
  };
}

export default function TrackPageView({
  type = "page_view",
  entityType,
  entityId,
  metadata,
}: TrackPageViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dedupKey = `${type}|${pathname}|${entityId ?? ""}`;
    // Ignore consecutive fires of the same event within 2s (dev StrictMode, double-mount, etc.)
    if (lastKey.current === dedupKey) return;
    const now = Date.now();
    try {
      const last = window.sessionStorage.getItem(LAST_FIRED_KEY);
      if (last) {
        const [k, t] = last.split(":");
        if (k === dedupKey && now - Number(t) < 2000) return;
      }
      window.sessionStorage.setItem(LAST_FIRED_KEY, `${dedupKey}:${now}`);
    } catch {
      /* ignore */
    }
    lastKey.current = dedupKey;

    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const utm = readUTM(new URLSearchParams(searchParams.toString()));

    const payload = {
      eventId: genId(),
      type,
      path: pathname,
      sessionId,
      entityType,
      entityId,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      ...utm,
      metadata,
    };

    const body = JSON.stringify(payload);

    // Use sendBeacon when available — survives navigations / tab close
    try {
      if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon(
          "/api/track",
          new Blob([body], { type: "application/json" }),
        );
        if (ok) return;
      }
    } catch {
      /* fallthrough */
    }

    // Fallback : fetch fire-and-forget
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, type, entityType, entityId]);

  return null;
}
