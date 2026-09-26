"use client";

import { useToastStore } from "@/store/toast";
import { usePrix } from "@/components/formations/Prix";
import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { trackEvents, debounce } from "@/lib/tracking/events";
import { ArrowRight, Gift, X } from "lucide-react";
import "@/components/formations/explorer/explorer.css";
import { EnTeteExplorer } from "@/components/formations/explorer/EnTeteExplorer";
import { EnTeteSection } from "@/components/formations/explorer/EnTeteSection";
import { FiltresExplorer } from "@/components/formations/explorer/FiltresExplorer";
import { BentoSquelette, BentoVedettes } from "@/components/formations/explorer/BentoVedettes";
import { CarteArticle } from "@/components/formations/explorer/CarteArticle";
import { EtatErreur, EtatVide, GrilleSquelette } from "@/components/formations/explorer/EtatsExplorer";
import { Pagination } from "@/components/formations/explorer/Pagination";
import { useReveal } from "@/components/formations/explorer/use-reveal";
import {
  PRIX_MAX_DEFAUT,
  type CategoryMeta,
  type ExplorerData,
  type Item,
  type Onglet,
  type Tri,
} from "@/components/formations/explorer/types";

/*
 * Marketplace publique. Les données, les paramètres d'URL (q, tab, category,
 * minRating, maxPrice, sort), la requête TanStack (`public-explorer`) et le
 * tracking sont ceux d'avant ; la présentation vit dans
 * components/formations/explorer/ (en-tête, filtres, bento, cartes, états).
 */

