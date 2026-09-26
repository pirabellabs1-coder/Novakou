"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useDeviseAffichage } from "@/components/formations/SelecteurDevise";
import { formaterPrix } from "@/lib/currency/rates";
import { shopFontStack } from "@/lib/formations/shop-fonts";
import AISupportWidget from "@/components/formations/AISupportWidget";
import SmartPopupRenderer from "@/components/marketing/SmartPopupRenderer";
import { ShopHeader } from "./ShopHeader";
import ShopFooter from "./ShopFooter";
import { accentVars } from "./boutique/accent";
import { ShopHero, type ShopStats } from "./boutique/ShopHero";
import { ShopCard } from "./boutique/ShopCard";
import { ShopAbout, ShopReviews } from "./boutique/ShopSections";
import { ShopEmpty, ShopNoResults } from "./boutique/ShopEmpty";
import { observerReveals } from "./boutique/reveal";
import { useCollant } from "./boutique/use-collant";
import { estGratuit, type ShopItem, type ShopOwner, type ShopReview, type ShopSocials } from "./boutique/types";
import "./boutique/boutique.css";

type Filtre = "all" | "formation" | "product" | "bundle" | "subscription" | "free";
type Tri = "popular" | "price-asc" | "price-desc" | "rating";

const HAUTEUR_MENU = 64;

// Les prix sont STOCKÉS en FCFA et le vendeur touche ce montant-là. La devise
// n'est qu'une aide à la lecture : un visiteur guinéen qui lit « 5 000 FCFA »
// ne sait pas ce que ça lui coûte, et il repart.

/**
 * Vitrine publique d'une boutique : île de menu, hero, barre de recherche et
 * catégories, catalogue en cartes, à propos, avis, pied de boutique.
 * Servie sur /boutique/<slug>, l'adresse courte /<slug>, un sous-domaine et
 * un domaine personnalisé (liens relatifs préfixés par `staticBase`).
 */
