"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Barre de navigation d'une BOUTIQUE vendeur.
 *
 * Extraite de BoutiqueView pour être réutilisée sur les fiches produit et
 * formation : un acheteur venu d'une boutique doit rester dans l'univers de
 * cette boutique, et ne jamais retomber sur le menu général de la plateforme
 * (Explorer, Marketplace, Tarifs…) qui l'enverrait vers la concurrence.
 *
 * Cohérent avec la règle d'anonymat : on n'affiche que l'identité de la
 * BOUTIQUE (nom + logo), jamais celle de la personne derrière.
 */
export function ShopHeader({
  shopName,
  logoUrl,
  themeColor = "#006e2f",
  /** Préfixe des liens de la boutique : "" sur domaine perso, "/boutique/slug" sinon. */
  staticBase = "",
}: {
  shopName: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  staticBase?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const color = themeColor || "#006e2f";
  const home = staticBase || "/";

  const links = [
    { href: home, label: "Produits", icon: "storefront" },
    { href: `${staticBase}/a-propos`, label: "À propos", icon: "info" },
    { href: `${staticBase}/contact`, label: "Contact", icon: "mail" },
    { href: "/apprenant/mes-produits", label: "Mes achats", icon: "shopping_bag" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between gap-4">
        <a href={home} className="flex items-center gap-2.5 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={shopName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 flex-shrink-0"
              unoptimized
            />
          ) : (
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0"
              style={{ background: color }}
            >
              {shopName[0]?.toUpperCase() ?? "N"}
            </span>
          )}
          <span className="font-extrabold text-slate-900 truncate text-sm md:text-base">{shopName}</span>
        </a>

        <div className="hidden sm:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <a href={home} className="hover:text-slate-900 transition-colors">Produits</a>
          <a href={`${staticBase}/a-propos`} className="hover:text-slate-900 transition-colors">À propos</a>
          <a href={`${staticBase}/contact`} className="hover:text-slate-900 transition-colors">Contact</a>
          <a href="https://novakou.com" className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-[17px]">storefront</span>
            Novakou
          </a>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="/apprenant/mes-produits"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors flex-shrink-0 px-2 py-1"
          >
            <span className="material-symbols-outlined text-[19px]">shopping_bag</span>
            <span className="hidden md:inline">Mes achats</span>
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-5 py-2 flex flex-col">
            {[...links, { href: "https://novakou.com", label: "Retour à Novakou", icon: "home" }].map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color }}>{l.icon}</span>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
