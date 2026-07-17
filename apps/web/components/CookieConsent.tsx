"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "fh-cookie-consent";

type ConsentChoice = "all" | "essential" | null;

function getConsent(): ConsentChoice {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "all" || value === "essential") return value;
  return null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Petit délai pour ne pas bloquer le rendu initial
    const timer = setTimeout(() => {
      if (!getConsent()) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  function accept(choice: "all" | "essential") {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setVisible(false);

    // Activer Google Analytics si accepté
    if (choice === "all" && typeof window !== "undefined") {
      const gaId = document.querySelector<HTMLScriptElement>(
        'script[src*="googletagmanager"]'
      );
      if (gaId) {
        ((window as unknown) as Record<string, (...args: unknown[]) => void>).gtag?.("consent", "update", {
          analytics_storage: "granted",
        });
      }
    }
  }

  if (!visible) return null;

  return (
    /* Carte compacte : elle ne barre plus toute la page et ne masque plus le
       contenu (hero de boutique, etc.). Le bouton de chat étant en
       `bottom-5 right-5` (56 px), on réserve sa colonne sur mobile (right-20)
       et on ancre la carte en bas à gauche sur desktop : aucun recouvrement. */
    <div className="fixed bottom-5 left-3 right-20 sm:left-5 sm:right-auto sm:w-[21rem] z-[9999] animate-in slide-in-from-bottom duration-500">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
        <div className="p-4">
          {/* Titre + icône */}
          <div className="flex items-start gap-2.5">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#006e2f]/10 flex items-center justify-center mt-0.5">
              <svg className="w-4 h-4 text-[#006e2f]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 1 0-18 4 4 0 0 0 4 4 4 4 0 0 0 4 4 9 9 0 0 1-8 10Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 10.5h.01M13 14.5h.01M9 16h.01" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-slate-900 font-bold text-sm leading-snug">
                Nous respectons votre vie privée
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Novakou utilise des cookies pour améliorer votre expérience et analyser le trafic.
              </p>
            </div>
          </div>

          {/* Détails (repliable) */}
          {showDetails && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-900 font-semibold">Essentiels</span>
                  <span className="text-slate-400 ml-1">(toujours actifs)</span>
                  <p className="text-slate-500 mt-0.5">Authentification, sécurité, langue et devise. Nécessaires au fonctionnement de la plateforme.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-900 font-semibold">Analytiques</span>
                  <p className="text-slate-500 mt-0.5">Google Analytics, PostHog. Nous aident à comprendre comment vous utilisez la plateforme pour l&apos;améliorer.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#006e2f] mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-900 font-semibold">Marketing</span>
                  <p className="text-slate-500 mt-0.5">Recommandations personnalisées et mesure de l&apos;efficacité de nos campagnes.</p>
                </div>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => accept("all")}
              className="flex-1 px-3 py-2 bg-[#006e2f] hover:bg-[#005825] text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Tout accepter
            </button>
            <button
              onClick={() => accept("essential")}
              className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Essentiels
            </button>
          </div>

          {/* Personnaliser + liens légaux */}
          <div className="flex items-center justify-between gap-2 mt-2.5">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              {showDetails ? "Masquer" : "Personnaliser"}
            </button>
            <p className="text-[11px] text-slate-400">
              <Link href="/cookies" className="hover:text-[#006e2f] hover:underline">
                Cookies
              </Link>
              {" · "}
              <Link href="/confidentialite" className="hover:text-[#006e2f] hover:underline">
                Confidentialité
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
