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
    // Petit delai pour ne pas bloquer le rendu initial
    const timer = setTimeout(() => {
      if (!getConsent()) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  function accept(choice: "all" | "essential") {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setVisible(false);

    // Activer Google Analytics si accepte
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
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-2xl mx-auto bg-neutral-dark border border-border-dark rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Barre superieure coloree */}
        <div className="h-1 bg-gradient-to-r from-primary via-blue-500 to-emerald-500" />

        <div className="p-5 sm:p-6">
          {/* Titre + icone */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">
                Nous respectons votre vie privee
              </h3>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Novakou utilise des cookies pour ameliorer votre experience, analyser le trafic et personnaliser le contenu.
              </p>
            </div>
          </div>

          {/* Details (toggle) */}
          {showDetails && (
            <div className="mb-4 rounded-xl bg-background-dark/60 border border-border-dark p-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-semibold">Essentiels</span>
                  <span className="text-slate-500 ml-1">(toujours actifs)</span>
                  <p className="text-slate-400 mt-0.5">Authentification, securite, preferences de langue et de devise. Necessaires au fonctionnement de la plateforme.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-semibold">Analytiques</span>
                  <p className="text-slate-400 mt-0.5">Google Analytics, PostHog. Nous aident a comprendre comment vous utilisez la plateforme pour l&apos;ameliorer.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-semibold">Marketing</span>
                  <p className="text-slate-400 mt-0.5">Permettent d&apos;afficher des recommandations personnalisees et de mesurer l&apos;efficacite de nos campagnes.</p>
                </div>
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => accept("all")}
              className="flex-1 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Tout accepter
            </button>
            <button
              onClick={() => accept("essential")}
              className="flex-1 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-border-dark text-slate-300 font-semibold text-sm rounded-xl transition-colors"
            >
              Essentiels uniquement
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              {showDetails ? "Masquer" : "Personnaliser"}
            </button>
          </div>

          {/* Lien politique cookies */}
          <p className="text-xs text-slate-500 mt-3 text-center sm:text-left">
            En savoir plus dans notre{" "}
            <Link href="/cookies" className="text-primary hover:underline">
              Politique de cookies
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="text-primary hover:underline">
              Politique de confidentialite
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
