"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import CartBadge from "./CartBadge";
import "./nav/nav.css";
import { NavIcon, type StyleVars } from "./nav/icons";
import {
  FEATURE_CATEGORIES, FEATURE_HIGHLIGHTS, NAV_LINKS, RESOURCE_LINKS,
  isActivePath, isFeaturesPath, isResourcesPath,
} from "./nav/nav-data";
import { NavDisclosure } from "./nav/NavDisclosure";
import { MobileMenu } from "./nav/MobileMenu";
import { UserMenu } from "./nav/UserMenu";
import { useScrolled } from "./nav/use-scrolled";

/**
 * Barre de navigation publique : île en verre détachée du bord, compactée au
 * défilement, méga-menus au survol et au clavier, menu mobile plein écran.
 *
 * Les liens desktop n'apparaissent qu'à partir de `lg` : en dessous, ils ne
 * tenaient pas (à 768 px, « Marketplace » se collait au logo et le panier
 * sortait de l'écran) — le menu plein écran prend le relais.
 */
export function FormationsNavbar() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const pathname = usePathname() || "/";
  const { scrolled, sentinelRef, sentinelStyle } = useScrolled(24);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  // Fermeture à la navigation (les liens ferment déjà au clic ; ceci couvre
  // le retour arrière et les redirections).
  useEffect(() => setMobileOpen(false), [pathname]);

  /**
   * Menu mobile ouvert : Échap referme et rend le focus au hamburger ; Tab
   * boucle entre les contrôles visibles du header (hamburger inclus), pour
   * ne pas envoyer le clavier sous le voile.
   */
  function onHeaderKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (!mobileOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setMobileOpen(false);
      burgerRef.current?.focus();
      return;
    }
    if (e.key !== "Tab" || !headerRef.current) return;
    const nodes = Array.from(
      headerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    ).filter((el) => el.getClientRects().length > 0);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      {/* Témoin de défilement : bloc invisible en haut du document, observé par IntersectionObserver. */}
      <span ref={sentinelRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-px" style={sentinelStyle} />

      <header
        ref={headerRef}
        className="nk-nav fixed inset-x-0 top-0 z-50"
        data-scrolled={scrolled ? "" : undefined}
        onKeyDown={onHeaderKeyDown}
      >
        <div className="mx-auto max-w-7xl px-2.5 pt-2 lg:px-6 lg:pt-4">
          <div className="nk-nav__island">
            <span className="nk-nav__glass" aria-hidden="true" />
            <span className="nk-nav__glass-dense" aria-hidden="true" />

            <div className="relative flex h-14 items-center justify-between gap-2 px-2 lg:h-[60px] lg:px-3">
              {/* Logo */}
              <Link href="/" className="nk-nav__logo flex-shrink-0 pl-1" aria-label="Novakou — accueil">
                <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="36" height="36" rx="10" fill="#006e2f" />
                  <path d="M11 26V10h3l7 10.5V10h3v16h-3L14 15.5V26h-3z" fill="white" />
                </svg>
                <span className="hidden text-[17px] font-extrabold tracking-tight text-[#0e1512] min-[380px]:inline">Novakou</span>
              </Link>

              {/* Liens desktop */}
              <nav aria-label="Navigation principale" className="hidden lg:block">
                <ul className="flex items-center gap-0.5">
                  {NAV_LINKS.map((l) => {
                    if (l.mega) {
                      return (
                        <NavDisclosure key={l.href} label={l.label} active={isFeaturesPath(pathname)} align="island">
                          {(close) => <FeaturesPanel close={close} />}
                        </NavDisclosure>
                      );
                    }
                    if (l.dropdown) {
                      return (
                        <NavDisclosure key={l.href} label={l.label} active={isResourcesPath(pathname)} align="trigger">
                          {(close) => <ResourcesPanel close={close} />}
                        </NavDisclosure>
                      );
                    }
                    const active = isActivePath(pathname, l.href);
                    return (
                      <li key={l.href}>
                        <Link href={l.href} className="nk-nav__link" aria-current={active ? "page" : undefined}>
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Côté droit */}
              <div className="flex items-center gap-1 sm:gap-2">
                <CartBadge />
                {status === "loading" ? (
                  <div className="h-9 w-9 animate-pulse rounded-full bg-[#0e1512]/[.06]" aria-hidden="true" />
                ) : isLoggedIn ? (
                  <UserMenu
                    name={session.user.name ?? null}
                    email={session.user.email ?? ""}
                    image={session.user.image ?? null}
                    role={(session.user as { role?: string }).role ?? "APPRENANT"}
                    formationsRole={(session.user as { formationsRole?: string }).formationsRole}
                  />
                ) : (
                  <>
                    <Link href="/connexion" className="nk-btn nk-btn--glass nk-btn--login">
                      Connexion
                    </Link>
                    <Link href="/inscription" className="nk-btn nk-btn--primary nk-btn--cta">
                      Créer ma boutique
                      <span className="nk-btn__ico"><NavIcon name="arrow_forward" /></span>
                    </Link>
                  </>
                )}

                {/* Hamburger → X */}
                <button
                  ref={burgerRef}
                  type="button"
                  className="nk-burger lg:hidden"
                  aria-expanded={mobileOpen}
                  aria-controls="nk-mobile-menu"
                  aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  <span className="nk-burger__bar" aria-hidden="true" />
                  <span className="nk-burger__bar" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} isLoggedIn={isLoggedIn} pathname={pathname} />
      </header>
    </>
  );
}

/** Méga-menu « Fonctionnalités » : 4 catégories en 2 × 2 + colonne de mise en avant. */
function FeaturesPanel({ close }: { close: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_232px]">
      <div className="col-span-2 grid grid-cols-2 gap-x-2 gap-y-5 p-4">
        {FEATURE_CATEGORIES.map((cat, c) => (
          <div key={cat.title}>
            {/* Vague diagonale : l'indice de cascade = colonne + ligne. */}
            <p className="nk-panel__title nk-panel__stagger" style={{ "--i": c } as StyleVars}>{cat.title}</p>
            <ul className="space-y-0.5">
              {cat.items.map((item, j) => (
                <li key={item.label} className="nk-panel__stagger" style={{ "--i": c + j + 1 } as StyleVars}>
                  <Link href={item.href} onClick={close} className="nk-panel__item">
                    <span className="nk-panel__ico"><NavIcon name={item.icon} /></span>
                    <span className="min-w-0">
                      <span className="nk-panel__label">{item.label}</span>
                      <span className="nk-panel__desc">{item.desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <aside className="nk-panel__aside" aria-label="À la une">
        {FEATURE_HIGHLIGHTS.map((h, k) => (
          <Link
            key={h.href + h.eyebrow}
            href={h.href}
            onClick={close}
            className={`nk-panel__hl nk-panel__hl--${h.tone} nk-panel__stagger`}
            style={{ "--i": 1 + k * 2 } as StyleVars}
          >
            <span className="nk-panel__eyebrow">{h.eyebrow}</span>
            <span className="nk-panel__hl-title">{h.title}</span>
            <span className="nk-panel__hl-desc">{h.desc}</span>
            <span className="nk-panel__hl-cta">{h.cta}<NavIcon name="arrow_forward" /></span>
          </Link>
        ))}
      </aside>

      <div className="nk-panel__foot nk-panel__stagger col-span-3" style={{ "--i": 5 } as StyleVars}>
        <p>10 % de commission · Zéro abonnement</p>
        <Link href="/fonctionnalites" onClick={close} className="nk-panel__more">
          Voir toutes les fonctionnalités <NavIcon name="arrow_forward" />
        </Link>
      </div>
    </div>
  );
}

/** Menu « Ressources » : Académie + Blog. */
function ResourcesPanel({ close }: { close: () => void }) {
  return (
    <ul className="p-1.5">
      {RESOURCE_LINKS.map((it, i) => (
        <li key={it.href} className="nk-panel__stagger" style={{ "--i": i } as StyleVars}>
          <Link href={it.href} onClick={close} className="nk-panel__item">
            <span className="nk-panel__ico"><NavIcon name={it.icon} /></span>
            <span className="min-w-0">
              <span className="nk-panel__label">{it.label}</span>
              <span className="nk-panel__desc">{it.desc}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
