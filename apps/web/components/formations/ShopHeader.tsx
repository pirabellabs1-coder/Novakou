"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { SelecteurDevise } from "@/components/formations/SelecteurDevise";
import { useScrolled } from "@/components/formations/nav/use-scrolled";
import { accentVars } from "./boutique/accent";
import { ShopCartButton } from "./boutique/ShopCartButton";
import { ShopMobileMenu, type ShopNavLink } from "./boutique/ShopMobileMenu";
import "./boutique/boutique.css";

/**
 * Barre de navigation d'une BOUTIQUE vendeur : île en verre aux couleurs du
 * vendeur, même famille que le menu public — en plus sobre.
 *
 * Réutilisée sur les fiches produit et formation : un acheteur venu d'une
 * boutique doit rester dans l'univers de cette boutique, et ne jamais
 * retomber sur le menu général de la plateforme (Explorer, Marketplace,
 * Tarifs…) qui l'enverrait vers la concurrence.
 *
 * Cohérent avec la règle d'anonymat : on n'affiche que l'identité de la
 * BOUTIQUE (nom + logo), jamais celle de la personne derrière.
 *
 * `fixed` et non `sticky` : les adresses courtes sont rendues sous un <main>
 * en `overflow-x: hidden` qui neutralise sticky (le menu partait avec la
 * page). Un espace réservé garde la hauteur dans le flux.
 */
export function ShopHeader({
  shopName,
  logoUrl,
  themeColor = "#006e2f",
  /** Préfixe des liens de la boutique : "" sur domaine perso, "/slug" sinon. */
  staticBase = "",
}: {
  shopName: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  staticBase?: string;
}) {
  const pathname = usePathname() || "/";
  const home = staticBase || "/";
  const { scrolled, sentinelRef, sentinelStyle } = useScrolled(24);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  // Fermeture à la navigation (les liens ferment déjà au clic ; ceci couvre
  // le retour arrière et les redirections).
  useEffect(() => setOpen(false), [pathname]);

  // Page courante : l'accueil répond à l'adresse courte, à la racine d'un
  // domaine perso et à l'ancienne adresse /boutique/<slug>.
  const chemin = pathname.replace(/\/+$/, "") || "/";
  const accueil = home.replace(/\/+$/, "") || "/";
  const links: ShopNavLink[] = [
    { href: home, label: "Produits", current: chemin === accueil || chemin === `/boutique${staticBase}` },
    { href: `${staticBase}/a-propos`, label: "À propos", current: chemin.endsWith("/a-propos") },
    { href: `${staticBase}/contact`, label: "Contact", current: chemin.endsWith("/contact") },
  ];

  /**
   * Menu mobile ouvert : Échap referme et rend le focus au hamburger ; Tab
   * boucle entre les contrôles visibles du header (hamburger inclus), pour
   * ne pas envoyer le clavier sous le voile.
   */
  function onHeaderKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      burgerRef.current?.focus();
      return;
    }
    if (e.key !== "Tab" || !headerRef.current) return;
    const nodes = Array.from(headerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
      (el) => el.getClientRects().length > 0,
    );
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
      {/* Témoin de défilement observé par IntersectionObserver (aucun écouteur scroll). */}
      <span
        ref={sentinelRef}
        aria-hidden="true"
        style={{ ...sentinelStyle, position: "absolute", top: 0, left: 0, width: 1, pointerEvents: "none" }}
      />
      <div className="nkb-nav__spacer" aria-hidden="true" />

      <header
        ref={headerRef}
        className="nkb nkb-nav"
        style={accentVars(themeColor)}
        data-scrolled={scrolled ? "" : undefined}
        onKeyDown={onHeaderKeyDown}
      >
        <div className="nkb-nav__inner">
          <div className="nkb-nav__island">
            <span className="nkb-nav__glass" aria-hidden="true" />
            <span className="nkb-nav__glass-dense" aria-hidden="true" />

            <a href={home} className="nkb-nav__logo" aria-label={`${shopName} — accueil de la boutique`}>
              {logoUrl ? (
                <span className="nkb-nav__mark">
                  <Image src={logoUrl} alt="" width={36} height={36} unoptimized />
                </span>
              ) : (
                <span className="nkb-nav__mark nkb-nav__mark--initial" aria-hidden="true">
                  {shopName.trim().charAt(0).toUpperCase() || "N"}
                </span>
              )}
              <span className="nkb-nav__name">{shopName}</span>
            </a>

            <nav aria-label="Menu de la boutique" className="nkb-nav__links">
              <ul>
                {links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="nkb-nav__link" aria-current={l.current ? "page" : undefined}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="nkb-nav__actions">
              {/* Le pays se choisit avant l'achat, pas au moment de payer : un prix
                  lisible dans sa propre devise est ce qui décide un visiteur. */}
              <div className="nkb-nav__devise">
                <SelecteurDevise />
              </div>
              <ShopCartButton />
              <Link href="/apprenant/mes-produits" className="nkb-btn nkb-btn--glass nkb-btn--achats">
                <ShoppingBag strokeWidth={1.75} aria-hidden="true" />
                Mes achats
              </Link>
              <a href={`${home}#catalogue`} className="nkb-btn nkb-btn--primary nkb-btn--cta">
                Voir les produits
                <span className="nkb-btn__ico" aria-hidden="true">
                  <ArrowRight strokeWidth={2.2} />
                </span>
              </a>
              <button
                ref={burgerRef}
                type="button"
                className="nkb-burger"
                aria-expanded={open}
                aria-controls="nkb-mobile-menu"
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setOpen((o) => !o)}
              >
                <span className="nkb-burger__bar" aria-hidden="true" />
                <span className="nkb-burger__bar" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <ShopMobileMenu open={open} onClose={() => setOpen(false)} links={links} home={home} />
      </header>
    </>
  );
}
