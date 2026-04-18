"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  url: string;
  kind: "video" | "pdf" | "image" | "audio" | "other";
  source: "formation" | "product";
  sourceId: string;
  sourceTitle: string;
  updatedAt: string;
}

const KIND_ICON: Record<Resource["kind"], string> = {
  video: "smart_display",
  pdf: "picture_as_pdf",
  image: "image",
  audio: "graphic_eq",
  other: "folder",
};

const KIND_LABEL: Record<Resource["kind"], string> = {
  video: "Vidéo",
  pdf: "PDF",
  image: "Image",
  audio: "Audio",
  other: "Fichier",
};

export default function VendorResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | Resource["kind"]>("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/formations/vendeur/resources");
        const j = await res.json();
        setResources(Array.isArray(j?.data?.resources) ? j.data.resources : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = resources;
    if (kindFilter !== "all") list = list.filter((r) => r.kind === kindFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) || r.sourceTitle.toLowerCase().includes(q),
      );
    }
    return list;
  }, [resources, query, kindFilter]);

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
              Médiathèque
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Mes ressources
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Vue d&apos;ensemble des fichiers attachés à vos formations et produits.
            </p>
          </div>
          <Link
            href="/vendeur/produits"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Gérer mes produits
          </Link>
        </header>

        {/* Filters bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un fichier ou un produit…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(["all", "video", "pdf", "image", "audio", "other"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${
                  kindFilter === k
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {k === "all" ? "Tous" : KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">folder_open</span>
            <p className="text-base font-bold text-slate-700 mt-3">
              {resources.length === 0 ? "Aucun fichier encore" : "Aucun résultat"}
            </p>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {resources.length === 0
                ? "Les miniatures et bannières de vos produits apparaîtront ici automatiquement."
                : "Essayez un autre terme ou retirez le filtre."}
            </p>
            {resources.length === 0 && (
              <Link
                href="/vendeur/produits/creer"
                className="inline-block px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                Créer un produit
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3">
              <strong className="text-slate-700 tabular-nums">{filtered.length}</strong> ressource{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  {r.kind === "image" ? (
                    <div className="aspect-video relative bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url} alt={r.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur">
                        {KIND_LABEL[r.kind]}
                      </span>
                    </div>
                  ) : (
                    <div className="aspect-video relative bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-emerald-600">
                        {KIND_ICON[r.kind]}
                      </span>
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                        {KIND_LABEL[r.kind]}
                      </span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {r.source === "formation" ? "Formation" : "Produit"} · {r.sourceTitle}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span className="font-mono truncate flex-1">{r.url.split("/").pop()?.slice(0, 30)}</span>
                      <span className="material-symbols-outlined text-[14px] group-hover:text-emerald-600">
                        open_in_new
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
