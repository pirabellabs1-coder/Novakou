"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Menu, PanelLeft, PanelLeftClose, Search, X } from "lucide-react";
import { usePresence } from "@/components/formations/nav/use-presence";
import { SidebarNav, activeHref, type ShellNavSection } from "./SidebarNav";
import { useRouteTransition } from "./use-route-transition";
import "./dashboard.css";

export type ShellSpace = "vendeur" | "apprenant" | "affilie" | "admin";

export type DashboardShellProps = {
  space: ShellSpace;
  /** Nom de l'espace sous la marque (« Espace vendeur »). */
  spaceLabel: string;
  /** Destination de la marque. */
  homeHref: string;
  sections: ShellNavSection[];
  /**
   * Repli sur ordinateur : « rail » (icônes seules) ou « hidden » (menu
   * masqué pour élargir les tableaux). L'état et sa persistance restent
   * dans le layout de l'espace.
   */
  collapse?: { mode: "rail" | "hidden"; collapsed: boolean; onToggle: () => void };
  search?: { placeholder: string; label: string };
  /** Gauche de la barre supérieure (sélecteur de boutique, pastille Admin…). */
  topStart?: ReactNode;
  /** Droite de la barre supérieure (cloche, panier, utilisateur…). */
  topEnd?: ReactNode;
  /** Carte de statut en bas de la barre latérale. */
  sidebarCard?: ReactNode;
  /** Actions basses (aide, déconnexion…). */
  sidebarFoot?: ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
};

const FOCUSABLES = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function DashboardShell({
  space,
  spaceLabel,
  homeHref,
  sections,
  collapse,
  search,
  topStart,
  topEnd,
  sidebarCard,
  sidebarFoot,
  footer,
  className = "",
  style,
  children,
}: DashboardShellProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const phase = usePresence(open, 200);
  const asideRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const asideId = useId();
  const pageRef = useRouteTransition<HTMLDivElement>(pathname);

  const fermer = useCallback(() => setOpen(false), []);

  // Fermeture à la navigation : couvre le retour arrière et les redirections
  // (les liens ferment déjà au clic).
  useEffect(() => setOpen(false), [pathname]);

  // Le tiroir n'existe que sous lg : s'il est ouvert quand la fenêtre
  // s'élargit, on le ferme pour libérer le verrou du body.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const h = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Tiroir ouvert : body verrouillé, Échap referme, focus sur « Fermer » ;
  // à la fermeture le focus revient au hamburger s'il était dans le tiroir.
  useEffect(() => {
    if (!open) {
      if (asideRef.current?.contains(document.activeElement)) burgerRef.current?.focus();
      return;
    }
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = precedent;
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [open]);

  /** Tab boucle dans le tiroir ouvert : le clavier ne passe pas sous le voile. */
  function onAsideKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (!open || e.key !== "Tab" || !asideRef.current) return;
    const nodes = Array.from(asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLES)).filter(
      (el) => el.getClientRects().length > 0,
    );
    if (!nodes.length) return;
    const premier = nodes[0];
    const dernier = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === premier) {
      e.preventDefault();
      dernier.focus();
    } else if (!e.shiftKey && document.activeElement === dernier) {
      e.preventDefault();
      premier.focus();
    }
  }

  // Fil d'Ariane dérivé des liens : section › page. Hors menu (profil,
  // notifications…), le nom de l'espace tient lieu de titre.
  const current = activeHref(pathname, sections);
  let crumbSection: string | undefined;
  let crumbPage = spaceLabel;
  if (current) {
    for (const s of sections) {
      const it = s.items.find((i) => i.href === current);
      if (it) {
        crumbSection = s.label;
        crumbPage = it.label;
        break;
      }
    }
  }

  const rail = collapse?.mode === "rail" && collapse.collapsed;
  const collapsedAttr = collapse?.collapsed ? collapse.mode : undefined;

  return (
    <div
      className={`nkd ${className}`}
      data-space={space}
      data-drawer={open ? "open" : undefined}
      data-collapsed={collapsedAttr}
      style={style}
    >
      <div className="nkd__grid">
        <aside
          id={asideId}
          ref={asideRef}
          className="nkd__side"
          aria-label="Barre latérale"
          onKeyDown={onAsideKeyDown}
        >
          <div className="nkd__brand">
            <Link href={homeHref} className="nkd__brand-link" aria-label={`Novakou — ${spaceLabel}`}>
              <ShellMark />
              <span className="nkd__brand-text">
                <span className="nkd__brand-name">Novakou</span>
                <span className="nkd__brand-space">{spaceLabel}</span>
              </span>
            </Link>
            <button
              ref={closeRef}
              type="button"
              className="nkd__ibtn nkd__close"
              onClick={fermer}
              aria-label="Fermer le menu"
            >
              <X aria-hidden="true" />
            </button>
          </div>

          <SidebarNav
            sections={sections}
            current={current}
            onNavigate={fermer}
            rail={rail}
            ariaLabel={`Menu ${spaceLabel}`}
          />

          {(sidebarCard || sidebarFoot) && (
            <div className="nkd__foot">
              {sidebarCard}
              {sidebarFoot}
            </div>
          )}
        </aside>

        <div className="nkd__main">
          <header className="nkd__top">
            <button
              ref={burgerRef}
              type="button"
              className="nkd__ibtn nkd__burger"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              aria-controls={asideId}
            >
              <Menu aria-hidden="true" />
            </button>

            {collapse && (
              <button
                type="button"
                className="nkd__ibtn nkd__fold"
                onClick={collapse.onToggle}
                aria-label={collapse.collapsed ? "Étendre le menu" : "Réduire le menu"}
                aria-expanded={!collapse.collapsed}
                aria-controls={asideId}
                title={collapse.collapsed ? "Étendre le menu" : "Réduire le menu"}
              >
                {collapse.collapsed ? <PanelLeft aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
              </button>
            )}

            {/* Visible sous lg et quand le menu est masqué (CSS) : la marque
                reste toujours quelque part. */}
            <Link href={homeHref} className="nkd__top-brand" aria-label={`Novakou — ${spaceLabel}`}>
              <ShellMark />
            </Link>

            <div className="nkd__start">{topStart}</div>

            <nav className="nkd__crumbs" aria-label="Fil d'Ariane">
              <ol>
                {crumbSection && (
                  <li className="nkd__crumb">
                    <span>{crumbSection}</span>
                    <ChevronRight aria-hidden="true" />
                  </li>
                )}
                <li className="nkd__crumb--current" aria-current="page">
                  {crumbPage}
                </li>
              </ol>
            </nav>

            {search ? (
              <div className="nkd__search">
                <Search aria-hidden="true" />
                <input type="search" placeholder={search.placeholder} aria-label={search.label} />
              </div>
            ) : (
              <div className="nkd__spacer" />
            )}

            <div className="nkd__end">{topEnd}</div>
          </header>

          <div ref={pageRef} className="nkd__page">
            {children}
          </div>

          {footer}
        </div>
      </div>

      {phase !== "closed" && <div className="nkd__veil" data-phase={phase} onClick={fermer} aria-hidden="true" />}
    </div>
  );
}

