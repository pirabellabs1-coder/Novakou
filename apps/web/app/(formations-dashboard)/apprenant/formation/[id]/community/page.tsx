"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Discussion = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
  _count: { replies: number };
};

type Reply = {
  id: string;
  content: string;
  isInstructor: boolean;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  const h = Math.floor(d / 3600000);
  const day = Math.floor(d / 86400000);
  if (m < 60) return `${m} min`;
  if (h < 24) return `${h} h`;
  return `${day} j`;
}

export default function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formationId } = use(params);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [openedDiscId, setOpenedDiscId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: discussions, isLoading } = useQuery<{ data: Discussion[] }>({
    queryKey: ["community", formationId],
    queryFn: () => fetch(`/api/formations/apprenant/community?formationId=${formationId}`).then((r) => r.json()),
    staleTime: 15_000,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/formations/apprenant/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId, title, content }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community", formationId] });
      setShowCreate(false);
      setTitle(""); setContent("");
    },
  });

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <Link href={`/apprenant/formation/${formationId}`} className="text-xs font-semibold text-[#5c647a] hover:text-[#191c1e] inline-flex items-center gap-1 mb-4">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Retour à la formation
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Communauté</h1>
          <p className="text-sm text-[#5c647a] mt-1">Échangez avec l'instructeur et les autres apprenants.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-bold inline-flex items-center gap-2"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouvelle discussion
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : (discussions?.data ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300">forum</span>
          <h3 className="text-lg font-bold text-[#191c1e] mt-3">Aucune discussion encore</h3>
          <p className="text-sm text-[#5c647a] mt-2">Soyez le premier à poser une question ou partager un retour.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(discussions?.data ?? []).map((d) => (
            <DiscussionCard
              key={d.id}
              discussion={d}
              isOpen={openedDiscId === d.id}
              onToggle={() => setOpenedDiscId(openedDiscId === d.id ? null : d.id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => !createMut.isPending && setShowCreate(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold text-[#191c1e] mb-4">Nouvelle discussion</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de votre question"
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Décrivez votre question en détail…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              {createMut.isError && (
                <div className="px-3 py-2 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-800">
                  {(createMut.error as Error).message}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} disabled={createMut.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-[#191c1e] text-sm font-bold">
                  Annuler
                </button>
                <button
                  onClick={() => createMut.mutate()}
                  disabled={createMut.isPending || title.trim().length < 5 || content.trim().length < 10}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                  {createMut.isPending ? "Envoi…" : "Publier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscussionCard({
  discussion, isOpen, onToggle,
}: { discussion: Discussion; isOpen: boolean; onToggle: () => void }) {
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState("");

  const { data: repliesData } = useQuery<{ data: Reply[]; isInstructor: boolean }>({
    queryKey: ["community-replies", discussion.id],
    queryFn: () => fetch(`/api/formations/apprenant/community/${discussion.id}/replies`).then((r) => r.json()),
    enabled: isOpen,
  });

  const replyMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/formations/apprenant/community/${discussion.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-replies", discussion.id] });
      qc.invalidateQueries({ queryKey: ["community"] });
      setReplyText("");
    },
  });

  const initial = (discussion.user.name || "U").charAt(0).toUpperCase();

  return (
    <div className={`bg-white rounded-2xl border transition-all ${isOpen ? "border-[#006e2f]/30 shadow-md" : "border-gray-100"}`}>
      <button onClick={onToggle} className="w-full text-left p-5">
        <div className="flex items-start gap-3">
          {discussion.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={discussion.user.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-[#191c1e]">{discussion.user.name ?? "Apprenant"}</p>
              <span className="text-[11px] text-[#5c647a]">· {timeAgo(discussion.createdAt)}</span>
              {discussion.isPinned && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">📌 Épinglé</span>
              )}
              {discussion.isResolved && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">✓ Résolu</span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-[#191c1e] mb-1">{discussion.title}</h3>
            {!isOpen && (
              <p className="text-sm text-[#5c647a] line-clamp-2">{discussion.content}</p>
            )}
          </div>
          <div className="flex flex-col items-center text-[11px] text-[#5c647a] flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span className="font-bold">{discussion._count.replies}</span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="my-4 pl-13">
            <p className="text-sm text-[#191c1e] whitespace-pre-wrap">{discussion.content}</p>
          </div>

          {/* Replies */}
          <div className="space-y-3 pl-13">
            {(repliesData?.data ?? []).map((r) => {
              const rInit = (r.user.name || "U").charAt(0).toUpperCase();
              return (
                <div key={r.id} className={`flex items-start gap-3 ${r.isInstructor ? "bg-[#006e2f]/5 -mx-3 p-3 rounded-xl border border-[#006e2f]/15" : ""}`}>
                  {r.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.user.image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${r.isInstructor ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-gray-400 to-gray-500"}`}>
                      {rInit}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-xs font-bold text-[#191c1e]">{r.user.name ?? "Membre"}</p>
                      {r.isInstructor && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">Instructeur</span>
                      )}
                      <span className="text-[10px] text-[#5c647a]">· {timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#374151] whitespace-pre-wrap">{r.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply form */}
          <div className="pl-13 mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && replyText.trim().length >= 3) replyMut.mutate(); }}
                placeholder="Écrire une réponse…"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <button
                onClick={() => replyMut.mutate()}
                disabled={replyMut.isPending || replyText.trim().length < 3}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                {replyMut.isPending ? "…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
