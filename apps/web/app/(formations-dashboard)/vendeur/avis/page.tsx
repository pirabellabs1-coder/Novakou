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
  StCard,
  StPageHeader,
  StButton,
  StKpiCompact,
  StAvatar,
  ST,
} from "@/components/stitch";

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StPageHeader
          title="Avis de vos clients"
          subtitle="Répondez aux avis pour montrer que vous écoutez et booster vos ventes"
        />

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
            <StKpiCompact
              label={`Note moyenne · ${Math.round(stats.avgRating)}/5 étoiles`}
              value={stats.avgRating.toFixed(1)}
              icon={Star}
              tone="amber"
            />
            <StKpiCompact
              label="Total avis"
              value={stats.total.toLocaleString("fr-FR")}
              icon={MessageSquare}
              tone="blue"
            />
            <StKpiCompact
              label="Sans réponse"
              value={stats.unansweredCount}
              icon={Inbox}
              tone={stats.unansweredCount > 0 ? "rose" : "green"}
            />
            <StKpiCompact
              label="5 étoiles"
              value={stats.distribution.find((d) => d.star === 5)?.count ?? 0}
              icon={Star}
              tone="green"
            />
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <StButton
            variant={filter === "all" ? "dark" : "secondary"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Tous les avis
          </StButton>
          <StButton
            variant={filter === "unanswered" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("unanswered")}
          >
            Sans réponse {stats && stats.unansweredCount > 0 ? `(${stats.unansweredCount})` : ""}
          </StButton>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-[18px] animate-pulse" style={{ background: "#f3f6f4" }} />)}
          </div>
        ) : reviews.length === 0 ? (
          <StCard className="text-center py-12">
            <MessageSquare size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
            <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>
              {filter === "unanswered" ? "Tous vos avis ont une réponse" : "Aucun avis pour le moment"}
            </h3>
            <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              {filter === "unanswered"
                ? "Continuez à encourager vos clients à laisser un avis pour améliorer votre visibilité."
                : "Vos clients verront leurs formations ou produits après achat et pourront laisser un avis."}
            </p>
          </StCard>
        ) : (
          <div className="space-y-3.5">
            {reviews.map((r) => (
              <StCard key={r.id}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <StAvatar name={r.author.name || r.author.email} src={r.author.image} size={40} />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-extrabold truncate" style={{ color: ST.text }}>{r.author.name || r.author.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Stars n={r.rating} />
                        <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: ST.textFaint }}>
                          {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={r.type === "formation" ? `/formation/${r.target.slug}` : `/produit/${r.target.slug}`}
                    target="_blank"
                    className="text-[12px] font-extrabold hover:underline inline-flex items-center gap-1 flex-shrink-0"
                    style={{ color: ST.green }}
                  >
                    {r.type === "formation" ? <GraduationCap size={14} /> : <ShoppingBag size={14} />}
                    <span className="truncate max-w-[200px]">{r.target.title}</span>
                  </Link>
                </div>

                <p className="text-[13.5px] font-medium leading-relaxed whitespace-pre-wrap mb-4" style={{ color: "#33453b" }}>{r.comment}</p>

                {/* Existing response */}
                {r.response && respondingId !== r.id && (
                  <div className="rounded-[12px] p-4 mb-3" style={{ background: ST.greenSoft, borderLeft: `4px solid ${ST.greenBright}` }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.green }}>
                      Votre réponse · {r.respondedAt && new Date(r.respondedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: ST.greenDark }}>{r.response}</p>
                  </div>
                )}

                {/* Response editor */}
                {respondingId === r.id ? (
                  <div className="rounded-[12px] p-4" style={{ background: "#f6f9f7", border: `1px solid ${ST.cardBorder}` }}>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: ST.textLabel }}>
                      {r.response ? "Modifier votre réponse" : "Votre réponse publique"}
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Merci pour votre retour..."
                      maxLength={2000}
                      rows={3}
                      className="w-full px-3 py-2 rounded-[10px] bg-white text-[13.5px] font-medium focus:outline-none"
                      style={{ color: "#33453b", border: "1px solid #dde6e0" }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] font-semibold tabular-nums" style={{ color: ST.textMuted }}>{responseText.length}/2000</p>
                      <div className="flex items-center gap-2">
                        <StButton
                          variant="secondary"
                          size="sm"
                          onClick={() => { setRespondingId(null); setResponseText(""); }}
                          disabled={saving}
                        >
                          Annuler
                        </StButton>
                        <StButton
                          size="sm"
                          onClick={() => saveResponse(r)}
                          disabled={saving}
                        >
                          {saving ? "Enregistrement…" : r.response ? "Mettre à jour" : "Publier"}
                        </StButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openResponder(r)}
                    className="text-[12px] font-extrabold hover:underline inline-flex items-center gap-1"
                    style={{ color: ST.green }}
                  >
                    <Reply size={14} />
                    {r.response ? "Modifier ma réponse" : "Répondre à cet avis"}
                  </button>
                )}
              </StCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
