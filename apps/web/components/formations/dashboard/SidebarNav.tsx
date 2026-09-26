"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

export type ShellNavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Pastille texte (« IA », « Pro »). */
  tag?: { label: string; tone: "green" | "amber" };
  /** Compteur affiché s'il est > 0 ; prime sur la pastille texte. */
  count?: number;
  countTone?: "rose" | "amber" | "green";
  /** Complément lu par les lecteurs d'écran après le nombre (« à traiter »). */
  countLabel?: string;
};

export type ShellNavSection = {
  label?: string;
  items: ShellNavItem[];
};

/**
 * Lien courant : la correspondance la plus longue. Sans ça, « Paramètres »
 * et « Équipe » (/vendeur/parametres/equipe) s'allumeraient tous les deux et
 * la pilule ne saurait pas où aller.
 */
export function activeHref(pathname: string, sections: ShellNavSection[]): string | null {
  let meilleur: string | null = null;
  for (const s of sections) {
    for (const it of s.items) {
      if (pathname === it.href || pathname.startsWith(it.href + "/")) {
        if (!meilleur || it.href.length > meilleur.length) meilleur = it.href;
      }
    }
  }
  return meilleur;
}

export function SidebarNav({
  sections,
  current,
  onNavigate,
  rail = false,
  ariaLabel,
}: {
  sections: ShellNavSection[];
  current: string | null;
  onNavigate?: () => void;
  /** Icônes seules : le libellé passe en tooltip. */
  rail?: boolean;
  ariaLabel: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const premierRendu = useRef(true);

  // La pilule est le SEUL élément animé : on mesure le lien courant et on
  // la déplace en transform. ResizeObserver couvre le repli, les polices
  // et les compteurs qui apparaissent — aucune lecture dans une boucle.
  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    const nav = navRef.current;
    if (!list || !pill || !nav) return;

    const mesurer = () => {
      const lien = list.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!lien) {
        pill.removeAttribute("data-on");
        return;
      }
      pill.style.transform = `translateY(${lien.offsetTop}px)`;
      pill.style.height = `${lien.offsetHeight}px`;
      pill.setAttribute("data-on", "");
      if (premierRendu.current) {
        premierRendu.current = false;
        // Menu long (vendeur : 28 entrées) : la page courante est amenée à
        // mi-hauteur, sans faire défiler la page elle-même.
        nav.scrollTop = Math.max(0, lien.offsetTop - nav.clientHeight / 2 + lien.offsetHeight / 2);
      }
    };

    mesurer();
    // Première mesure sans glissement : la pilule apparaît déjà en place.
    const raf = requestAnimationFrame(() => list.setAttribute("data-ready", ""));
    const ro = new ResizeObserver(mesurer);
    ro.observe(list);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [current, rail]);

  return (
    <nav ref={navRef} className="nkd__nav" aria-label={ariaLabel}>
      <div ref={listRef} className="nkd__list">
        <span ref={pillRef} className="nkd__pill" aria-hidden="true" />
        {sections.map((section, i) => (
          <div key={section.label ?? i} className="nkd__group">
            {section.label && <p className="nkd__head">{section.label}</p>}
            <ul>
              {section.items.map((item) => {
                const Icon = item.icon;
                const courant = item.href === current;
                const compte = item.count ?? 0;
                const avecCompte = compte > 0;
                const tonPoint = avecCompte ? (item.countTone ?? "rose") : item.tag?.tone;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={courant ? "page" : undefined}
                      title={rail ? item.label : undefined}
                      className="nkd__link"
                    >
                      <Icon size={18} strokeWidth={courant ? 2.2 : 1.9} aria-hidden="true" />
                      <span className="nkd__label">{item.label}</span>
                      {avecCompte ? (
                        <span className={`nkd__count nkd__count--${item.countTone ?? "rose"}`}>
                          {compte > 99 ? "99+" : compte}
                          {item.countLabel && <span className="sr-only"> {item.countLabel}</span>}
                        </span>
                      ) : item.tag ? (
                        <span className={`nkd__tag nkd__tag--${item.tag.tone}`}>{item.tag.label}</span>
                      ) : null}
                      {tonPoint && <span className={`nkd__dot nkd__dot--${tonPoint}`} aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
