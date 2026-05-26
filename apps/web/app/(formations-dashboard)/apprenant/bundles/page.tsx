// Page apprenant — packs achetés
// Bureau session 4 (P1 Marcus). L'API /api/formations/apprenant/bundles
// existait déjà mais aucune page UI ne la consommait : les acheteurs d'un
// pack 100% produits digitaux n'avaient pas de point d'entrée naturel
// (mes-formations ne montre que des Enrollment).

"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

type BundlePurchase = {
  id: string;
  paidAmount: number;
  createdAt: string;
  bundle: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    banner: string | null;
    priceXof: number;
    rating: number;
    reviewsCount: number;
    items: { itemKind: "formation" | "digital" }[];
    instructeur: { user: { name: string | null; image: string | null } };
    shop: { slug: string; name: string } | null;
    reviews: { id: string; rating: number; comment: string | null }[];
  };
};

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

function relativeDate(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${days >= 14 ? "s" : ""}`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ApprenantBundlesPage() {
  const { data, isLoading, error } = useQuery<{ data: BundlePurchase[] }>({
    queryKey: ["apprenant-bundles"],
    queryFn: () => fetch("/api/formations/apprenant/bundles").then((r) => r.json()),
    staleTime: 30_000,
  });

  const purchases = data?.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="p-5 md:p-10 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
            Espace apprenant
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Mes packs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Retrouvez vos packs Novakou et accédez à tout le contenu inclus en un clic.
          </p>
        </header>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
                <div className="h-32 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Erreur */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-rose-700">
              Impossible de charger vos packs. Réessayez dans un instant.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && purchases.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 md:p-14 text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #006e2f15, #22c55e15)" }}
            >
              <span className="material-symbols-outlined text-4xl text-emerald-700">
                inventory_2
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Aucun pack pour le moment</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Les packs Novakou réunissent plusieurs formations et produits à prix réduit. Découvrez ceux disponibles dans l&apos;explorer.
            </p>
            <Link
              href="/explorer?tab=bundles"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Découvrir les packs
            </Link>
          </div>
        )}

        {/* Grille */}
        {!isLoading && purchases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {purchases.map((p) => {
              const formationCount = p.bundle.items.filter((i) => i.itemKind === "formation").length;
              const productCount = p.bundle.items.filter((i) => i.itemKind === "digital").length;
              const itemCount = p.bundle.items.length;
              const heroImg = p.bundle.thumbnail ?? p.bundle.banner;
              const seller = p.bundle.instructeur.user.name ?? "Créateur";
              const myReview = p.bundle.reviews[0];

              return (
                <article
                  key={p.id}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 hover:border-[#006e2f]/30 transition-all"
                >
                  {/* Image */}
                  <Link href={`/bundle/${p.bundle.slug}`} className="block">
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-[#003d1a] to-[#22c55e] overflow-hidden">
                      {heroImg ? (
                        <Image
                          src={heroImg}
                          alt={p.bundle.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white/40 text-[72px]">
                            inventory_2
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-emerald-700 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                        <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                        Pack · {itemCount} contenu{itemCount > 1 ? "s" : ""}
                      </div>
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link href={`/bundle/${p.bundle.slug}`} className="min-w-0">
                        <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 group-hover:text-[#006e2f] transition-colors">
                          {p.bundle.title}
                        </h3>
                      </Link>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[12px]">person</span>
                      par <span className="font-semibold text-slate-700">{seller}</span>
                      {p.bundle.shop && (
                        <>
                          <span className="text-slate-300">·</span>
                          <Link href={`/boutique/${p.bundle.shop.slug}`} className="hover:underline">
                            {p.bundle.shop.name}
                          </Link>
                        </>
                      )}
                    </p>

                    {/* Composition */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {formationCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[14px]">play_circle</span>
                          {formationCount} formation{formationCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {productCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          {productCount} produit{productCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 pb-4 border-b border-slate-100">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        Acheté {relativeDate(p.createdAt)}
                      </span>
                      <span className="font-bold text-emerald-700 tabular-nums">{fmtFCFA(p.paidAmount)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/apprenant/mes-formations"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:shadow-md hover:opacity-90 transition-all"
                        style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                      >
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        Accéder au contenu
                      </Link>
                      <Link
                        href={`/bundle/${p.bundle.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                        title="Voir la page pack"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </Link>
                    </div>

                    {/* Review (si laissée) */}
                    {myReview && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className="material-symbols-outlined text-[14px] text-amber-400"
                              style={{ fontVariationSettings: s <= myReview.rating ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-400 ml-1 uppercase tracking-wider font-bold">
                            Votre avis
                          </span>
                        </div>
                        {myReview.comment && (
                          <p className="text-xs text-slate-600 italic line-clamp-2">
                            « {myReview.comment} »
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Lien retour explorer */}
        {!isLoading && purchases.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/explorer?tab=bundles"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#006e2f] hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">explore</span>
              Découvrir d&apos;autres packs Novakou
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
