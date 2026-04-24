"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/toast";

interface Review {
  id: string;
  type: "formation" | "product";
  rating: number;
  comment: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  author: { id: string; name: string | null; email: string; image: string | null };
  target: { id: string; title: string; slug: string };
}

interface Stats {
  total: number;
  avgRating: number;
  unansweredCount: number;
  distribution: { star: number; count: number }[];
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`material-symbols-outlined ${s <= n ? "text-amber-400" : "text-zinc-200"}`}
          style={{ fontSize: size, fontVariationSettings: s <= n ? "'FILL' 1" : undefined }}
        >
          star
        </span>
      ))}
    </span>
  );
}

export default function AvisPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unanswered">("all");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToastStore.getState().addToast;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/vendeur/reviews${filter === "unanswered" ? "?unanswered=1" : ""}`);
      const j = await res.json();
      setReviews(j.data?.reviews ?? []);
      setStats(j.data?.stats ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function saveResponse(r: Review) {
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/vendeur/reviews/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: r.type, response: responseText.trim() }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error || "Erreur lors de l'enregistrement");
        return;
      }
      toast("success", responseText.trim() ? "Réponse publiée ✓" : "Réponse supprimée");
      setRespondingId(null);
      setResponseText("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  function openResponder(r: Review) {
    setRespondingId(r.id);
    setResponseText(r.response || "");
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1200px] mx-auto">
        <header className="mb-10">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Communauté
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">Avis de vos clients</h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-xl">
            Consultez tous les avis laissés sur vos formations et produits.
            Répondez pour montrer que vous écoutez vos clients — c&apos;est excellent pour les nouvelles ventes.
          </p>
        </header>

        {/* Stats KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Note moyenne</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-xl font-extrabold text-zinc-900 tabular-nums">{stats.avgRating.toFixed(1)}</p>
                <Stars n={Math.round(stats.avgRating)} size={14} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total avis</p>
              <p className="text-xl font-extrabold text-zinc-900 tabular-nums mt-2">{stats.total.toLocaleString("fr-FR")}</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sans réponse</p>
              <p className="text-xl font-extrabold text-amber-600 tabular-nums mt-2">{stats.unansweredCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">5 étoiles</p>
              <p className="text-xl font-extrabold text-emerald-600 tabular-nums mt-2">
                {stats.distribution.find((d) => d.star === 5)?.count ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === "all" ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Tous les avis
          </button>
          <button
            onClick={() => setFilter("unanswered")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === "unanswered" ? "bg-amber-500 text-white" : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Sans réponse {stats && stats.unansweredCount > 0 && `(${stats.unansweredCount})`}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-zinc-100 animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-300">reviews</span>
            <h3 className="text-lg font-bold text-zinc-900 mt-4">
              {filter === "unanswered" ? "Tous vos avis ont une réponse 🎉" : "Aucun avis pour le moment"}
            </h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
              {filter === "unanswered"
                ? "Continuez à encourager vos clients satisfaits à laisser un avis pour améliorer votre visibilité."
                : "Vos clients verront leurs formations/produits après achat et pourront laisser un avis qui apparaîtra ici."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-zinc-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {r.author.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.author.image} alt={r.author.name || ""} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(r.author.name || r.author.email)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">{r.author.name || r.author.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Stars n={r.rating} />
                        <span className="text-xs text-zinc-400 tabular-nums">
                          {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={r.type === "formation" ? `/formation/${r.target.slug}` : `/produit/${r.target.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-[#006e2f] hover:underline inline-flex items-center gap-1 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">{r.type === "formation" ? "school" : "shopping_bag"}</span>
                    {r.target.title}
                  </Link>
                </div>

                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap mb-4">{r.comment}</p>

                {/* Existing response */}
                {r.response && respondingId !== r.id && (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">
                      Votre réponse · {r.respondedAt && new Date(r.respondedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">{r.response}</p>
                  </div>
                )}

                {/* Response editor */}
                {respondingId === r.id ? (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
                      {r.response ? "Modifier votre réponse" : "Votre réponse publique"}
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Merci pour votre retour..."
                      maxLength={2000}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 focus:border-[#006e2f]"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] text-zinc-400 tabular-nums">{responseText.length}/2000</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setRespondingId(null); setResponseText(""); }}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => saveResponse(r)}
                          disabled={saving}
                          className="px-4 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                        >
                          {saving ? "Enregistrement…" : r.response ? "Mettre à jour" : "Publier la réponse"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openResponder(r)}
                    className="text-xs font-bold text-[#006e2f] hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">reply</span>
                    {r.response ? "Modifier ma réponse" : "Répondre à cet avis"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
