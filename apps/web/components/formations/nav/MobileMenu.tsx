"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavIcon, type StyleVars } from "./icons";
import { FEATURE_CATEGORIES, NAV_LINKS, RESOURCE_LINKS, isActivePath, isFeaturesPath, isResourcesPath } from "./nav-data";
import { reducedMotion, usePresence, useWillChange } from "./use-presence";

type Props = {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  pathname: string;
};

const EXIT_MS = 180;

/**
 * Menu plein écran (sous `lg`) : verre lourd, entrées révélées en cascade.
 * Les méga-menus deviennent deux accordéons ; aucune hauteur n'est animée,
 * seules les sous-entrées glissent (transform / opacity).
 *
 * Le scroll du document est verrouillé tant que le menu est ouvert ; le
 * parent referme à la navigation et gère Échap + le piège de focus.
 */
export function MobileMenu({ open, onClose, isLoggedIn, pathname }: Props) {
  const phase = usePresence(open, reducedMotion() ? 0 : EXIT_MS);
  const hot = useWillChange(phase);
  const rootRef = useRef<HTMLElement | null>(null);
  const [section, setSection] = useState<"features" | "resources" | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // À l'ouverture, le focus entre dans le menu ; à la fermeture, les
  // accordéons se replient pour la prochaine ouverture.
  useEffect(() => {
    if (open) {
      rootRef.current?.querySelector<HTMLElement>("a[href], button")?.focus({ preventScroll: true });
    } else {
      setSection(null);
    }
  }, [open]);

  if (phase === "closed") return null;

  let i = 0;
  const next = () => ({ "--i": i++ }) as StyleVars;

  return (
    <nav
      id="nk-mobile-menu"
      ref={rootRef}
      aria-label="Menu principal"
      className="nk-mobile lg:hidden"
      data-phase={phase}
      style={hot.style}
      onAnimationEnd={hot.onAnimationEnd}
    >
      <div className="nk-mobile__scroll">
        <ul className="mx-auto max-w-lg">
          {NAV_LINKS.map((l) => {
            if (l.mega) {
              return (
                <Accordion
                  key={l.href}
                  id="nk-mobile-features"
                  label={l.label}
                  active={isFeaturesPath(pathname)}
                  open={section === "features"}
                  onToggle={() => setSection((s) => (s === "features" ? null : "features"))}
                  style={next()}
                >
                  {FEATURE_CATEGORIES.map((cat) => (
                    <div key={cat.title}>
                      <p className="nk-mobile__group">{cat.title}</p>
                      <ul>
                        {cat.items.map((item, j) => (
                          <li key={item.label} className="nk-mobile__sub" style={{ "--i": j } as StyleVars}>
                            <Link href={item.href} onClick={onClose} className="nk-mobile__sublink">
                              <span className="nk-panel__ico"><NavIcon name={item.icon} /></span>
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Accordion>
              );
            }
            if (l.dropdown) {
              return (
                <Accordion
                  key={l.href}
                  id="nk-mobile-resources"
                  label={l.label}
                  active={isResourcesPath(pathname)}
                  open={section === "resources"}
                  onToggle={() => setSection((s) => (s === "resources" ? null : "resources"))}
                  style={next()}
                >
                  <ul>
                    {RESOURCE_LINKS.map((it, j) => (
                      <li key={it.href} className="nk-mobile__sub" style={{ "--i": j } as StyleVars}>
                        <Link href={it.href} onClick={onClose} className="nk-mobile__sublink">
                          <span className="nk-panel__ico"><NavIcon name={it.icon} /></span>
                          <span>
                            <span className="block">{it.label}</span>
                            <span className="block text-xs font-normal text-[#5c6b62]">{it.desc}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Accordion>
              );
            }
            const active = isActivePath(pathname, l.href);
            return (
              <li key={l.href} className="nk-mobile__item" style={next()}>
                <Link
                  href={l.href}
                  onClick={onClose}
                  className="nk-mobile__link"
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                  <NavIcon name="arrow_forward" className="nk-mobile__chev" />
                </Link>
              </li>
            );
          })}
        </ul>

        {!isLoggedIn && (
          <div className="nk-mobile__foot nk-mobile__item mx-auto max-w-lg" style={next()}>
            <Link href="/inscription" onClick={onClose} className="nk-btn nk-btn--primary nk-btn--block" style={{ minHeight: 48 }}>
              Créer ma boutique
              <span className="nk-btn__ico"><NavIcon name="arrow_forward" /></span>
            </Link>
            <Link href="/connexion" onClick={onClose} className="nk-btn nk-btn--glass nk-btn--block" style={{ minHeight: 48 }}>
              <NavIcon name="login" className="h-4 w-4" />
              Connexion
            </Link>
            <p className="nk-mobile__note">Zéro abonnement · 10 % par vente · Mobile Money &amp; carte</p>
          </div>
        )}
      </div>
    </nav>
  );
}

function Accordion({
  id, label, active, open, onToggle, style, children,
}: {
  id: string;
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  style: StyleVars;
  children: ReactNode;
}) {
  return (
    <li className="nk-mobile__item" style={style}>
      <button
        type="button"
        className="nk-mobile__link"
        aria-expanded={open}
        aria-controls={id}
        data-active={active || undefined}
        onClick={onToggle}
      >
        {label}
        <NavIcon name="expand_more" className="nk-mobile__chev" />
      </button>
      <div id={id} hidden={!open} className="nk-mobile__panel">
        {open && children}
      </div>
    </li>
  );
}
