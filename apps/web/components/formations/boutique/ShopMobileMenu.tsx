"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { reducedMotion, usePresence, useWillChange } from "@/components/formations/nav/use-presence";
import type { StyleVars } from "./accent";

export interface ShopNavLink {
  href: string;
  label: string;
  current?: boolean;
}

const EXIT_MS = 180;

/**
 * Menu plein écran d'une boutique (sous `lg`) : verre lourd, entrées en
 * cascade, même famille que le menu public — en plus sobre. Le document est
 * verrouillé tant qu'il est ouvert ; le parent gère Échap, le piège de focus
 * et la fermeture à la navigation.
 */
export function ShopMobileMenu({
  open,
  onClose,
  links,
  home,
}: {
  open: boolean;
  onClose: () => void;
  links: ShopNavLink[];
  /** Accueil de la boutique ("/" sur domaine perso, "/slug" sinon). */
  home: string;
}) {
  const phase = usePresence(open, reducedMotion() ? 0 : EXIT_MS);
  const hot = useWillChange(phase);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // À l'ouverture, le focus entre dans le menu.
  useEffect(() => {
    if (open) rootRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });
  }, [open]);

  if (phase === "closed") return null;

  let i = 0;
  const next = () => ({ "--i": i++ }) as StyleVars;
  const entrees: ShopNavLink[] = [
    ...links,
    { href: "/apprenant/mes-produits", label: "Mes achats" },
    { href: "/panier", label: "Panier" },
  ];

  return (
    <nav
      id="nkb-mobile-menu"
      ref={rootRef}
      aria-label="Menu de la boutique"
      className="nkb-mobile"
      data-phase={phase}
      style={hot.style}
      onAnimationEnd={hot.onAnimationEnd}
    >
      <div className="nkb-mobile__scroll">
        <ul className="nkb-mobile__list">
          {entrees.map((l) => (
            <li key={l.label} className="nkb-mobile__item" style={next()}>
              <a href={l.href} onClick={onClose} className="nkb-mobile__link" aria-current={l.current ? "page" : undefined}>
                {l.label}
                <ArrowRight strokeWidth={1.5} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <div className="nkb-mobile__foot nkb-mobile__item" style={next()}>
          <a href={`${home}#catalogue`} onClick={onClose} className="nkb-btn nkb-btn--primary nkb-btn--lg nkb-btn--block">
            Voir les produits
            <span className="nkb-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </a>
          <p className="nkb-mobile__note">
            Propulsé par <a href="https://novakou.com">Novakou</a>
          </p>
        </div>
      </div>
    </nav>
  );
}
