"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Share, Plus } from "lucide-react";

/**
 * Bannière d'installation PWA (v2 Phase 4).
 *
 * Deux cas :
 *  - Android/Chrome/Edge : capture `beforeinstallprompt` → bouton « Installer ».
 *  - iOS Safari : aucun événement d'install n'existe (limite Apple). On détecte
 *    iPhone/iPad et on affiche les instructions « Partager → Sur l'écran
 *    d'accueil », sinon l'utilisateur croit que l'install est impossible.
 *
 * Discrète : masquée si déjà installée (standalone), refus mémorisé 30 j.
 *
 * Et surtout : elle ne s'invite pas n'importe où. Elle s'affichait sur TOUTES
 * les pages, paiement et connexion compris — sur iOS elle apparaissait même
 * immédiatement, sans attendre le moindre signe d'intérêt (retour du
 * fondateur, 2026-09-27). Une invite d'installation par-dessus un formulaire
 * de paiement fait perdre la vente.
 */

const DISMISS_KEY = "nk-pwa-install-dismissed";
const DISMISS_DAYS = 30;
/* Le visiteur doit avoir passé un moment sur le site avant qu'on lui propose
   quoi que ce soit. */
const DELAI_MS = 25_000;
/* Parcours où aucune invite n'a sa place : paiement, authentification,
   espaces connectés, administration. */
const ROUTES_SANS_INVITE = [
  "/checkout",
  "/payer",
  "/payment",
  "/panier",
  "/connexion",
  "/inscription",
  "/acheteur/connexion",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/2fa",
  "/verifier-email",
  "/onboarding",
  "/admin",
  "/admin-login",
  "/vendeur",
  "/apprenant",
  "/affilie",
  "/mentor",
  "/kyc",
  "/wallet",
  "/messages",
  "/maintenance",
];

function inviteInterdite(pathname: string): boolean {
  return ROUTES_SANS_INVITE.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua) ||
    // iPad iOS 13+ se présente comme un Mac tactile
    (/macintosh/i.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
  // Exclure les navigateurs in-app (Chrome iOS = CriOS, etc. ne peuvent pas installer)
  const isSafari = isIos && !/crios|fxios|edgios|opios/i.test(ua);
  return isSafari;
}

export function PWAInstallPrompt() {
  const pathname = usePathname() || "";
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (inviteInterdite(pathname)) return;
    // Déjà installé → ne rien faire
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS expose navigator.standalone
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Refus récent → on respecte
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (ts && Date.now() - Number(ts) < DISMISS_DAYS * 86_400_000) return;
    } catch {
      /* localStorage indisponible — on continue */
    }

    // iOS Safari : pas d'événement d'install, on montre les instructions —
    // mais après le délai, comme ailleurs.
    if (isIosSafari()) {
      const t = setTimeout(() => {
        setIos(true);
        setVisible(true);
      }, DELAI_MS);
      return () => clearTimeout(t);
    }

    // L'événement peut arriver tout de suite ; on garde l'invite pour plus tard.
    let pret = false;
    let attendu: BeforeInstallPromptEvent | null = null;
    const t = setTimeout(() => {
      pret = true;
      if (attendu) setVisible(true);
    }, DELAI_MS);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      attendu = e as BeforeInstallPromptEvent;
      setDeferred(attendu);
      if (pret) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, [pathname]);

  // Changement de page vers un parcours sensible : on retire l'invite.
  useEffect(() => {
    if (inviteInterdite(pathname)) setVisible(false);
  }, [pathname]);

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

  // ── iOS : instructions manuelles (pas de bouton d'install possible) ──────
  if (ios) {
    return (
      <div className="fixed bottom-4 inset-x-4 z-[9998] sm:left-auto sm:right-4 sm:max-w-sm">
        <div className="rounded-2xl border border-[#e4eae6] bg-white p-4 shadow-xl shadow-black/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white">
              <Download size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-[#191c1e]">Installer Novakou sur votre iPhone</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#5c647a]">
                Appuyez sur{" "}
                <Share size={13} className="inline -mt-0.5 text-[#006e2f]" /> <strong>Partager</strong> en bas
                de Safari, puis sur{" "}
                <Plus size={13} className="inline -mt-0.5 text-[#006e2f]" />{" "}
                <strong>« Sur l'écran d'accueil »</strong>.
              </p>
            </div>
            <button
              onClick={dismiss}
              aria-label="Fermer"
              className="flex-shrink-0 rounded-lg p-1.5 text-[#8aa092] hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Android / Chrome / Edge : bouton d'install natif ─────────────────────
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