/* ───────────────────────── Briques partagées ─────────────────────────── */

/** Monogramme Novakou (même tracé que l'île publique) ; couleur via --nkd-mark. */
export function ShellMark() {
  return (
    <svg className="nkd__mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="36" height="36" rx="10" fill="currentColor" />
      <path d="M11 26V10h3l7 10.5V10h3v16h-3L14 15.5V26h-3z" fill="white" />
    </svg>
  );
}

export function initiales(name: string | null | undefined, repli: string): string {
  if (!name) return repli;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ShellAvatar({
  src,
  initials,
  large = false,
}: {
  src?: string | null;
  initials: string;
  large?: boolean;
}) {
  return (
    <span className={`nkd__avatar${large ? " nkd__avatar--lg" : ""}`} aria-hidden="true">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        initials
      )}
    </span>
  );
}

/** Pastille utilisateur de la barre supérieure : lien si `href`, sinon statique. */
export function ShellUserChip({
  href,
  name,
  subtitle,
  src,
  initials,
  chevron = false,
}: {
  href?: string;
  name: string;
  subtitle?: string;
  src?: string | null;
  initials: string;
  chevron?: boolean;
}) {
  const inner = (
    <>
      <ShellAvatar src={src} initials={initials} />
      <span className="nkd__user-text">
        <span className="nkd__user-name">{name}</span>
        {subtitle && <span className="nkd__user-role">{subtitle}</span>}
      </span>
      {chevron && <ChevronDown className="nkd__user-chev" aria-hidden="true" />}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="nkd__user" aria-label={subtitle ? `${name} — ${subtitle}` : name}>
        {inner}
      </Link>
    );
  }
  return (
    <div className="nkd__user">
      {inner}
      <span className="sr-only">{name}</span>
    </div>
  );
}

/** Carte de statut (identité + état) pour le bas de la barre latérale. */
export function ShellStatusCard({
  title,
  status,
  src,
  initials,
}: {
  title: string;
  status: string;
  src?: string | null;
  initials: string;
}) {
  return (
    <div className="nkd__card">
      <div className="nkd__card-core">
        <ShellAvatar src={src} initials={initials} large />
        <div className="nkd__card-text">
          <p className="nkd__card-title">{title}</p>
          <p className="nkd__card-sub">
            <span className="nkd__live" aria-hidden="true" />
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
