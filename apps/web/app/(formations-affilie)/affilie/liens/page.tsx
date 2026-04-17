"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

type Formation = {
  id: string;
  title: string;
  slug: string;
  customCategory: string | null;
  level: string | null;
  price: number;
  rating: number | null;
  studentsCount: number;
};

type CatalogData = { data: Formation[] };
type AffiliateStatus = { isAffiliate: boolean; profile?: { affiliateCode: string } | null };
type PagePerf = { page: string; clicks: number; conversions: number; earnings: number };

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e3a2f]/60 rounded-xl ${className ?? ""}`} />;
}

const COMM_PCT = 40;

const GRADIENTS: [string, string][] = [
  ["#006e2f","#22c55e"], ["#1e3a5f","#2563eb"], ["#7c3aed","#a855f7"],
  ["#92400e","#d97706"], ["#be185d","#db2777"], ["#0e7490","#0891b2"],
  ["#065f46","#047857"], ["#0f3460","#16213e"], ["#4c1d95","#7c3aed"],
  ["#7f1d1d","#b91c1c"],
];

type Tab = "mes-liens" | "ajouter";

export default function LiensPage() {
  const [tab, setTab]           = useState<Tab>("mes-liens");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("tous");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  // Fetch affiliate code
  const { data: affiliateStatus } = useQuery<AffiliateStatus>({
    queryKey: ["affiliate-status"],
    queryFn: () => fetch("/api/formations/apprenant/affiliate").then((r) => r.json()),
    staleTime: 300_000,
  });

  // Fetch formation catalog
  const { data: catalogData, isLoading: catalogLoading } = useQuery<CatalogData>({
    queryKey: ["affilie-catalog", search, catFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search)   params.set("q", search);
      if (catFilter !== "tous") params.set("category", catFilter);
      return fetch(`/api/formations/affilie/catalog?${params}`).then((r) => r.json());
    },
    staleTime: 60_000,
  });

  // Fetch per-page performance (to show click/conversion stats on "mes liens" tab)
  const { data: perfData } = useQuery({
    queryKey: ["affilie-performances"],
    queryFn: () => fetch("/api/formations/affilie/performances").then((r) => r.json()),
    staleTime: 60_000,
  });

  const affiliateCode = affiliateStatus?.profile?.affiliateCode ?? "";
  const formations: Formation[] = catalogData?.data ?? [];
  const perPage: PagePerf[] = perfData?.perPage ?? [];

  // Build a map: slug → perf data
  const perfBySlug = useMemo(() => {
    const m: Record<string, PagePerf> = {};
    for (const p of perPage) {
      const slug = p.page?.split("/").filter(Boolean).pop() ?? "";
      if (slug) m[slug] = p;
    }
    return m;
  }, [perPage]);

  function buildLink(slug: string) {
    if (!affiliateCode) return "";
    return `${typeof window !== "undefined" ? window.location.origin : "https://freelancehigh.com"}/formations/formation/${slug}?ref=${affiliateCode}`;
  }

  function handleCopy(link: string, id: string) {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handlePin(id: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); setJustAdded(id); setTimeout(() => setJustAdded(null), 3000); }
      return next;
    });
    if (tab === "ajouter") setTab("mes-liens");
  }

  // "Mes liens" = pinned formations + formations with actual click history
  const activeSlugs = new Set(Object.keys(perfBySlug));
  const myFormations = formations.filter((f) => pinnedIds.has(f.id) || activeSlugs.has(f.slug));

  // Available = everything else
  const categories = useMemo(() =>
    ["tous", ...Array.from(new Set(formations.map((f) => f.customCategory).filter(Boolean) as string[]))],
    [formations]
  );

  const totalMyClicks = myFormations.reduce((s, f) => s + (perfBySlug[f.slug]?.clicks ?? 0), 0);
  const totalMyEarned = myFormations.reduce((s, f) => s + (perfBySlug[f.slug]?.earnings ?? 0), 0);

  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">Mes liens affiliés</h1>
          <p className="text-sm text-[#5c9e7a] mt-0.5">
            Chaque achat via votre lien crédite{" "}
            <strong className="text-[#22c55e]">{COMM_PCT}% automatiquement</strong> sur votre solde
          </p>
        </div>
        {affiliateCode && (
          <div className="flex items-center gap-2 bg-[#0d1f17] border border-[#1e3a2f] rounded-xl px-4 py-2">
            <span className="text-[10px] text-[#5c9e7a]">Votre code</span>
            <span className="font-mono font-bold text-[#22c55e] text-sm">{affiliateCode}</span>
          </div>
        )}
      </div>

      {/* Just-added banner */}
      {justAdded && (
        <div className="mb-5 bg-[#22c55e]/15 border border-[#22c55e]/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-[#22c55e]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-[#22c55e]">Lien épinglé avec succès !</p>
            <p className="text-[10px] text-[#5c9e7a]">
              Partagez-le — chaque achat vous rapporte{" "}
              <strong className="text-white">{COMM_PCT}% automatiquement</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0d1f17] border border-[#1e3a2f] w-fit mb-6">
        <button
          onClick={() => setTab("mes-liens")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "mes-liens" ? "bg-[#22c55e] text-white" : "text-[#5c9e7a] hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">link</span>
          Mes liens
          {myFormations.length > 0 && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === "mes-liens" ? "bg-white/20 text-white" : "bg-[#1e3a2f] text-[#5c9e7a]"}`}>
              {myFormations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("ajouter")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "ajouter" ? "bg-[#22c55e] text-white" : "text-[#5c9e7a] hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">add_link</span>
          Explorer le catalogue
          {formations.length > 0 && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === "ajouter" ? "bg-white/20 text-white" : "bg-amber-500/30 text-amber-400"}`}>
              {formations.length}
            </span>
          )}
        </button>
      </div>

      {/* ── MES LIENS ── */}
      {tab === "mes-liens" && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Liens actifs",         value: myFormations.length.toString(), icon: "link" },
              { label: "Clics totaux",          value: totalMyClicks.toLocaleString("fr-FR"), icon: "ads_click" },
              { label: "Commissions gagnées",   value: formatFcfa(totalMyEarned), icon: "payments" },
            ].map((s, i) => (
              <div key={i} className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-4">
                <span className="material-symbols-outlined text-[18px] text-[#5c9e7a] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <p className="text-lg font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] text-[#5c9e7a]">{s.label}</p>
              </div>
            ))}
          </div>

          {myFormations.length === 0 ? (
            <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#1e3a2f] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>add_link</span>
              <p className="text-sm font-bold text-white mb-1">Aucun lien actif pour l&apos;instant</p>
              <p className="text-xs text-[#5c9e7a] mb-4">
                Parcourez le catalogue et épinglez des formations pour générer vos liens affiliés.
              </p>
              <button
                onClick={() => setTab("ajouter")}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                Explorer le catalogue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myFormations.map((f, idx) => {
                const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
                const link = buildLink(f.slug);
                const perf = perfBySlug[f.slug];
                const isCopied = copiedId === f.id;
                const commission = Math.round(f.price * (COMM_PCT / 100));
                return (
                  <div
                    key={f.id}
                    className={`bg-[#0d1f17] rounded-2xl border overflow-hidden transition-all ${
                      justAdded === f.id ? "border-[#22c55e]/60 shadow-[0_0_0_2px_rgba(34,197,94,0.15)]" : "border-[#1e3a2f]"
                    }`}
                  >
                    <div className="h-1" style={{ background: `linear-gradient(to right, ${gFrom}, ${gTo})` }} />
                    <div className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {f.customCategory && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">{f.customCategory}</span>
                            )}
                            {justAdded === f.id && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Nouveau !</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-white truncate">{f.title}</p>
                          <p className="text-xs text-[#5c9e7a]">
                            {f.rating ? `⭐ ${f.rating.toFixed(1)} ·` : ""} {f.studentsCount.toLocaleString("fr-FR")} élèves
                          </p>
                        </div>
                        <button
                          onClick={() => setPinnedIds((prev) => { const n = new Set(prev); n.delete(f.id); return n; })}
                          className="p-1.5 rounded-lg text-[#5c9e7a] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                          title="Retirer de mes liens"
                        >
                          <span className="material-symbols-outlined text-[16px]">bookmark_remove</span>
                        </button>
                      </div>

                      {/* Link display */}
                      {affiliateCode ? (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex-1 bg-[#1e3a2f] rounded-lg px-3 py-2.5 flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[13px] text-[#5c9e7a] flex-shrink-0">link</span>
                            <span className="text-xs text-[#5c9e7a] truncate font-mono">{link}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(link, f.id)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                              isCopied ? "bg-[#22c55e] text-white" : "bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{isCopied ? "check" : "content_copy"}</span>
                            {isCopied ? "Copié !" : "Copier"}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-400 mb-4">Code affilié non disponible — vérifiez votre inscription.</p>
                      )}

                      {/* Commission notice */}
                      <div className="bg-[#22c55e]/8 border border-[#22c55e]/15 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-[#22c55e]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        <p className="text-[10px] text-[#5c9e7a]">
                          Chaque achat via ce lien vous crédite automatiquement{" "}
                          <strong className="text-[#22c55e]">{formatFcfa(commission)}</strong>
                          {" "}({COMM_PCT}% de {formatFcfa(f.price)})
                        </p>
                      </div>

                      {/* Real stats */}
                      <div className="flex items-center gap-5 text-[10px] text-[#5c9e7a] flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">ads_click</span>
                          {perf?.clicks ?? 0} clics
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">shopping_bag</span>
                          {perf?.conversions ?? 0} ventes
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">payments</span>
                          {formatFcfa(perf?.earnings ?? 0)} gagnés
                        </span>
                        {(perf?.clicks ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-[#22c55e]">
                            <span className="material-symbols-outlined text-[12px]">percent</span>
                            {(((perf?.conversions ?? 0) / (perf?.clicks ?? 1)) * 100).toFixed(1)}% conv.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EXPLORER LE CATALOGUE ── */}
      {tab === "ajouter" && (
        <div>
          {/* Explanation banner */}
          <div className="bg-[#0d1f17] border border-[#22c55e]/20 rounded-xl p-4 mb-5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-[#22c55e] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <div>
              <p className="text-xs font-bold text-white mb-0.5">Comment générer un lien</p>
              <p className="text-[11px] text-[#5c9e7a] leading-relaxed">
                Cliquez sur &quot;Épingler &amp; générer mon lien&quot; pour ajouter une formation à votre espace.
                Un lien unique contenant votre code affilié est généré instantanément.
                Dès qu&apos;un acheteur commande via votre lien,{" "}
                <strong className="text-[#22c55e]">{COMM_PCT}% est crédité automatiquement</strong>.
              </p>
            </div>
          </div>

          {/* Search + filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex-1 min-w-[200px] bg-[#0d1f17] border border-[#1e3a2f] rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#5c9e7a]">search</span>
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#5c9e7a] outline-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    catFilter === cat ? "bg-[#22c55e] text-white" : "bg-[#0d1f17] border border-[#1e3a2f] text-[#5c9e7a] hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0,1,2,3,4,5].map((i) => <SkeletonBlock key={i} className="h-48" />)}
            </div>
          ) : formations.length === 0 ? (
            <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-10 text-center">
              <p className="text-sm text-[#5c9e7a]">
                {search || catFilter !== "tous"
                  ? "Aucune formation ne correspond à votre recherche."
                  : "Aucune formation disponible pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formations.map((f, idx) => {
                const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
                const commission = Math.round(f.price * (COMM_PCT / 100));
                const isPinned = pinnedIds.has(f.id);
                const hasActivity = activeSlugs.has(f.slug);
                const link = buildLink(f.slug);
                return (
                  <div key={f.id} className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] overflow-hidden">
                    <div className="h-1" style={{ background: `linear-gradient(to right, ${gFrom}, ${gTo})` }} />
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl flex-shrink-0" style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }} />
                        <div className="flex-1 min-w-0">
                          {f.customCategory && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e] mb-1 inline-block">{f.customCategory}</span>
                          )}
                          <p className="text-sm font-bold text-white leading-snug">{f.title}</p>
                          <p className="text-xs text-[#5c9e7a]">
                            {f.rating ? `⭐ ${f.rating.toFixed(1)} ·` : ""} {f.studentsCount.toLocaleString("fr-FR")} élèves
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-[#5c9e7a]">Votre gain par vente ({COMM_PCT}%)</p>
                          <p className="text-lg font-extrabold text-[#22c55e]">{formatFcfa(commission)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-[#5c9e7a]">Prix de vente</p>
                          <p className="text-sm font-bold text-white">{formatFcfa(f.price)}</p>
                        </div>
                      </div>

                      {(isPinned || hasActivity) ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-[#1e3a2f] rounded-lg px-3 py-2.5">
                            <span className="material-symbols-outlined text-[13px] text-[#5c9e7a] flex-shrink-0">link</span>
                            <span className="text-xs text-[#5c9e7a] truncate font-mono flex-1">{link}</span>
                          </div>
                          <button
                            onClick={() => link && handleCopy(link, f.id)}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                              copiedId === f.id ? "bg-[#22c55e] text-white" : "bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{copiedId === f.id ? "check" : "content_copy"}</span>
                            {copiedId === f.id ? "Copié !" : "Copier le lien"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePin(f.id)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                        >
                          <span className="material-symbols-outlined text-[16px]">add_link</span>
                          Épingler &amp; générer mon lien
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
