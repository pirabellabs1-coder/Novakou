"use client";

import { useEffect, useState, type RefObject } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { usePrix } from "@/components/formations/Prix";

/**
 * Barre d'achat fixe en bas d'écran (sous `lg`) : prix + bouton. Elle glisse
 * depuis le bord (transform/opacity) une fois le premier écran dépassé, et se
 * retire tant que la carte d'achat en flux est visible — jamais deux boutons
 * « Acheter » à l'écran. `inert` la sort du clavier et des lecteurs d'écran
 * quand elle est cachée.
 */
export function BarreAchatMobile({
  prix,
  prixInitial,
  gratuit,
  libelle,
  onClick,
  disabled,
  Icone,
  apresRef,
  carteRef,
}: {
  prix: number;
  prixInitial?: number | null;
  gratuit?: boolean;
  libelle: string;
  onClick: () => void;
  disabled?: boolean;
  Icone?: LucideIcon;
  /** Bloc à dépasser avant d'apparaître (l'en-tête : premier écran). */
  apresRef: RefObject<HTMLElement | null>;
  /** Carte d'achat en flux : la barre se retire quand elle est à l'écran. */
  carteRef?: RefObject<HTMLElement | null>;
}) {
  const formatPrix = usePrix();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const entete = apresRef.current;
    const carte = carteRef?.current ?? null;
    if (!entete || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    let passe = false;
    let carteVisible = false;
    const io = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.target === entete) passe = !e.isIntersecting && e.boundingClientRect.bottom < 0;
          else if (e.target === carte) carteVisible = e.isIntersecting;
        }
        setVisible(passe && !carteVisible);
      },
      { threshold: 0 },
    );
    io.observe(entete);
    if (carte) io.observe(carte);
    return () => io.disconnect();
  }, [apresRef, carteRef]);

  // Les éléments flottants (bulle de l'assistant IA) lisent cette variable
  // pour remonter au-dessus de la barre tant qu'elle est visible.
  useEffect(() => {
    const racine = document.documentElement;
    racine.style.setProperty("--nk-barre-bas", visible ? "84px" : "0px");
    return () => {
      racine.style.removeProperty("--nk-barre-bas");
    };
  }, [visible]);

  const estGratuit = gratuit ?? prix === 0;

  return (
    <div className={`nkf-bar ${visible ? "is-visible" : ""}`} inert={!visible} role="region" aria-label="Achat rapide">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5c6b62]">{estGratuit ? "Accès gratuit" : "Prix"}</p>
          <p className="nkf-bar__price truncate">
            {estGratuit ? "Gratuit" : formatPrix(prix)}
            {!estGratuit && prixInitial && prixInitial > prix && (
              <s>
                <span className="sr-only">Prix initial </span>
                {formatPrix(prixInitial)}
              </s>
            )}
          </p>
        </div>
        <button type="button" onClick={onClick} disabled={disabled} className="nkf-btn nkf-btn--primary flex-shrink-0">
          <span className="nkf-btn__label">
            {Icone && <Icone aria-hidden="true" />}
            {libelle}
          </span>
          <span className="nkf-btn__ico" aria-hidden="true">
            <ArrowRight strokeWidth={2.2} />
          </span>
        </button>
      </div>
    </div>
  );
}
