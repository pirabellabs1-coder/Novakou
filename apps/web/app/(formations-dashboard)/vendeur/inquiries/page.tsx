"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

type Inquiry = {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string | null;
  subject: string;
  message: string;
  status: "pending" | "replied" | "closed";
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  formation: { id: string; slug: string; title: string; thumbnail: string | null } | null;
  product: { id: string; slug: string; title: string; banner: string | null } | null;
};

type ApiResp = {
  data: Inquiry[];
  summary: { total: number; pending: number; replied: number; closed: number };
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `il y a ${m} min`;
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${d} j`;
}

export default function VendorInquiriesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "replied" | "closed">("pending");
  const [toast, setToast] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data, isLoading } = useQuery<ApiResp>({
    queryKey: ["vendeur-inquiries", filter],
    queryFn: () => fetch(`/api/formations/vendeur/inquiries?status=${filter}`).then((r) => r.json()),
    staleTime: 15_000,
  });
  const inquiries = data?.data ?? [];
  const summary = data?.summary;

  const actionMut = useMutation({
    mutationFn: async (args: { id: string; action: string; reply?: string }) => {
      const res = await fetch(`/api/formations/vendeur/inquiries/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: args.action, reply: args.reply }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: (_d, args) => {
      if (args.action === "reply") setToast("Réponse envoyée par email ✓");
      else if (args.action === "close") setToast("Marquée comme fermée");
      else setToast("Rouverte");
      qc.invalidateQueries({ queryKey: ["vendeur-inquiries"] });
      setReplyingId(null);
      setReplyText("");
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleClose(id: string) {
    const ok = await confirmAction({
      title: "Fermer sans répondre ?",
      message: "L'acheteur ne recevra pas de réponse.",
      confirmLabel: "Fermer",
      confirmVariant: "warning",
      icon: "close",
    });
    if (ok) actionMut.mutate({ id, action: "close" });
  }

  const tabs = [
    { v: "pending" as const, label: "À traiter", count: summary?.pending ?? 0, color: "bg-amber-100 text-amber-800" },
    { v: "replied" as const, label: "Répondues", count: summary?.replied ?? 0, color: "bg-emerald-100 text-emerald-800" },
    { v: "closed" as const, label: "Fermées", count: summary?.closed ?? 0, color: "bg-gray-100 text-gray-700" },
    { v: "all" as const, label: "Toutes", count: summary?.total ?? 0, color: "bg-zinc-900 text-white" },
  ];

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Questions acheteurs</h1>
        <p className="text-sm text-[#5c647a] mt-1 max-w-2xl">
          Les visiteurs peuvent vous poser une question sur chaque page produit (bouton « Une question ? »).
          Vous recevez l'email immédiatement et pouvez répondre d'ici.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.v}
            onClick={() => setFilter(t.v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === t.v ? "bg-[#191c1e] text-white" : "bg-white border border-gray-200 text-[#5c647a] hover:text-[#191c1e]"
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === t.v ? "bg-white/20" : t.color}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300">forum</span>
          <h3 className="text-lg font-bold text-[#191c1e] mt-3">Aucune question {filter === "pending" ? "à traiter" : ""}</h3>
          <p className="text-sm text-[#5c647a] mt-2">
            Les questions apparaissent ici quand des visiteurs utilisent le bouton « Une question ? » sur vos pages produit.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const productTitle = inq.formation?.title ?? inq.product?.title ?? "—";
            const isReplying = replyingId === inq.id;
            return (
              <div key={inq.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {inq.visitorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-[#191c1e]">{inq.visitorName}</p>
                      <span className="text-[11px] text-[#5c647a]">· {timeAgo(inq.createdAt)}</span>
                      {inq.status === "pending" && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">À répondre</span>
                      )}
                      {inq.status === "replied" && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">Répondue</span>
                      )}
                      {inq.status === "closed" && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase">Fermée</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5c647a]">
                      📧 {inq.visitorEmail}
                      {inq.visitorPhone && <> · 📱 {inq.visitorPhone}</>}
                    </p>
                    <p className="text-[10px] text-[#5c647a] mt-0.5">Sur : <strong>{productTitle}</strong></p>
                  </div>
                </div>

                <div className="pl-13 bg-gray-50 rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold text-[#191c1e] mb-1">{inq.subject}</p>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">{inq.message}</p>
                </div>

                {inq.reply && (
                  <div className="pl-13 bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Votre réponse (envoyée par email)</p>
                    <p className="text-sm text-emerald-900 whitespace-pre-wrap">{inq.reply}</p>
                  </div>
                )}

                {!isReplying && inq.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setReplyingId(inq.id); setReplyText(""); }}
                      className="px-4 py-2 bg-[#006e2f] text-white text-xs font-bold rounded-xl hover:bg-[#005a26]"
                    >
                      <span className="material-symbols-outlined text-[14px] align-middle mr-1">reply</span>
                      Répondre
                    </button>
                    <button
                      onClick={() => handleClose(inq.id)}
                      className="px-4 py-2 bg-gray-100 text-[#191c1e] text-xs font-bold rounded-xl hover:bg-gray-200"
                    >
                      Fermer
                    </button>
                  </div>
                )}

                {!isReplying && inq.status === "closed" && (
                  <button
                    onClick={() => actionMut.mutate({ id: inq.id, action: "reopen" })}
                    className="px-4 py-2 bg-gray-100 text-[#191c1e] text-xs font-bold rounded-xl hover:bg-gray-200"
                  >
                    Rouvrir
                  </button>
                )}

                {isReplying && (
                  <div className="space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={5}
                      placeholder="Votre réponse — sera envoyée par email avec reply-to = votre email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setReplyingId(null); setReplyText(""); }}
                        className="px-4 py-2 bg-gray-100 text-[#191c1e] text-xs font-bold rounded-xl"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => actionMut.mutate({ id: inq.id, action: "reply", reply: replyText })}
                        disabled={actionMut.isPending || replyText.trim().length < 10}
                        className="px-5 py-2 bg-[#006e2f] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                      >
                        {actionMut.isPending ? "Envoi…" : "Envoyer la réponse"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
