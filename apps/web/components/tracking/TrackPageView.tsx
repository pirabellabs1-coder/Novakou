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

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { forwardToGA4 } from "@/lib/tracking/ga";

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

// ─── Envoi groupé ──────────────────────────────────────────────────────────
// Une fiche monte DEUX traceurs au même instant (vue de page du layout racine
// + vue produit/formation/boutique de la page) : ils partaient en deux
// requêtes, soit deux exécutions de fonction par visite. On les met en file
// et on les envoie en UNE requête au tick suivant (`{ events: [...] }`).
//
// La file vit sur `window`, PAS dans le module : le bundler embarque ce
// fichier dans deux paquets distincts (layout racine et page), donc deux
// copies du module — une file par copie n'aurait jamais rien regroupé
// (constaté en production le 2026-10-04).
type FileSuivi = { evenements: Record<string, unknown>[]; planifie: boolean };
function fileSuivi(): FileSuivi {
  const w = window as unknown as { __nkFileSuivi?: FileSuivi };
  if (!w.__nkFileSuivi) w.__nkFileSuivi = { evenements: [], planifie: false };
  return w.__nkFileSuivi;
}

function envoyer(body: string) {
  // sendBeacon survit à la navigation / fermeture de l'onglet.
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    /* repli fetch */
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => null);
}

// Fenêtre de regroupement : les deux traceurs ne s'hydratent PAS dans le même
// tick (chacun derrière sa propre frontière Suspense) — mesuré en production,
// un délai de 0 ms laissait partir deux requêtes. 1 s les réunit ; si le
// visiteur quitte la page avant, `pagehide` vide la file aussitôt.
const FENETRE_REGROUPEMENT_MS = 1000;

function viderFile() {
  const file = fileSuivi();
  if (file.evenements.length === 0) return;
  const lot = file.evenements;
  file.evenements = [];
  file.planifie = false;
  envoyer(JSON.stringify(lot.length === 1 ? lot[0] : { events: lot }));
}

function planifierEnvoi(evenement: Record<string, unknown>) {
  const file = fileSuivi();
  file.evenements.push(evenement);
  if (file.planifie) return;
  file.planifie = true;
  window.addEventListener("pagehide", viderFile, { once: true });
  setTimeout(viderFile, FENETRE_REGROUPEMENT_MS);
}

function readUTM(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
  };
}

/**
 * `useSearchParams()` exige une frontière <Suspense> dès que la page est mise
 * en cache (statique/ISR) : sans elle, le rendu échoue
 * (BAILOUT_TO_CLIENT_SIDE_RENDERING → page 500). Le composant s'en protège
 * lui-même pour que TOUS les endroits qui le montent soient sûrs : les fiches
 * produit, formation et boutique le montaient sans protection (régression du
 * 2026-10-04, annulée par rollback).
 */
export default function TrackPageView(props: TrackPageViewProps) {
  return (
    <Suspense fallback={null}>
      <TrackPageViewInner {...props} />
    </Suspense>
  );
}

function TrackPageViewInner({
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

    // Miroir GA4 : page_view sur CHAQUE navigation (App Router ne le fait pas
    // tout seul) + view_item sur les pages détail. C'est ce qui fait remonter
    // les visites/pages vues dans GA4 et Search Console.
    forwardToGA4(type, entityId, metadata);

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

    planifierEnvoi(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, type, entityType, entityId]);

  return null;
}
