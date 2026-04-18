"use client";

/**
 * Bandeau de consentement cookies (RGPD / CNIL).
 *
 * - Affiche un banner fixe en bas de page tant qu'aucun choix n'est enregistré.
 * - 3 actions : "Tout accepter", "Tout refuser", "Personnaliser".
 * - Stocke le choix dans localStorage + un cookie `nk_consent` (lisible côté
 *   serveur pour skipper les scripts analytics/marketing si refusé).
 * - Catégories : `essential` (toujours ON), `preferences`, `analytics`,
 *   `marketing`.
 *
 * Le tracker (`lib/tracking/tracker.ts`) lit ce consentement via
 * `getConsent().analytics` pour bloquer l'envoi s'il est à false.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "nk_consent";
const COOKIE_NAME = "nk_consent";

export interface Consent {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  setAt: string; // ISO
  version: 1;
}

const DEFAULT_REJECT: Consent = {
  essential: true,
  preferences: false,
  analytics: false,
  marketing: false,
  setAt: new Date(0).toISOString(),
  version: 1,
};

export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Consent;
  } catch {
    return null;
  }
}

function persist(c: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch { /* ignore */ }
  // Cookie valable 6 mois, lisible côté serveur (SameSite=Lax, path=/)
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify({
    a: c.analytics ? 1 : 0,
    m: c.marketing ? 1 : 0,
    p: c.preferences ? 1 : 0,
  }))}; path=/; max-age=${maxAge}; SameSite=Lax`;
  // Event custom pour que le tracker puisse se (ré)armer sans reload
  try {
    window.dispatchEvent(new CustomEvent("nk:consent-change", { detail: c }));
  } catch { /* ignore */ }
}

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const saved = getConsent();
    if (!saved) setOpen(true);
  }, []);

  function acceptAll() {
    const c: Consent = {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true,
      setAt: new Date().toISOString(),
      version: 1,
    };
    persist(c);
    setOpen(false);
  }

  function rejectAll() {
    const c: Consent = {
      ...DEFAULT_REJECT,
      setAt: new Date().toISOString(),
    };
    persist(c);
    setOpen(false);
  }

  function saveCustom() {
    const c: Consent = {
      essential: true,
      preferences,
      analytics,
      marketing,
      setAt: new Date().toISOString(),
      version: 1,
    };
    persist(c);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[60] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 md:p-6"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[20px]">cookie</span>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Votre vie privée, vos choix</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Nous utilisons des cookies pour faire fonctionner le site, mémoriser vos préférences et
            mesurer l&apos;audience.{" "}
            <Link href="/cookies" className="underline hover:text-emerald-700">
              En savoir plus
            </Link>
          </p>
        </div>
      </div>

      {custom && (
        <div className="space-y-2.5 mb-4 pt-3 border-t border-slate-100">
          <Row
            title="Essentiels"
            desc="Obligatoires — authentification, panier, sécurité."
            checked
            onChange={() => undefined}
            disabled
          />
          <Row
            title="Préférences"
            desc="Devise, langue, thème sombre, boutique active."
            checked={preferences}
            onChange={setPreferences}
          />
          <Row
            title="Analytics"
            desc="Mesure d'audience anonymisée (pages vues, parcours)."
            checked={analytics}
            onChange={setAnalytics}
          />
          <Row
            title="Marketing"
            desc="Pixels de conversion (Meta, TikTok) utilisés par les vendeurs."
            checked={marketing}
            onChange={setMarketing}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={acceptAll}
          className="flex-1 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md shadow-emerald-500/20"
          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          Tout accepter
        </button>
        <button
          onClick={rejectAll}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
        >
          Tout refuser
        </button>
        {!custom ? (
          <button
            onClick={() => setCustom(true)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            Personnaliser
          </button>
        ) : (
          <button
            onClick={saveCustom}
            className="flex-1 px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50"
          >
            Enregistrer
          </button>
        )}
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${
          disabled ? "bg-emerald-500 opacity-70 cursor-not-allowed" : checked ? "bg-emerald-500" : "bg-slate-200"
        }`}
        aria-pressed={checked}
        aria-label={title}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