// ── Section catégorie : 6 produits max + « Voir tout » ───────────────────
function RangeeCategorie({
  id,
  titre,
  items,
  onVoirTout,
}: {
  id: string;
  titre: string;
  items: Item[];
  onVoirTout: () => void;
}) {
  return (
    <section aria-labelledby={id} className="mb-14 md:mb-20">
      <EnTeteSection
        id={id}
        titre={titre}
        action={
          <button type="button" onClick={onVoirTout} className="nkx-btn nkx-btn--sm" aria-label={`Voir tout : ${titre}`}>
            Voir tout
            <span className="nkx-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {items.map((item) => (
          <CarteArticle key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

// ── Vue par défaut : une rangée par catégorie thématique, packs à part ─────
function SectionsCategories({
  categories,
  formations,
  products,
  bundles,
  onVoirCategorie,
  onVoirPacks,
}: {
  categories: CategoryMeta[];
  formations: Item[];
  products: Item[];
  bundles: Item[];
  onVoirCategorie: (slug: string) => void;
  onVoirPacks: () => void;
}) {
  const parCategorie = new Map<string, Item[]>();
  for (const it of [...formations, ...products]) {
    const k = it.categorySlug;
    if (!k) continue;
    if (!parCategorie.has(k)) parCategorie.set(k, []);
    parCategorie.get(k)!.push(it);
  }
  // Rangées dans l'ordre défini par l'admin (`order`), seulement celles avec produits.
  const rangees = categories
    .map((c) => ({ meta: c, items: parCategorie.get(c.slug) ?? [] }))
    .filter((r) => r.items.length > 0);

  return (
    <div>
      {rangees.map((r) => (
        <RangeeCategorie
          key={r.meta.slug}
          id={`nkx-cat-${r.meta.slug}`}
          titre={r.meta.name}
          items={r.items.slice(0, 6)}
          onVoirTout={() => onVoirCategorie(r.meta.slug)}
        />
      ))}
      {/* Les packs n'ont pas de catégorie thématique → leur propre rangée. */}
      {bundles.length > 0 && (
        <RangeeCategorie id="nkx-cat-packs" titre="Packs & offres groupées" items={bundles.slice(0, 6)} onVoirTout={onVoirPacks} />
      )}
    </div>
  );
}

function GiftModal({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const formatFCFA = usePrix();
  const [form, setForm] = useState({ recipientEmail: "", recipientName: "", message: "" });
  const [success, setSuccess] = useState<string | null>(null);

  const giftMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/formations/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: item?.kind, itemId: item?.id, ...body }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { useToastStore.getState().addToast("error", res.error); return; }
      setSuccess(res.data?.recipient?.email ?? null);
    },
  });

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#006e2f]/10 flex items-center justify-center mx-auto mb-4">
              <Gift size={32} className="text-[#006e2f]" />
            </div>
            <h2 className="text-lg font-bold text-[#191c1e] mb-2">Cadeau envoyé !</h2>
            <p className="text-sm text-[#5c647a] mb-4">
              <span className="font-semibold text-[#191c1e]">{success}</span> recevra un email avec les instructions pour accéder à « {item.title} ».
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-white font-bold hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#191c1e] flex items-center gap-2">
                  <Gift size={20} className="text-pink-500" />
                  Offrir ce {item.kind === "formation" ? "cours" : "produit"}
                </h2>
                <p className="text-xs text-[#5c647a] mt-1 line-clamp-1">« {item.title} »</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-[#5c647a]" />
              </button>
            </div>

            <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-pink-800">
                Vous allez payer <span className="font-bold">{formatFCFA(item.price)}</span> et le destinataire recevra un accès immédiat à ce contenu.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Email du destinataire *</label>
                <input
                  type="email"
                  value={form.recipientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
                  placeholder="ami@exemple.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Prénom du destinataire</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                  placeholder="Marie"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]/40 focus:ring-2 focus:ring-[#006e2f]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5 uppercase tracking-wide">Message personnel (optionnel)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Joyeux anniversaire ! J'ai pensé que ça te plairait."
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]/40 resize-none"
                />
                <p className="text-[10px] text-[#5c647a] mt-1 text-right">{form.message.length}/200</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={() => giftMutation.mutate(form)}
                disabled={!form.recipientEmail || giftMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {giftMutation.isPending ? "Envoi…" : `Offrir ${formatFCFA(item.price)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ExplorerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Hydrate filters from URL on mount
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [activeTab, setActiveTab] = useState<Onglet>(() => (searchParams.get("tab") as Onglet) ?? "all");
  // Accepte `?category=` ET `?categorie=` (l'alias du sitemap). Valeur = slug.
  const [activeCategory, setActiveCategory] = useState<string | null>(
    () => searchParams.get("category") ?? searchParams.get("categorie"),
  );
  const [minRating, setMinRating] = useState(() => Number(searchParams.get("minRating") ?? "0"));
  const [maxPrice, setMaxPrice] = useState(() => Number(searchParams.get("maxPrice") ?? String(PRIX_MAX_DEFAUT)));
  const [sort, setSort] = useState<Tri>(() => (searchParams.get("sort") as Tri) ?? "relevance");
  const [giftItem, setGiftItem] = useState<Item | null>(null);

  // Sync state → URL on every change (replace, not push, to avoid history pollution)
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (activeTab !== "all") params.set("tab", activeTab);
    if (activeCategory) params.set("category", activeCategory);
    if (minRating > 0) params.set("minRating", String(minRating));
    if (maxPrice < PRIX_MAX_DEFAUT) params.set("maxPrice", String(maxPrice));
    if (sort !== "relevance") params.set("sort", sort);
    const qs = params.toString();
    const url = qs ? `/explorer?${qs}` : "/explorer";
    // Avoid history flood : replaceState only when query actually changed
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== url) {
      router.replace(url, { scroll: false });
    }
  }, [search, activeTab, activeCategory, minRating, maxPrice, sort, router]);

  // La requête part 250 ms après la dernière frappe (le champ et l'URL, eux,
  // suivent chaque frappe) : plus une requête par lettre tapée.
  const [rechercheDiffere, setRechercheDiffere] = useState(search);
  useEffect(() => {
    const t = window.setTimeout(() => setRechercheDiffere(search), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data: response, isLoading, isError, isFetching, isPlaceholderData, refetch } = useQuery<{ data: ExplorerData }>({
    queryKey: ["public-explorer", rechercheDiffere, activeCategory, minRating, maxPrice, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rechercheDiffere) params.set("search", rechercheDiffere);
      if (activeCategory) params.set("category", activeCategory);
      if (minRating > 0) params.set("minRating", String(minRating));
      if (maxPrice < PRIX_MAX_DEFAUT) params.set("maxPrice", String(maxPrice));
      if (sort !== "relevance") params.set("sort", sort);
      const r = await fetch(`/api/formations/public/explorer?${params.toString()}`);
      // Sans ce contrôle, un 500 devenait « aucun résultat » : on veut l'état d'erreur.
      if (!r.ok) throw new Error(`explorer HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
    // Au changement de filtre, les cartes précédentes restent (atténuées) le
    // temps de la réponse : pas de squelette qui clignote à chaque clic.
    placeholderData: keepPreviousData,
  });

  const data = response?.data;
  // Memoize les listes pour stabiliser les références entre les renders.
  const formations = useMemo(() => data?.formations ?? [], [data?.formations]);
  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const bundles = useMemo(() => data?.bundles ?? [], [data?.bundles]);
  const categories = data?.categories ?? [];
  const stats = data?.stats;
  // Nom de la catégorie active (pour l'en-tête « page dédiée »).
  const activeCategoryName = activeCategory
    ? (categories.find((c) => c.slug === activeCategory)?.name ?? null)
    : null;

  // ── Tracking : recherche acheteur (debounced) ─────────────────────────
  const trackSearchRef = useRef(
    debounce((q: string, ctx: { resultsCount: number; filters: Record<string, unknown> }) => {
      trackEvents.search(q, { resultsCount: ctx.resultsCount, filters: ctx.filters });
    }, 700),
  );
  useEffect(() => {
    if (!search || search.trim().length < 2) return;
    trackSearchRef.current(search, {
      resultsCount: (formations.length + products.length) | 0,
      filters: {
        tab: activeTab,
        category: activeCategory ?? undefined,
        minRating: minRating || undefined,
        maxPrice: maxPrice < PRIX_MAX_DEFAUT ? maxPrice : undefined,
        sort: sort !== "relevance" ? sort : undefined,
      },
    });
  }, [search, activeTab, activeCategory, minRating, maxPrice, sort, formations.length, products.length]);

  const displayedItems = useMemo(() => {
    if (activeTab === "formations") return formations;
    if (activeTab === "products") return products;
    if (activeTab === "bundles") return bundles;
    // "all" — interleave formations, products et bundles
    return [...formations, ...products, ...bundles].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activeTab, formations, products, bundles]);

  // ── Pagination Précédent/Suivant — 12/page (4 rangées de 3 en desktop) ──
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    // Reset à la page 1 quand les filtres changent : sinon on peut être
    // bloqué sur une page vide (ex : page 5 alors qu'il ne reste que 2 résultats).
    setCurrentPage(1);
  }, [search, activeTab, activeCategory, minRating, maxPrice, sort]);
  const totalPages = Math.max(1, Math.ceil(displayedItems.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const visibleItems = useMemo(
    () => displayedItems.slice(startIdx, startIdx + PAGE_SIZE),
    [displayedItems, startIdx],
  );

  function goToPage(p: number) {
    const next = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(next);
    // Remonte au sommet de la grille à chaque navigation pour éviter d'être
    // perdu en bas du footer (mobile surtout).
    if (typeof window !== "undefined") {
      const grid = document.getElementById("explorer-grid");
      if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const resetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setActiveCategory(null);
    setMinRating(0);
    setMaxPrice(PRIX_MAX_DEFAUT);
    setSort("relevance");
  };

  // Vue « accueil marketplace » (bento + rangées par catégorie) : uniquement
  // quand AUCUN filtre n'est actif. Dès qu'on cherche/filtre/trie, grille filtrée.
  const isDefaultView =
    !search && !activeCategory && activeTab === "all" &&
    sort === "relevance" && minRating === 0 && maxPrice >= PRIX_MAX_DEFAUT;
  const nbFiltresPanneau =
    (activeTab !== "all" ? 1 : 0) + (sort !== "relevance" ? 1 : 0) + (minRating > 0 ? 1 : 0) + (maxPrice < PRIX_MAX_DEFAUT ? 1 : 0);
  const filtresActifs = nbFiltresPanneau > 0 || !!search || !!activeCategory;
  // Nouvelles données en route : les cartes en place s'atténuent.
  const occupe = isFetching && isPlaceholderData;

  const handleSeeCategory = (slug: string) => {
    setActiveCategory(slug);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleSeeBundles = () => {
    setActiveTab("bundles");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Révélation en cascade : ré-observe dès que la liste rendue change.
  const racineRef = useRef<HTMLDivElement>(null);
  const cleReveal = useMemo(
    () => `${isLoading}|${isError}|${isDefaultView}|${safePage}|${displayedItems.map((i) => i.id).join(",")}`,
    [isLoading, isError, isDefaultView, safePage, displayedItems],
  );
  useReveal(racineRef, cleReveal);

  const sousTitre = isLoading
    ? "Chargement du catalogue…"
    : activeCategoryName
      ? `${displayedItems.length.toLocaleString("fr-FR")} produit${displayedItems.length > 1 ? "s" : ""} dans cette catégorie.`
      : stats && stats.total > 0
        ? `${stats.total.toLocaleString("fr-FR")} produit${stats.total > 1 ? "s" : ""} disponible${stats.total > 1 ? "s" : ""} créé${stats.total > 1 ? "s" : ""} par nos experts.`
        : "Les premiers produits arrivent bientôt.";

  return (
    <div ref={racineRef} className="nkx min-h-screen bg-[#f7f9fb]">
      <EnTeteExplorer
        nomCategorie={activeCategoryName}
        sousTitre={sousTitre}
        recherche={search}
        onRecherche={setSearch}
        onMotsClesIA={(kw) => {
          setSearch(kw);
          setActiveTab("all");
        }}
        categories={categories}
        categorieActive={activeCategory}
        onCategorie={setActiveCategory}
      />

      <FiltresExplorer
        onglet={activeTab}
        onOnglet={setActiveTab}
        stats={stats}
        tri={sort}
        onTri={setSort}
        noteMin={minRating}
        onNoteMin={setMinRating}
        prixMax={maxPrice}
        onPrixMax={setMaxPrice}
        nbFiltresPanneau={nbFiltresPanneau}
        filtresActifs={filtresActifs}
        onReinitialiser={resetFilters}
        nbResultats={displayedItems.length}
        page={safePage}
        totalPages={totalPages}
        chargement={isLoading}
      />

      <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
        {isError && !data ? (
          <EtatErreur onReessayer={() => void refetch()} enCours={isFetching} />
        ) : isLoading ? (
          <>
            {isDefaultView && <BentoSquelette />}
            <GrilleSquelette nb={9} />
          </>
        ) : displayedItems.length === 0 ? (
          <EtatVide catalogueVide={(stats?.total ?? 0) === 0} recherche={search.trim()} onEffacer={resetFilters} />
        ) : isDefaultView ? (
          <div id="explorer-grid" className={`nkx-grid scroll-mt-36 ${occupe ? "nkx-busy" : ""}`} aria-busy={occupe}>
            <BentoVedettes items={displayedItems} />
            <SectionsCategories
              categories={categories}
              formations={formations}
              products={products}
              bundles={bundles}
              onVoirCategorie={handleSeeCategory}
              onVoirPacks={handleSeeBundles}
            />
          </div>
        ) : (
          <div className={`nkx-grid ${occupe ? "nkx-busy" : ""}`} aria-busy={occupe}>
            <h2 className="sr-only">Résultats</h2>
            <div
              id="explorer-grid"
              data-testid="explorer-grid"
              className="grid scroll-mt-36 grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3"
            >
              {visibleItems.map((item) => (
                <CarteArticle key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPage={goToPage}
              debut={startIdx + 1}
              fin={Math.min(startIdx + PAGE_SIZE, displayedItems.length)}
              total={displayedItems.length}
            />
          </div>
        )}
      </div>

      <GiftModal item={giftItem} onClose={() => setGiftItem(null)} />
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f9fb]" />}>
      <ExplorerInner />
    </Suspense>
  );
}
