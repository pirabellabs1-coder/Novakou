"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { sora } from "@/lib/fonts";
import { animerCompteurs } from "@/components/home/reveal-compteurs";
import { mouvementReduit, observerReveals } from "./reveal";
import "./public.css";

/**
 * Coque commune des pages publiques : pose le scope `.nkpub` (tokens,
 * polices Sora/Inter, grain) et branche, après montage, les révélations
 * `.nkp-reveal` et les compteurs `[data-count]` — anime.js chargé à la
 * demande, mouvement réduit respecté. Les enfants restent des Server
 * Components : seule cette enveloppe est cliente.
 *
 * `cle` : à changer quand du contenu `.nkp-reveal` est monté plus tard
 * (grille chargée côté client) pour ré-observer les nouveaux éléments.
 */
export function CoquePublique({ children, className = "", cle = "" }: { children: ReactNode; className?: string; cle?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduit = mouvementReduit();
    const arreterReveals = observerReveals(root, reduit);
    const arreterCompteurs = animerCompteurs(root, reduit);
    return () => {
      arreterReveals();
      arreterCompteurs();
    };
  }, [cle]);

  return (
    <div ref={ref} className={`nkpub ${sora.variable} ${className}`.trim()}>
      {/* Sans JS : on neutralise l'état caché des reveals pour ne jamais masquer le contenu. */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: ".nkpub .nkp-reveal{opacity:1 !important;transform:none !important}" }} />
      </noscript>
      {children}
    </div>
  );
}
