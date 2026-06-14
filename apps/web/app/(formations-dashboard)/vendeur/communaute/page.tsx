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
  StCard,
  StPageHeader,
  StKpiCompact,
  StSectionTitle,
  StAvatar,
  ST,
} from "@/components/stitch";

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      {toast && (
        <div className="fixed top-20 right-6 z-50 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl rounded-lg" style={{ background: ST.greenDark }}>
          {toast}
        </div>
      )}

      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StPageHeader
          title="Ma Communauté"
          subtitle="Animez et modérez votre espace apprenant"
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact
            label="Apprenants inscrits"
            value={isLoading ? "…" : stats?.totalMembers ?? 0}
            icon={Users}
            tone="green"
          />
          <StKpiCompact
            label={`Posts ce mois · ${stats?.totalPosts ?? 0} au total`}
            value={isLoading ? "…" : stats?.postsThisMonth ?? 0}
            icon={FileText}
            tone="blue"
          />
          <StKpiCompact
            label="Taux d'engagement"
            value={isLoading ? "…" : `${stats?.engagement ?? 0}%`}
            icon={ThumbsUp}
            tone="amber"
          />
        </div>

        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4" style={{ color: ST.amberText }} />
              <h2 className="text-[13px] font-extrabold uppercase tracking-wide" style={{ color: ST.text }}>Épinglés</h2>
            </div>
            <div className="space-y-3">
              {pinned.map((p) => (
                <div key={p.id} className="rounded-[18px] p-4" style={{ background: "#fdf8ec", border: "1px solid #f3e2bd" }}>
                  <div className="flex items-start gap-3">
                    <StAvatar name={p.user.name ?? p.user.email} src={p.user.image} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-extrabold truncate" style={{ color: ST.text }}>{p.title}</p>
                      <p className="text-[12px] font-medium line-clamp-2 mt-0.5" style={{ color: ST.textSecondary }}>{p.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>
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
              ))}
            </div>
          </div>
        )}

        {/* All posts */}
        <StCard noPadding>
          <div className="px-5 pt-5 pb-3">
            <StSectionTitle className="!mb-0">Discussions récentes</StSectionTitle>
            <p className="text-[12px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>{regular.length} post{regular.length !== 1 ? "s" : ""}</p>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded animate-pulse" style={{ background: "#f3f6f4" }} />)}
            </div>
          ) : regular.length === 0 ? (
            <div className="text-center py-12 px-6">
              <MessagesSquare size={44} style={{ color: "#d6e0da" }} className="mx-auto" />
              <h3 className="text-[15px] font-extrabold mt-3" style={{ color: ST.text }}>Aucune discussion pour l&apos;instant</h3>
              <p className="text-[12.5px] font-semibold mt-1.5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                {stats?.totalMembers === 0
                  ? "Publiez un produit pour attirer des apprenants et lancer la conversation."
                  : "Vos apprenants n'ont pas encore posé de questions. Ouvrez la discussion !"}
              </p>
            </div>
          ) : (
            <div>
              {regular.map((p, idx) => (
                <div key={p.id} className="p-5" style={idx ? { borderTop: `1px solid ${ST.divider}` } : undefined}>
                  <div className="flex items-start gap-3">
                    <StAvatar name={p.user.name ?? p.user.email} src={p.user.image} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>{p.user.name ?? p.user.email}</p>
                        <span className="text-[10.5px]" style={{ color: ST.textFaint }}>·</span>
                        <span className="text-[10.5px] font-semibold" style={{ color: ST.textFaint }}>{timeAgo(p.createdAt)}</span>
                        {p.reportCount > 0 && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full" style={{ background: ST.roseSoft, color: ST.roseText }}>
                            {p.reportCount} signal.
                          </span>
                        )}
                      </div>
                      <p className="text-[13.5px] font-extrabold mb-1" style={{ color: ST.text }}>{p.title}</p>
                      <p className="text-[12px] font-medium line-clamp-2" style={{ color: ST.textSecondary }}>{p.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] font-semibold" style={{ color: ST.textSecondary }}>
                        <span className="inline-flex items-center gap-1">
                          <Book className="w-3 h-3" />
                          {p.formation.title}
                        </span>
                        <span className="inline-flex items-center gap-1">
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
              ))}
            </div>
          )}
        </StCard>
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
    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => onAction(post.isPinned ? "unpin" : "pin")}
        className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-1 rounded-md disabled:opacity-50 transition-colors hover:bg-[#fdf3df]"
        style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
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
        className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-1 rounded-md disabled:opacity-50 transition-colors hover:bg-[#fceef2]"
        style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
        title="Supprimer ce post (soft-delete)"
      >
        <Trash2 className="w-3 h-3" />
        Supprimer
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => onAction("report")}
        className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-1 rounded-md disabled:opacity-50 transition-colors hover:bg-[#fdf3df]"
        style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
        title="Signaler ce post à l'admin Novakou"
      >
        <Flag className="w-3 h-3" />
        Reporter
      </button>
    </div>
  );
}
