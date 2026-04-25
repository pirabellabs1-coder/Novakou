"use client";

import { useQuery } from "@tanstack/react-query";

type Post = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isResolved: boolean;
  status: string;
  reportCount: number;
  createdAt: string;
  user: { name: string | null; email: string; image: string | null };
  formation: { id: string; title: string };
  _count: { replies: number };
};

type Stats = { totalMembers: number; postsThisMonth: number; totalPosts: number; engagement: number };

const GRADIENTS = ["from-violet-400 to-purple-600","from-blue-400 to-sky-600","from-pink-400 to-rose-500","from-amber-400 to-orange-500","from-teal-400 to-emerald-600"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `Il y a ${m}m`;
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${d}j`;
}

export default function CommunautePage() {
  const { data: response, isLoading } = useQuery<{ data: { posts: Post[]; stats: Stats | null } }>({
    queryKey: ["vendeur-communaute"],
    queryFn: () => fetch("/api/formations/vendeur/communaute").then((r) => r.json()),
    staleTime: 30_000,
  });

  const posts = response?.data?.posts ?? [];
  const stats = response?.data?.stats;
  const pinned = posts.filter((p) => p.isPinned);
  const regular = posts.filter((p) => !p.isPinned);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Ma Communauté</h1>
          <p className="text-sm text-[#5c647a] mt-1">Animez et modérez votre espace apprenant</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: "group",
            label: "Apprenants inscrits",
            value: stats?.totalMembers ?? 0,
            sub: "Tous produits confondus",
            bg: "bg-[#006e2f]/10",
            color: "text-[#006e2f]",
          },
          {
            icon: "article",
            label: "Posts ce mois",
            value: stats?.postsThisMonth ?? 0,
            sub: `${stats?.totalPosts ?? 0} posts au total`,
            bg: "bg-blue-50",
            color: "text-blue-600",
          },
          {
            icon: "thumb_up",
            label: "Taux d'engagement",
            value: `${stats?.engagement ?? 0}%`,
            sub: "Posts + réponses / apprenants",
            bg: "bg-purple-50",
            color: "text-purple-600",
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {kpi.icon}
              </span>
            </div>
            <p className="text-xl font-extrabold text-[#191c1e]">{isLoading ? "…" : kpi.value}</p>
            <p className="text-[11px] text-[#5c647a]">{kpi.label}</p>
            <p className="text-[10px] text-[#5c647a] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
            <h2 className="text-sm font-bold text-[#191c1e] uppercase tracking-wide">Épinglés</h2>
          </div>
          <div className="space-y-3">
            {pinned.map((p, idx) => {
              const initials = (p.user.name ?? p.user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={p.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    {p.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.user.image} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#191c1e] truncate">{p.title}</p>
                      <p className="text-xs text-[#5c647a] line-clamp-2 mt-0.5">{p.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[#5c647a]">
                        <span>{p.formation.title}</span>
                        <span>·</span>
                        <span>{timeAgo(p.createdAt)}</span>
                        <span>·</span>
                        <span>{p._count.replies} réponse{p._count.replies !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All posts */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#191c1e]">Discussions récentes</h2>
          <span className="text-xs text-[#5c647a]">{regular.length} post{regular.length !== 1 ? "s" : ""}</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-gray-50 rounded animate-pulse" />)}
          </div>
        ) : regular.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[28px] text-gray-300">forum</span>
            </div>
            <p className="font-semibold text-[#191c1e]">Aucune discussion pour l&apos;instant</p>
            <p className="text-sm text-[#5c647a] mt-1">
              {stats?.totalMembers === 0
                ? "Publiez un produit pour attirer des apprenants et lancer la conversation."
                : "Vos apprenants n'ont pas encore posé de questions. Ouvrez la discussion !"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {regular.map((p, idx) => {
              const initials = (p.user.name ?? p.user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={p.id} className="p-5 hover:bg-gray-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    {p.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.user.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-[#191c1e]">{p.user.name ?? p.user.email}</p>
                        <span className="text-[10px] text-[#5c647a]">·</span>
                        <span className="text-[10px] text-[#5c647a]">{timeAgo(p.createdAt)}</span>
                        {p.reportCount > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                            {p.reportCount} signal.
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#191c1e] mb-1">{p.title}</p>
                      <p className="text-xs text-[#5c647a] line-clamp-2">{p.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-[11px]">
                        <span className="text-[#5c647a]">
                          <span className="material-symbols-outlined text-[13px] align-middle mr-1">book</span>
                          {p.formation.title}
                        </span>
                        <span className="text-[#5c647a]">
                          <span className="material-symbols-outlined text-[13px] align-middle mr-1">comment</span>
                          {p._count.replies}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
