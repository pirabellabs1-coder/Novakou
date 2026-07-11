"use client";

/**
 * SaleAvailability — composant client qui affiche :
 *   1. Un compte à rebours (J/H/M/S) si `salesEndAt` est défini et futur.
 *   2. Une barre de progression "X / max vendus, Y restants" si maxBuyers est défini.
 *   3. Un état `ended` (vente terminée) ou `soldOut` (stock épuisé) si on a dépassé.
 *
 * Le parent peut consommer `onAvailabilityChange(canBuy)` pour désactiver le
 * bouton d'achat dynamiquement (ex: la deadline tombe pendant que l'utilisateur
 * lit la page).
 */

import { useEffect, useMemo, useState } from "react";

interface Props {
  salesEndAt: string | null | undefined;
  maxBuyers: number | null | undefined;
  currentBuyers: number | null | undefined;
  /** Couleur de marque pour la barre. Défaut : vert Novakou. */
  themeColor?: string;
  onAvailabilityChange?: (canBuy: boolean) => void;
}

function diffParts(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    expired: ms === 0,
  };
}

export function SaleAvailability({
  salesEndAt,
  maxBuyers,
  currentBuyers,
  themeColor = "#006e2f",
  onAvailabilityChange,
}: Props) {
  const targetMs = useMemo(() => (salesEndAt ? new Date(salesEndAt).getTime() : null), [salesEndAt]);
  const [now, setNow] = useState(() => Date.now());

  // Tick chaque seconde uniquement si on a une deadline future à afficher.
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const expired = !!(targetMs && now >= targetMs);
  const hasMax = typeof maxBuyers === "number" && maxBuyers > 0;
  const sold = Math.max(0, currentBuyers ?? 0);
  const remaining = hasMax ? Math.max(0, (maxBuyers as number) - sold) : null;
  const percent = hasMax ? Math.min(100, (sold / (maxBuyers as number)) * 100) : 0;
  const soldOut = hasMax && remaining === 0;

  const canBuy = !expired && !soldOut;
  useEffect(() => {
    onAvailabilityChange?.(canBuy);
  }, [canBuy, onAvailabilityChange]);

  // Rien à afficher si aucune limite n'est définie
  if (!targetMs && !hasMax) return null;

  // Vente terminée (priorité visuelle sur le sold-out)
  if (expired) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-red-600 text-[20px]">block</span>
          <p className="text-sm font-extrabold text-red-700">Vente terminée</p>
        </div>
        <p className="text-xs text-red-600/80">
          Ce produit n&apos;est plus disponible à l&apos;achat. Le vendeur peut décider de le remettre en vente.
        </p>
      </div>
    );
  }

  if (soldOut) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-amber-700 text-[20px]">inventory_2</span>
          <p className="text-sm font-extrabold text-amber-800">Stock épuisé</p>
        </div>
        <p className="text-xs text-amber-700/90">
          Toutes les places ont été vendues ({sold}/{maxBuyers}). Revenez bientôt — le vendeur peut réouvrir.
        </p>
      </div>
    );
  }

  const parts = targetMs ? diffParts(targetMs) : null;

  return (
    <div className="space-y-4 mt-4">
      {/* Barre de progression des ventes — Vendu / Restant (façon offre flash) */}
      {hasMax && (
        <div>
          <div className="flex items-center justify-between text-[13px] font-bold text-[#191c1e] mb-1.5">
            <span>Vendu&nbsp;: <span className="tabular-nums">{sold}</span></span>
            <span>Restant&nbsp;: <span className="tabular-nums">{remaining}</span></span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(4, percent)}%`, background: "linear-gradient(to right, #f59e0b, #fbbf24)" }}
            />
          </div>
          <p className="text-[12px] font-bold text-red-600 mt-1.5">Offre à durée limitée</p>
        </div>
      )}

      {/* Compte à rebours — carte propre avec en-tête */}
      {parts && targetMs && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-gray-100 py-2.5 text-center">
            <p className="text-[13px] font-extrabold text-[#191c1e]">L&apos;offre se termine dans</p>
          </div>
          <div className="flex items-start justify-center gap-1.5 md:gap-3 py-5 px-3">
            {[
              { label: "Jours", value: parts.days },
              { label: "Heures", value: parts.hours },
              { label: "Minutes", value: parts.minutes },
              { label: "Secondes", value: parts.seconds },
            ].map((b, i) => (
              <div key={b.label} className="flex items-start gap-1.5 md:gap-3">
                <div className="text-center min-w-[42px]">
                  <p className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tabular-nums leading-none">
                    {String(b.value).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] font-semibold text-[#5c647a] mt-1.5">{b.label}</p>
                </div>
                {i < 3 && <span className="text-2xl md:text-3xl font-extrabold text-gray-300 leading-none mt-0.5">:</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
