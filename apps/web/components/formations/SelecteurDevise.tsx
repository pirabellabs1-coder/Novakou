"use client";

import { useEffect, useRef, useState } from "react";
import { PAYS_AFFICHAGE, deviseDuPays } from "@/lib/currency/rates";

/**
 * Sélecteur de pays dans l'en-tête d'une boutique.
 *
 * Un visiteur guinéen qui lit « 5 000 F CFA » ne sait pas ce que ça lui coûte.
 * Il repart. Le sélecteur lui montre le prix dans SA devise — sans rien changer
 * à ce que le vendeur reçoit, qui reste en FCFA.
 *
 * Le choix est mémorisé : le redemander à chaque page serait pire que ne rien
 * proposer.
 */

const CLE_MEMOIRE = "novakou:pays-affichage";

/** Prévient le reste de la page qu'il faut réafficher les prix. */
export const EVENEMENT_DEVISE = "novakou:devise-changee";

/** Pays d'affichage courant, lisible par n'importe quel composant. */
export function paysAffichageCourant(): string {
  if (typeof window === "undefined") return "BJ";
  return window.localStorage.getItem(CLE_MEMOIRE) || "BJ";
}

export function SelecteurDevise({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [pays, setPays] = useState<string>("BJ");
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLDivElement>(null);

  // Le rendu serveur ne connaît pas le choix du visiteur : on le lit APRÈS
  // l'affichage, sinon le HTML servi et celui du navigateur divergent.
  useEffect(() => setPays(paysAffichageCourant()), []);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", dehors);
    return () => document.removeEventListener("mousedown", dehors);
  }, [ouvert]);

  const choisir = (code: string) => {
    setPays(code);
    setOuvert(false);
    window.localStorage.setItem(CLE_MEMOIRE, code);
    // Les prix vivent dans d'autres composants : on les prévient plutôt que
    // de recharger la page, qui ferait perdre au visiteur sa position.
    window.dispatchEvent(new CustomEvent(EVENEMENT_DEVISE, { detail: code }));
  };

  const courant = PAYS_AFFICHAGE.find((p) => p.code === pays) ?? PAYS_AFFICHAGE[0];
  const devise = deviseDuPays(courant.code);
  const sombre = tone === "dark";

  return (
    <div className="relative" ref={boite}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label="Choisir votre pays"
        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[13px] font-bold transition-colors ${
          sombre
            ? "border-white/25 text-white hover:bg-white/10"
            : "border-[#e3e8ea] text-[#191c1e] hover:bg-slate-50"
        }`}
      >
        <span className="text-[16px] leading-none">{courant.drapeau}</span>
        <span className="hidden sm:inline">
          {courant.nom} ({devise.symbole})
        </span>
        <span className="sm:hidden">{devise.symbole}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {ouvert && (
        <div
          className="absolute right-0 top-full mt-2 w-[230px] max-h-[320px] overflow-y-auto rounded-2xl border border-[#e3e8ea] bg-white shadow-2xl z-50 py-1"
          role="listbox"
        >
          {PAYS_AFFICHAGE.map((p) => {
            const d = deviseDuPays(p.code);
            const actif = p.code === pays;
            return (
              <button
                key={p.code}
                type="button"
                role="option"
                aria-selected={actif}
                onClick={() => choisir(p.code)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-left transition-colors hover:bg-[#f5f8f6] ${
                  actif ? "font-extrabold text-[#006e2f]" : "font-semibold text-[#191c1e]"
                }`}
              >
                <span className="text-[17px] leading-none">{p.drapeau}</span>
                <span className="flex-1 truncate">{p.nom}</span>
                <span className="text-[12px] text-[#5c647a]">{d.symbole}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
