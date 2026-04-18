"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

interface Item {
  kind: "formation" | "product";
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  isFree: boolean;
  rating: number;
  count: number;          // nombre d'apprenants (formation) ou ventes (produit)
  reviewsCount?: number;  // nombre d'avis laissés
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
}: {
  owner: Owner;
  formations: Item[];
  products: Item[];
}) {
  const all = useMemo(() => [...formations, ...products], [formations, products]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "formation" | "product" | "free">("all");
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc" | "rating">("popular");

  const filtered = useMemo(() => {
    let list = all;
    if (filter === "formation") list = list.filter((i) => i.kind === "formation");
    else if (filter === "product") list = list.filter((i) => i.kind === "product");
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
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
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
            {/* Fallback : gradient décoratif basé sur themeColor */}
            <div
              className="absolute inset-0"
              style={{ background: themeGradient, opacity: 0.08 }}
            />
            <div
              aria-hidden
              className="absolute -top-32 -right-20 w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
              style={{ background: themeColor }}
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-10 w-[300px] h-[300px] rounded-full blur-3xl opacity-15"
              style={{ background: themeColor }}
            />
          </>
        )}

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            <div className="flex items-center gap-4 md:gap-5">
              {owner.image ? (
                <Image
                  src={owner.image}
                  alt={owner.name}
                  width={112}
                  height={112}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white shadow-xl flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl md:text-5xl border-4 border-white shadow-xl flex-shrink-0"
                  style={{ background: themeGradient }}
                >
                  {owner.name[0]?.toUpperCase() ?? "N"}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                    style={{ background: themeGradient }}
                  >
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    Boutique officielle
                  </span>
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {owner.name}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Propulsé par <span className="font-semibold text-emerald-700">Novakou</span>
                  {owner.domain ? ` · ${owner.domain}` : ""}
                </p>
              </div>
            </div>

            <div className="md:ml-auto flex items-center gap-3 flex-shrink-0 md:mt-0 mt-4">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                <p className="text-xl font-extrabold text-slate-900 tabular-nums">{all.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Produits</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-center shadow-sm">
                <p className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {all.reduce((s, i) => s + i.count, 0)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Clients</p>
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
          <div className="text-center py-20 max-w-md mx-auto">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `${themeColor}15` }}
            >
              <span className="material-symbols-outlined text-4xl" style={{ color: themeColor }}>
                storefront
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900">Boutique en construction</p>
            <p className="text-sm text-slate-500 mt-2">
              {owner.name} prépare ses premiers contenus. Revenez bientôt pour les découvrir.
            </p>
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
                  item.kind === "formation" ? `/formation/${item.slug}` : `/produit/${item.slug}`;
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={href}
                    className="group block bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all"
                  >
                    <div className="aspect-video relative bg-gradient-to-br from-slate-100 to-slate-200">
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
                            {item.kind === "formation" ? "school" : "inventory_2"}
                          </span>
                        </div>
                      )}
                      <span
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white px-2 py-1 rounded-full backdrop-blur"
                        style={{ background: `${themeColor}e6` }}
                      >
                        {item.kind === "formation" ? "Formation" : "Produit"}
                      </span>
                      {(item.isFree || item.price === 0) && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-300 px-2 py-1 rounded-full">
                          Gratuit
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors min-h-[2.5em]">
                        {item.title}
                      </h3>
                      {/* Stats : on n'affiche les chiffres que si significatifs.
                          Sinon → badge "Nouveau" (jamais "1 vente" / "0 avis" qui décrédibilisent). */}
                      {(() => {
                        const hasMeaningfulRating = item.rating > 0 && (item.reviewsCount ?? 0) >= 3;
                        const hasMeaningfulCount = item.count >= 10;
                        if (!hasMeaningfulRating && !hasMeaningfulCount) {
                          return (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  auto_awesome
                                </span>
                                Nouveau
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-[10px] text-slate-600 font-medium">
                            {hasMeaningfulRating && (
                              <span className="inline-flex items-center gap-0.5">
                                <span
                                  className="material-symbols-outlined text-[12px] text-amber-400"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                                <span className="font-bold text-slate-700">{item.rating.toFixed(1)}</span>
                                <span className="text-slate-400">({item.reviewsCount} avis)</span>
                              </span>
                            )}
                            {hasMeaningfulRating && hasMeaningfulCount && <span className="text-slate-300">·</span>}
                            {hasMeaningfulCount && (
                              <span className="inline-flex items-center gap-0.5 text-slate-500">
                                <span className="material-symbols-outlined text-[12px]">
                                  {item.kind === "formation" ? "group" : "shopping_bag"}
                                </span>
                                <span>{item.count.toLocaleString("fr-FR")} {item.kind === "formation" ? "apprenants" : "ventes"}</span>
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <span className="text-base font-extrabold" style={{ color: themeColor }}>
                          {item.isFree || item.price === 0 ? "Gratuit" : fmtFCFA(item.price)}
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
                          arrow_forward
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
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
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
      </footer>
    </div>
  );
}
