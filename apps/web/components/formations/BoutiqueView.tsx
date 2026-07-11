"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { shopFontStack } from "@/lib/formations/shop-fonts";
import AISupportWidget from "@/components/formations/AISupportWidget";
import SmartPopupRenderer from "@/components/marketing/SmartPopupRenderer";

interface Item {
  kind: "formation" | "product" | "bundle" | "subscription";
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  isFree: boolean;
  rating: number;
  count: number;          // apprenants / ventes / acheteurs / abonnés
  reviewsCount?: number;
  // Bundle-specific
  originalPrice?: number | null;
  itemsCount?: number;
  // Subscription-specific
  interval?: "monthly" | "yearly";
  trialDays?: number | null;
  description?: string;
}

interface Owner {
  name: string;
  email: string | null;
  image: string | null;
  coverUrl?: string | null;
  bio: string | null;
  kind: "vendor" | "mentor";
  domain: string | null;
  themeColor?: string | null;
}

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function BoutiqueView({
  owner,
  formations,
  products,
  bundles = [],
  subscriptionPlans = [],
  instructeurId,
  shopSlug,
  font,
}: {
  owner: Owner;
  formations: Item[];
  products: Item[];
  bundles?: Item[];
  subscriptionPlans?: Item[];
  instructeurId?: string;
  shopSlug?: string;
  font?: string | null;
}) {
  const all = useMemo(
    () => [...formations, ...products, ...bundles, ...subscriptionPlans],
    [formations, products, bundles, subscriptionPlans],
  );

  // Préfixe des pages boutique auto-générées : "" sur domaine perso (la vue
  // by-domain n'envoie pas shopSlug), "/boutique/{slug}" sur la plateforme.
  const staticBase = shopSlug ? `/boutique/${shopSlug}` : "";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "formation" | "product" | "bundle" | "subscription" | "free">("all");
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc" | "rating">("popular");

  const filtered = useMemo(() => {
    let list = all;
    if (filter === "formation") list = list.filter((i) => i.kind === "formation");
    else if (filter === "product") list = list.filter((i) => i.kind === "product");
    else if (filter === "bundle") list = list.filter((i) => i.kind === "bundle");
    else if (filter === "subscription") list = list.filter((i) => i.kind === "subscription");
    else if (filter === "free") list = list.filter((i) => i.isFree || i.price === 0);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) => i.title.toLowerCase().includes(q));

    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.count - a.count; // popular (most sold / enrolled)
    });
    return list;
  }, [all, query, filter, sort]);

  const hasAny = all.length > 0;
  const themeColor = owner.themeColor || "#006e2f";
  const themeGradient = `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`;

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: font ? shopFontStack(font) : "var(--font-inter), Inter, sans-serif" }}
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

      {/* ─── Barre de navigation de la boutique ───────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between gap-4">
          <a href={staticBase || "/"} className="flex items-center gap-2.5 min-w-0">
            {owner.image ? (
              <Image src={owner.image} alt={owner.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" unoptimized />
            ) : (
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0" style={{ background: themeColor }}>
                {owner.name[0]?.toUpperCase() ?? "N"}
              </span>
            )}
            <span className="font-extrabold text-slate-900 truncate text-sm md:text-base">{owner.name}</span>
          </a>
          <div className="hidden sm:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href={staticBase || "/"} className="hover:text-slate-900 transition-colors" style={{ ["--nk-h" as string]: themeColor }}>Produits</a>
            <a href={`${staticBase}/a-propos`} className="hover:text-slate-900 transition-colors">À propos</a>
            <a href={`${staticBase}/contact`} className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <a href="/apprenant/mes-produits" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[19px]">shopping_bag</span>
            <span className="hidden xs:inline">Mes achats</span>
          </a>
        </div>
      </nav>

      {/* ─── Hero (cover-like) ────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        {owner.coverUrl ? (
          <>
            {/* Photo de couverture du vendeur */}
            <Image
              src={owner.coverUrl}
              alt={`Couverture de ${owner.name}`}
              fill
              priority
              unoptimized
              className="object-cover"
            />
            {/* Voile sombre pour lisibilité du texte par dessus */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40" />
          </>
        ) : (
          <>
            {/* Backdrop premium : mesh gradient subtil + halos diffus.
                Refonte 2026-05-26 — version "joli a voir". */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(at 12% 15%, ${themeColor}1f 0px, transparent 50%), radial-gradient(at 82% 0%, ${themeColor}26 0px, transparent 45%), radial-gradient(at 50% 100%, ${themeColor}14 0px, transparent 55%), linear-gradient(180deg, #ffffff, #f8fafc)`,
              }}
            />
            {/* Grille décorative très discrète */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            {/* Halos lumineux */}
            <div
              aria-hidden
              className="absolute -top-40 -right-24 w-[480px] h-[480px] rounded-full blur-3xl opacity-25"
              style={{ background: themeColor }}
            />
            <div
              aria-hidden
              className="absolute -bottom-40 -left-16 w-[360px] h-[360px] rounded-full blur-3xl opacity-15"
              style={{ background: themeColor }}
            />
          </>
        )}

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            <div className="flex items-center gap-4 md:gap-5">
              {/* Wrap avec un anneau dégradé pour effet "premium" */}
              <div
                className="relative rounded-[1.25rem] p-[3px] flex-shrink-0 shadow-2xl"
                style={{ background: `conic-gradient(from 180deg at 50% 50%, ${themeColor}, #22c55e, ${themeColor})` }}
              >
                {owner.image ? (
                  <Image
                    src={owner.image}
                    alt={owner.name}
                    width={112}
                    height={112}
                    className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover bg-white"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl md:text-5xl"
                    style={{ background: themeGradient }}
                  >
                    {owner.name[0]?.toUpperCase() ?? "N"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {owner.name}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Propulsé par <span className="font-semibold text-emerald-700">Novakou</span>
                  {owner.domain ? ` · ${owner.domain}` : ""}
                </p>
              </div>
            </div>

            <div className="md:ml-auto grid grid-cols-3 gap-2 flex-shrink-0 md:mt-0 mt-4">
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 text-center shadow-lg shadow-slate-200/40 hover:-translate-y-0.5 transition-transform">
                <p className="text-xl font-extrabold tabular-nums" style={{ color: themeColor }}>{all.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Produits</p>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 text-center shadow-lg shadow-slate-200/40 hover:-translate-y-0.5 transition-transform">
                <p className="text-xl font-extrabold tabular-nums" style={{ color: themeColor }}>
                  {all.reduce((s, i) => s + i.count, 0)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Clients</p>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl px-4 py-3 text-center shadow-lg shadow-slate-200/40 hover:-translate-y-0.5 transition-transform">
                <p className="text-xl font-extrabold tabular-nums" style={{ color: themeColor }}>
                  {all.length > 0
                    ? (all.reduce((s, i) => s + (i.rating || 0), 0) / all.filter((i) => i.rating > 0).length || 0).toFixed(1)
                    : "—"}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Note</p>
              </div>
            </div>
          </div>

          {owner.bio && (
            <p className="text-sm md:text-base text-slate-700 leading-relaxed mt-6 max-w-3xl">
              {owner.bio}
            </p>
          )}
        </div>
      </header>

      {/* ─── Search + filters bar ─────────────────────────────────────────── */}
      {hasAny && (
        <section className="bg-white border-y border-slate-200 sticky top-0 z-20 backdrop-blur-xl bg-white/90">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">
                search
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit, une formation…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {(
                [
                  { k: "all", label: "Tout", count: all.length },
                  { k: "formation", label: "Formations", count: formations.length },
                  { k: "product", label: "Produits", count: products.length },
                  { k: "bundle", label: "Packs", count: bundles.length },
                  { k: "subscription", label: "Abonnements", count: subscriptionPlans.length },
                  { k: "free", label: "Gratuits", count: all.filter((i) => i.isFree || i.price === 0).length },
                ] as const
              ).map(({ k, label, count }) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    filter === k
                      ? "text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  style={filter === k ? { background: themeGradient } : undefined}
                >
                  {label} <span className="opacity-70">· {count}</span>
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="popular">Populaires</option>
              <option value="price-asc">Prix ↑</option>
              <option value="price-desc">Prix ↓</option>
              <option value="rating">Mieux notés</option>
            </select>
          </div>
        </section>
      )}

      {/* ─── Catalogue ────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {!hasAny ? (
          <div className="relative max-w-2xl mx-auto py-10">
            {/* Halos colorés derrière la carte */}
            <div
              aria-hidden
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-[420px] h-[200px] rounded-full blur-3xl opacity-40 pointer-events-none"
              style={{ background: themeColor }}
            />
            <div className="relative bg-white border border-slate-200/80 rounded-3xl p-8 md:p-12 text-center shadow-xl shadow-slate-200/40 overflow-hidden">
              {/* Décoration : petites pastilles flottantes */}
              <div
                aria-hidden
                className="absolute top-6 left-8 w-10 h-10 rounded-2xl rotate-12 opacity-30"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}80)` }}
              />
              <div
                aria-hidden
                className="absolute top-12 right-10 w-6 h-6 rounded-xl -rotate-12 opacity-40"
                style={{ background: themeColor }}
              />
              <div
                aria-hidden
                className="absolute bottom-10 left-12 w-8 h-8 rounded-2xl rotate-45 opacity-25"
                style={{ background: themeColor }}
              />
              {/* Icône principale */}
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
              >
                <span className="material-symbols-outlined text-white text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  storefront
                </span>
              </div>

              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: themeColor }}>
                Bientôt en ligne
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Boutique en construction
              </h2>
              <p className="text-sm md:text-base text-slate-600 mt-3 max-w-md mx-auto leading-relaxed">
                {owner.name} prépare ses premiers contenus avec soin. Revenez très bientôt pour découvrir formations, ebooks et coaching de qualité.
              </p>

              {/* Pills d'anticipation : ce que le visiteur va trouver ici */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {[
                  { icon: "play_circle", label: "Formations vidéo" },
                  { icon: "menu_book", label: "Ebooks & guides" },
                  { icon: "psychology", label: "Coaching 1-1" },
                  { icon: "groups", label: "Communauté" },
                ].map((p) => (
                  <span
                    key={p.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <span className="material-symbols-outlined text-[14px]" style={{ color: themeColor }}>
                      {p.icon}
                    </span>
                    {p.label}
                  </span>
                ))}
              </div>

              {/* CTAs : explorer + partager */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                <Link
                  href="/explorer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
                  style={{ background: themeGradient, boxShadow: `0 10px 30px ${themeColor}33` }}
                >
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                  Explorer Novakou
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    const url = window.location.href;
                    const nav = window.navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
                    if (typeof nav.share === "function") {
                      nav.share({ title: owner.name, url }).catch(() => null);
                    } else if (nav.clipboard?.writeText) {
                      nav.clipboard.writeText(url).catch(() => null);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  Partager la boutique
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mt-6">
                Vous voulez être averti à l&apos;ouverture ? Suivez {owner.name} sur ses réseaux ou revenez dans quelques jours.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
            <p className="text-base font-bold text-slate-700 mt-3">Aucun résultat</p>
            <p className="text-sm text-slate-500 mt-1">
              Essayez un autre terme ou retirez le filtre actif.
            </p>
            <button
              onClick={() => { setQuery(""); setFilter("all"); }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">
              <strong className="text-slate-700 tabular-nums">{filtered.length}</strong> résultat{filtered.length > 1 ? "s" : ""}
              {query && (
                <> pour « <span className="font-semibold">{query}</span> »</>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {filtered.map((item) => {
                const href =
                  item.kind === "formation" ? `/formation/${item.slug}` :
                  item.kind === "product" ? `/produit/${item.slug}` :
                  item.kind === "bundle" ? `/bundle/${item.slug}` :
                  /* subscription */ `/abonnement/${item.id}`;
                const KIND_LABEL = {
                  formation: "Formation",
                  product: "Produit",
                  bundle: "Pack",
                  subscription: "Abonnement",
                } as const;
                const KIND_ICON = {
                  formation: "school",
                  product: "inventory_2",
                  bundle: "redeem",
                  subscription: "card_membership",
                } as const;
                const COUNT_LABEL = {
                  formation: { single: "apprenant", plural: "apprenants", icon: "group" },
                  product: { single: "vente", plural: "ventes", icon: "shopping_bag" },
                  bundle: { single: "achat", plural: "achats", icon: "shopping_bag" },
                  subscription: { single: "abonné", plural: "abonnés", icon: "person" },
                } as const;
                const cl = COUNT_LABEL[item.kind];
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={href}
                    className="group block bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all"
                  >
                    <div className="aspect-square relative bg-gradient-to-br from-slate-100 to-slate-200">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-white/60">
                            {KIND_ICON[item.kind]}
                          </span>
                        </div>
                      )}
                      <span
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white px-2 py-1 rounded-full backdrop-blur"
                        style={{ background: `${themeColor}e6` }}
                      >
                        {KIND_LABEL[item.kind]}
                      </span>
                      {(item.isFree || item.price === 0) && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-300 px-2 py-1 rounded-full">
                          Gratuit
                        </span>
                      )}
                      {item.kind === "bundle" && item.itemsCount && item.itemsCount > 0 && (
                        <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-amber-500 px-2 py-1 rounded-full shadow-sm">
                          {item.itemsCount} articles inclus
                        </span>
                      )}
                      {item.kind === "subscription" && item.trialDays && item.trialDays > 0 && (
                        <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-purple-500 px-2 py-1 rounded-full shadow-sm">
                          {item.trialDays}j d&apos;essai gratuit
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors min-h-[2.5em]">
                        {item.title}
                      </h3>
                      {item.kind === "subscription" && item.description && (
                        <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-y-1 mt-3 text-[11px] text-slate-600 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                          </span>
                          {item.rating > 0 && (item.reviewsCount ?? 0) >= 1 && (
                            <span className="font-bold text-slate-700">{item.rating.toFixed(1)}</span>
                          )}
                          <span className="text-slate-500">{(item.reviewsCount ?? 0).toLocaleString("fr-FR")} avis</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <span className="material-symbols-outlined text-[14px]">{cl.icon}</span>
                          <span>{item.count.toLocaleString("fr-FR")} {item.count > 1 ? cl.plural : cl.single}</span>
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-baseline justify-between mb-3 gap-2">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-extrabold" style={{ color: themeColor }}>
                              {item.isFree || item.price === 0 ? "Gratuit" : fmtFCFA(item.price)}
                            </span>
                            {item.kind === "subscription" && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                / {item.interval === "yearly" ? "an" : "mois"}
                              </span>
                            )}
                            {item.kind === "bundle" && item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-[11px] text-slate-400 line-through">
                                {fmtFCFA(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow"
                          style={{ background: `linear-gradient(135deg, ${themeColor}, #22c55e)` }}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.isFree || item.price === 0
                              ? "play_arrow"
                              : item.kind === "subscription"
                                ? "card_membership"
                                : "shopping_cart"}
                          </span>
                          {item.isFree || item.price === 0
                            ? (item.kind === "formation" ? "Commencer" : "Télécharger")
                            : item.kind === "subscription"
                              ? "S'abonner"
                              : item.kind === "bundle"
                                ? "Voir le pack"
                                : "Acheter"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 mt-12 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
          {/* Liens des pages boutique auto-générées.
              base = "" sur domaine perso (by-domain n'envoie pas shopSlug),
              sinon "/boutique/{slug}". */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">Boutique</p>
              <ul className="space-y-2">
                <li><a href={`${staticBase}/a-propos`} className="text-slate-600 hover:text-slate-900">À propos</a></li>
                <li><a href={`${staticBase}/aide`} className="text-slate-600 hover:text-slate-900">Aide</a></li>
                <li><a href={`${staticBase}/contact`} className="text-slate-600 hover:text-slate-900">Contact</a></li>
                <li><a href={`${staticBase}/plan-du-site`} className="text-slate-600 hover:text-slate-900">Plan du site</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2.5">Légales</p>
              <ul className="space-y-2">
                <li><a href={`${staticBase}/mentions-legales`} className="text-slate-600 hover:text-slate-900">Mentions légales</a></li>
                <li><a href={`${staticBase}/conditions`} className="text-slate-600 hover:text-slate-900">Conditions d&apos;utilisation</a></li>
                <li><a href={`${staticBase}/confidentialite`} className="text-slate-600 hover:text-slate-900">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 pt-6 border-t border-slate-100">
            <p>
              © {new Date().getFullYear()} {owner.name}
              {owner.domain ? ` · ${owner.domain}` : ""}
            </p>
            <a
              href="https://novakou.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Créer ma boutique sur Novakou
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
