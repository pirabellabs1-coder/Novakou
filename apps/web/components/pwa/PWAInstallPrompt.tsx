"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

/**
 * Bannière d'installation PWA (v2 Phase 4).
 *
 * Capture l'événement `beforeinstallprompt` (Chrome/Edge/Android) et propose
 * un bouton « Installer ». Discrète et non intrusive :
 *  - n'apparaît que si le navigateur le permet ET que l'app n'est pas déjà
 *    installée (display-mode: standalone) ;
 *  - mémorise le refus dans localStorage (ne re-sollicite pas pendant 30 j) ;
 *  - aucune dépendance, échec silencieux.
 *
 * iOS Safari ne supporte pas `beforeinstallprompt` → la bannière ne s'affiche
 * pas (l'install s'y fait via Partager → « Sur l'écran d'accueil »).
 */

const DISMISS_KEY = "nk-pwa-install-dismissed";
const DISMISS_DAYS = 30;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Déjà installé → ne rien faire
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;

    // Refus récent → on respecte
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (ts && Date.now() - Number(ts) < DISMISS_DAYS * 86_400_000) return;
    } catch {
      /* localStorage indisponible — on continue */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setVisible(false);
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-[9998] sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-[#e4eae6] bg-white p-3 shadow-xl shadow-black/10">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white">
          <Download size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-[#191c1e]">Installer Novakou</p>
          <p className="text-[11px] text-[#5c647a]">Accès rapide, hors-ligne, comme une vraie app.</p>
        </div>
        <button
          onClick={install}
          className="flex-shrink-0 rounded-lg bg-gradient-to-r from-[#006e2f] to-[#22c55e] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
        >
          Installer
        </button>
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="flex-shrink-0 rounded-lg p-1.5 text-[#8aa092] hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
