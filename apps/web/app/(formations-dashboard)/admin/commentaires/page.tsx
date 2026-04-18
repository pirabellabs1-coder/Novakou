"use client";

import { useQuery } from "@tanstack/react-query";

type Review = {
  id: string;
  rating: number;
  comment: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  user: { name: string | null; email: string; image: string | null };
  formation: {
    id: string;
    title: string;
    instructeur: { user: { name: string | null } };
  };
};

type Summary = {
  total: number;
  withResponse: number;
  withoutResponse: number;
  avgRating: number;
  ratingDist: { star: number; count: number }[];
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "AUJOURD'HUI";
  if (d === 1) return "HIER";
  if (d < 30) return `${d}J`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`material-symbols-outlined text-[14px] ${n <= Math.round(rating) ? "text-[#22c55e]" : "text-zinc-200"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function AdminCommentairesPage() {
  const { data: response, isLoading } = useQuery<{ data: Review[]; summary: Summary | null }>({
    queryKey: ["admin-commentaires"],
    queryFn: () => fetch("/api/formations/admin/commentaires").then((r) => r.json()),
    staleTime: 15_000,
  });

  const reviews = response?.data ?? [];
  const summary = response?.summary;
  const maxCount = Math.max(...(summary?.ratingDist ?? []).map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1400px] mx-auto">
        <header className="mb-12">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
            Moderation Center
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">Commentaires &amp; Avis</h1>
          <p className="text-sm text-zinc-500 mt-3">
            {isLoading ? "Chargement…" : `${summary?.total ?? 0} avis · Note moyenne ${summary?.avgRating.toFixed(2) ?? "0"}/5`}
          </p>
        </header>

        {/* Top bento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Rating distribution */}
          <div className="lg:col-span-2 bg-white p-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1 block">Distribution</span>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Répartition des notes</h3>

            {isLoading ? (
              <div className="space-y-3">{[0,1,2,3,4].map((i) => <div key={i} className="h-5 bg-[#f3f3f4] animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {(summary?.ratingDist ?? []).map((row) => {
                  const pct = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
                  return (
                    <div key={row.star} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm font-extrabold tabular-nums text-zinc-900">{row.star}</span>
                        <span className="material-symbols-outlined text-[14px] text-[#22c55e]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                      <div className="flex-1 h-[2px] bg-zinc-100">
                        <div className="h-full bg-[#22c55e] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-zinc-400 w-10 text-right font-bold">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-rows-2 gap-6">
            <div className="bg-[#22c55e] p-6 text-[#004b1e]">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Avec réponse</p>
              <p className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight break-all">
                {isLoading ? "…" : summary?.withResponse ?? 0}
              </p>
            </div>
            <div className="bg-zinc-900 p-6 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Sans réponse</p>
              <p className="text-lg md:text-xl font-extrabold tabular-nums tracking-tight break-all">
                {isLoading ? "…" : summary?.withoutResponse ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <section>
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6 border-l-4 border-[#22c55e] pl-4">
            Tous les avis
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-32 bg-white animate-pulse" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white p-16 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucun avis</p>
              <p className="text-sm text-zinc-500">Les avis laissés par les apprenants apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => {
                const initials = (r.user.name ?? r.user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={r.id} className="bg-white p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      {r.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.user.image} alt="" className="w-10 h-10 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <p className="text-sm font-bold text-zinc-900">{r.user.name ?? r.user.email}</p>
                          <Stars rating={r.rating} />
                          <span className="text-[9px] tabular-nums text-zinc-400 uppercase tracking-widest">
                            {timeAgo(r.createdAt)}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          Sur &laquo; {r.formation.title} &raquo;
                        </p>
                      </div>
                      {!r.response && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-400 text-amber-900 flex-shrink-0">
                          Sans réponse
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed mb-4">{r.comment}</p>
                    {r.response && (
                      <div className="ml-14 pl-4 border-l-2 border-[#22c55e]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1">
                          Réponse · {r.formation.instructeur.user.name ?? "Instructeur"}
                        </p>
                        <p className="text-xs text-zinc-600 leading-relaxed">{r.response}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