export default function BoutiqueView({
  owner,
  formations,
  products,
  bundles = [],
  subscriptionPlans = [],
  instructeurId,
  shopSlug,
  font,
  afficherVentes = false,
  socials,
  reviews = [],
  memberSince,
  verified = false,
}: {
  owner: ShopOwner;
  formations: ShopItem[];
  products: ShopItem[];
  bundles?: ShopItem[];
  subscriptionPlans?: ShopItem[];
  instructeurId?: string;
  shopSlug?: string;
  font?: string | null;
  /**
   * Nombre de ventes visible sur les cartes. FAUX par défaut : « 0 vente »
   * sous un produit décourage l'achat bien plus qu'un chiffre élevé ne le
   * motive. Le vendeur l'active depuis les paramètres de sa boutique.
   */
  afficherVentes?: boolean;
  socials?: ShopSocials;
  reviews?: ShopReview[];
  /** Date de création de la boutique (ISO) → « Membre depuis ». */
  memberSince?: string | null;
  /** Identité du vendeur vérifiée (KYC ≥ 2). */
  verified?: boolean;
}) {
  const deviseAffichage = useDeviseAffichage();
  const fmtPrix = (n: number) => formaterPrix(n, deviseAffichage);
  const all = useMemo(
    () => [...formations, ...products, ...bundles, ...subscriptionPlans],
    [formations, products, bundles, subscriptionPlans],
  );

  // Préfixe des pages boutique auto-générées : "" sur domaine perso (la vue
  // by-domain n'envoie pas shopSlug), "/{slug}" sur la plateforme.
  const staticBase = shopSlug ? `/${shopSlug}` : "";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filtre>("all");
  const [sort, setSort] = useState<Tri>("popular");

  const filtered = useMemo(() => {
    let list = all;
    if (filter === "free") list = list.filter(estGratuit);
    else if (filter !== "all") list = list.filter((i) => i.kind === filter);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) => i.title.toLowerCase().includes(q));

    return [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.count - a.count; // populaires : plus vendus / plus suivis
    });
  }, [all, query, filter, sort]);

  const hasAny = all.length > 0;

  const stats: ShopStats = useMemo(() => {
    const avis = all.reduce((s, i) => s + (i.reviewsCount ?? 0), 0);
    const somme = all.reduce((s, i) => s + i.rating * (i.reviewsCount ?? 0), 0);
    return {
      produits: all.length,
      clients: all.reduce((s, i) => s + i.count, 0),
      avis,
      note: avis > 0 ? somme / avis : 0,
    };
  }, [all]);

  const chips = (
    [
      { k: "all", label: "Tout", count: all.length },
      { k: "formation", label: "Formations", count: formations.length },
      { k: "product", label: "Produits", count: products.length },
      { k: "bundle", label: "Packs", count: bundles.length },
      { k: "subscription", label: "Abonnements", count: subscriptionPlans.length },
      { k: "free", label: "Gratuits", count: all.filter(estGratuit).length },
    ] as const
  ).filter((c) => c.k === "all" || c.count > 0);
  const filtreLabel = filter === "all" ? "" : (chips.find((c) => c.k === filter)?.label ?? "").toLowerCase();

  // Révélations en cascade ; relancées après un filtrage pour les nouvelles
  // cartes (forcées), sans rejouer celles déjà en place.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const premierPassage = useRef(true);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const forcer = !premierPassage.current;
    premierPassage.current = false;
    return observerReveals(root, forcer);
  }, [filtered]);

  const { temoinRef, barreRef, colle, hauteur } = useCollant<HTMLDivElement>(HAUTEUR_MENU);

  // « Inter » n'est pas embarquée : on laisse la police du site (Manrope).
  const police = font && font !== "Inter" ? shopFontStack(font) : undefined;

  return (
    <div
      ref={rootRef}
      className="nkb nkb-page"
      style={{ ...accentVars(owner.themeColor), ...(police ? { fontFamily: police } : {}) }}
    >
      {/* Widget IA Support Client (si vendeur actif) */}
      {(instructeurId || shopSlug) && (
        <AISupportWidget
          instructeurId={instructeurId}
          shopSlug={shopSlug}
          pageContext={`Le visiteur est sur la boutique "${owner.name}" — ${all.length} produit(s) dans le catalogue.`}
        />
      )}

      {/* Popups intelligents (exit-intent / scroll / timer) */}
      <SmartPopupRenderer />

      <ShopHeader shopName={owner.name} logoUrl={owner.image} themeColor={owner.themeColor} staticBase={staticBase} />

      <ShopHero
        owner={owner}
        staticBase={staticBase}
        stats={stats}
        afficherVentes={afficherVentes}
        verified={verified}
        socials={socials}
        memberSince={memberSince}
        hasAny={hasAny}
      />

      {/* ─── Barre collante : recherche + catégories + tri ─────────────────── */}
      {hasAny && (
        <>
          <div ref={temoinRef} aria-hidden="true" />
          <div className="nkb-toolbar__slot" style={colle ? { minHeight: hauteur } : undefined}>
            <div ref={barreRef} className="nkb-toolbar" data-colle={colle ? "" : undefined}>
              <div className="nkb-toolbar__inner">
                <div className="nkb-search">
                  <Search strokeWidth={1.75} aria-hidden="true" />
                  <label htmlFor="nkb-recherche" className="nkb-sr">
                    Rechercher dans la boutique
                  </label>
                  <input
                    id="nkb-recherche"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un produit, une formation…"
                    autoComplete="off"
                  />
                </div>

                <ul className="nkb-chips" aria-label="Catégories">
                  {chips.map((c) => (
                    <li key={c.k}>
                      <button type="button" className="nkb-chip" aria-pressed={filter === c.k} onClick={() => setFilter(c.k)}>
                        {c.label}
                        <span className="nkb-chip__n">{c.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="nkb-sort">
                  <label htmlFor="nkb-tri" className="nkb-sr">
                    Trier
                  </label>
                  <select id="nkb-tri" className="nkb-select" value={sort} onChange={(e) => setSort(e.target.value as Tri)}>
                    <option value="popular">Populaires</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="rating">Mieux notés</option>
                  </select>
                  <ChevronDown strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Catalogue ────────────────────────────────────────────────────── */}
      <section id="catalogue" className="nkb-catalogue" aria-labelledby="nkb-catalogue-titre">
        <div className="nkb-wrap">
          <h2 id="nkb-catalogue-titre" className="nkb-sr">
            Catalogue
          </h2>
          {!hasAny ? (
            <ShopEmpty shopName={owner.name} />
          ) : filtered.length === 0 ? (
            <ShopNoResults
              query={query.trim()}
              filtre={filtreLabel}
              onReset={() => {
                setQuery("");
                setFilter("all");
              }}
            />
          ) : (
            <>
              <div className="nkb-catalogue__head">
                <p className="nkb-count" role="status" aria-live="polite">
                  <strong>{filtered.length}</strong> résultat{filtered.length > 1 ? "s" : ""}
                  {query.trim() && (
                    <>
                      {" "}pour « <strong>{query.trim()}</strong> »
                    </>
                  )}
                </p>
              </div>
              <div className="nkb-grid">
                {filtered.map((item) => (
                  <ShopCard key={`${item.kind}-${item.id}`} item={item} fmtPrix={fmtPrix} afficherVentes={afficherVentes} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <ShopAbout owner={owner} staticBase={staticBase} socials={socials} />
      <ShopReviews reviews={reviews} stats={stats} />

      <ShopFooter
        shopSlug={shopSlug ?? ""}
        shopName={owner.name}
        base={staticBase}
        themeColor={owner.themeColor}
        logoUrl={owner.image}
        domain={owner.domain}
        socials={socials}
        description={owner.bio}
      />
    </div>
  );
}
