"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  FileText,
  ThumbsUp,
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Flag,
  Book,
  MessagesSquare,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaEmpty,
} from "@/components/kaza";

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
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery<{ data: { posts: Post[]; stats: Stats | null } }>({
    queryKey: ["vendeur-communaute"],
    queryFn: () => fetch("/api/formations/vendeur/communaute").then((r) => r.json()),
    staleTime: 30_000,
  });

  const moderateMut = useMutation({
    mutationFn: async (args: { discussionId: string; action: "pin" | "unpin" | "delete" | "report" }) => {
      const res = await fetch("/api/formations/vendeur/communaute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return { ...j, action: args.action };
    },
    onSuccess: (data: { action: string }) => {
      const msg =
        data.action === "delete" ? "Post supprimé"
        : data.action === "pin" ? "Post épinglé"
        : data.action === "unpin" ? "Épingle retirée"
        : "Post signalé";
      setToast(msg);
      qc.invalidateQueries({ queryKey: ["vendeur-communaute"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => {
      setToast(`Erreur : ${e.message}`);
      setTimeout(() => setToast(null), 4000);
    },
  });

  const posts = response?.data?.posts ?? [];
  const stats = response?.data?.stats;
  const pinned = posts.filter((p) => p.isPinned);
  const regular = posts.filter((p) => !p.isPinned);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl rounded-lg">
          {toast}
        </div>
      )}

      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto space-y-8">
        <KazaHero
          badge="Pro"
          badgeColor="orange"
          icon={MessagesSquare}
          title="Ma Communauté"
          subtitle="Animez et modérez votre espace apprenant"
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KazaKpiCard
            label="Apprenants inscrits"
            value={isLoading ? "…" : stats?.totalMembers ?? 0}
            delta="Tous produits confondus"
            icon={Users}
            iconColor="emerald"
          />
          <KazaKpiCard
            label="Posts ce mois"
            value={isLoading ? "…" : stats?.postsThisMonth ?? 0}
            delta={`${stats?.totalPosts ?? 0} posts au total`}
            icon={FileText}
            iconColor="sky"
          />
          <KazaKpiCard
            label="Taux d'engagement"
            value={isLoading ? "…" : `${stats?.engagement ?? 0}%`}
            delta="Posts + réponses / apprenants"
            icon={ThumbsUp}
            iconColor="violet"
          />
        </div>

        {/* Pinned */}
        {pinned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Épinglés</h2>
            </div>
            <div className="space-y-3">
              {pinned.map((p, idx) => {
                const initials = (p.user.name ?? p.user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={p.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
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
                        <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{p.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span>{p.formation.title}</span>
                          <span>·</span>
                          <span>{timeAgo(p.createdAt)}</span>
                          <span>·</span>
                          <span>{p._count.replies} réponse{p._count.replies !== 1 ? "s" : ""}</span>
                        </div>
                        {p.status === "active" && (
                          <ModerationActions
                            post={p}
                            isPending={moderateMut.isPending}
                            onAction={(action) => moderateMut.mutate({ discussionId: p.id, action })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All posts */}
        <KazaCard
          title="Discussions récentes"
          subtitle={`${regular.length} post${regular.length !== 1 ? "s" : ""}`}
          noPadding
        >
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-slate-50 rounded animate-pulse" />)}
            </div>
          ) : regular.length === 0 ? (
            <div className="p-6">
              <KazaEmpty
                icon={MessagesSquare}
                title="Aucune discussion pour l'instant"
                description={
                  stats?.totalMembers === 0
                    ? "Publiez un produit pour attirer des apprenants et lancer la conversation."
                    : "Vos apprenants n'ont pas encore posé de questions. Ouvrez la discussion !"
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {regular.map((p, idx) => {
                const initials = (p.user.name ?? p.user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={p.id} className="p-5 hover:bg-slate-50/30 transition-colors">
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
                          <p className="text-sm font-semibold text-slate-900">{p.user.name ?? p.user.email}</p>
                          <span className="text-[10px] text-slate-500">·</span>
                          <span className="text-[10px] text-slate-500">{timeAgo(p.createdAt)}</span>
                          {p.reportCount > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600">
                              {p.reportCount} signal.
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-1">{p.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{p.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-[11px]">
                          <span className="text-slate-500 inline-flex items-center gap-1">
                            <Book className="w-3 h-3" />
                            {p.formation.title}
                          </span>
                          <span className="text-slate-500 inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {p._count.replies}
                          </span>
                        </div>
                        {p.status === "active" && (
                          <ModerationActions
                            post={p}
                            isPending={moderateMut.isPending}
                            onAction={(action) => moderateMut.mutate({ discussionId: p.id, action })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </KazaCard>
      </main>
    </div>
  );
}

function ModerationActions({
  post,
  isPending,
  onAction,
}: {
  post: Post;
  isPending: boolean;
  onAction: (action: "pin" | "unpin" | "delete" | "report") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
      <button
        type="button"
        disabled={isPending}
        onClick={() => onAction(post.isPinned ? "unpin" : "pin")}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 disabled:opacity-50 transition-colors"
        title={post.isPinned ? "Désépingler ce post" : "Épingler ce post en haut"}
      >
        {post.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
        {post.isPinned ? "Désépingler" : "Épingler"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (window.confirm(`Supprimer le post "${post.title}" ? Cette action est irréversible.`)) {
            onAction("delete");
          }
        }}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-50 transition-colors"
        title="Supprimer ce post (soft-delete)"
      >
        <Trash2 className="w-3 h-3" />
        Supprimer
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => onAction("report")}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 disabled:opacity-50 transition-colors"
        title="Signaler ce post à l'admin Novakou"
      >
        <Flag className="w-3 h-3" />
        Reporter
      </button>
    </div>
  );
}
