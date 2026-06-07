"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/toast";
import {
  MessageSquare,
  Star,
  Reply,
  GraduationCap,
  ShoppingBag,
  Inbox,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaEmpty,
} from "@/components/kaza";

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
        <Star
          key={s}
          size={size}
          className={s <= n ? "text-amber-400 fill-amber-400" : "text-slate-200"}
        />
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
      toast("success", responseText.trim() ? "Réponse publiée" : "Réponse supprimée");
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
    <div className="p-5 md:p-8 max-w-[1200px] mx-auto space-y-6" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <KazaHero
        badge="Pro"
        badgeColor="orange"
        title="Avis de vos clients"
        subtitle="Répondez aux avis pour montrer que vous écoutez et booster vos ventes"
        icon={MessageSquare}
      />

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KazaKpiCard
            label="Note moyenne"
            value={stats.avgRating.toFixed(1)}
            delta={`${Math.round(stats.avgRating)}/5 étoiles`}
            icon={Star}
            iconColor="orange"
          />
          <KazaKpiCard
            label="Total avis"
            value={stats.total.toLocaleString("fr-FR")}
            icon={MessageSquare}
            iconColor="sky"
          />
          <KazaKpiCard
            label="Sans réponse"
            value={stats.unansweredCount}
            icon={Inbox}
            iconColor={stats.unansweredCount > 0 ? "rose" : "emerald"}
          />
          <KazaKpiCard
            label="5 étoiles"
            value={stats.distribution.find((d) => d.star === 5)?.count ?? 0}
            icon={Star}
            iconColor="emerald"
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === "all" ? "bg-[#0b2540] text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Tous les avis
        </button>
        <button
          onClick={() => setFilter("unanswered")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            filter === "unanswered" ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Sans réponse {stats && stats.unansweredCount > 0 && `(${stats.unansweredCount})`}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <KazaEmpty
          icon={MessageSquare}
          title={filter === "unanswered" ? "Tous vos avis ont une réponse" : "Aucun avis pour le moment"}
          description={
            filter === "unanswered"
              ? "Continuez à encourager vos clients à laisser un avis pour améliorer votre visibilité."
              : "Vos clients verront leurs formations ou produits après achat et pourront laisser un avis."
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <KazaCard key={r.id}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  {r.author.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.author.image} alt={r.author.name || ""} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(r.author.name || r.author.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{r.author.name || r.author.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars n={r.rating} />
                      <span className="text-xs text-slate-400 tabular-nums">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={r.type === "formation" ? `/formation/${r.target.slug}` : `/produit/${r.target.slug}`}
                  target="_blank"
                  className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 flex-shrink-0"
                >
                  {r.type === "formation" ? <GraduationCap size={14} /> : <ShoppingBag size={14} />}
                  <span className="truncate max-w-[200px]">{r.target.title}</span>
                </Link>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{r.comment}</p>

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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                    {r.response ? "Modifier votre réponse" : "Votre réponse publique"}
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Merci pour votre retour..."
                    maxLength={2000}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] text-slate-400 tabular-nums">{responseText.length}/2000</p>
                    <div className="flex items-center gap-2">
                      <KazaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => { setRespondingId(null); setResponseText(""); }}
                        disabled={saving}
                      >
                        Annuler
                      </KazaButton>
                      <KazaButton
                        variant="primary"
                        size="sm"
                        onClick={() => saveResponse(r)}
                        disabled={saving}
                      >
                        {saving ? "Enregistrement…" : r.response ? "Mettre à jour" : "Publier"}
                      </KazaButton>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openResponder(r)}
                  className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                >
                  <Reply size={14} />
                  {r.response ? "Modifier ma réponse" : "Répondre à cet avis"}
                </button>
              )}
            </KazaCard>
          ))}
        </div>
      )}
    </div>
  );
}
