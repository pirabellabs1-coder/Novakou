"use client";

import { useEffect, useState } from "react";

/**
 * Card-style invitation to the Novakou private WhatsApp community.
 * Shown on the vendeur / mentor / affilié dashboards. Dismissable per-browser
 * via localStorage so it doesn't nag returning users on every visit.
 */

const STORAGE_KEY = "nk-community-banner-dismissed-v1";
const COMMUNITY_URL = "https://chat.whatsapp.com/LlPG1Z7VCH8ELpsAzcyHNT";

type Tone = "vendeur" | "mentor" | "affilie";

const COPY: Record<Tone, { headline: string; body: string }> = {
  vendeur: {
    headline: "Rejoignez la communauté des vendeurs Novakou",
    body: "Échangez avec d'autres créateurs, partagez vos résultats et recevez les nouveautés produit en avant-première sur WhatsApp.",
  },
  mentor: {
    headline: "Rejoignez la communauté des mentors Novakou",
    body: "Discutez avec les autres mentors, partagez vos méthodes et recevez les annonces produit en avant-première sur WhatsApp.",
  },
  affilie: {
    headline: "Rejoignez la communauté des affiliés Novakou",
    body: "Apprenez les meilleures stratégies d'affiliation, partagez vos succès et restez informé des nouveaux produits à promouvoir.",
  },
};

export function CommunityBanner({ tone }: { tone: Tone }) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;
  // While we don't yet know the dismissed flag (first paint), reserve no
  // space — flicker is preferable to a permanent layout shift.
  if (dismissed === null) return null;

  const copy = COPY[tone];

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setDismissed(true);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-5 md:p-6 mb-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer cette invitation"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70 hover:bg-white text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            forum
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 mb-1">
            Communauté privée
          </p>
          <h3 className="text-base md:text-lg font-extrabold text-zinc-900 leading-snug">
            {copy.headline}
          </h3>
          <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed pr-6">
            {copy.body}
          </p>
          <a
            href={COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:bg-[#1ebe5a] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              forum
            </span>
            Rejoindre sur WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
