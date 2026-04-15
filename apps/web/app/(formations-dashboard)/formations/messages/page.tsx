"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConversationItem {
  id: string;
  type: string;
  title: string | null;
  otherUser: { id: string; name: string | null; email: string | null; image: string | null } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    fromMe: boolean;
    read: boolean;
    type: string;
    fileName: string | null;
  } | null;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m}min`;
  if (h < 24) return `${h}h`;
  if (d === 1) return "Hier";
  if (d < 7) return `${d}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function lastMsgPreview(msg: ConversationItem["lastMessage"]) {
  if (!msg) return "Démarrer la conversation";
  if (msg.type === "FILE") return `📎 ${msg.fileName ?? "Fichier"}`;
  if (msg.type === "IMAGE") return "🖼️ Image";
  return msg.fromMe ? `Vous: ${msg.content}` : msg.content;
}

// ─── Conversation List Item ────────────────────────────────────────────────────
function ConvItem({ conv, onClick }: { conv: ConversationItem; onClick: () => void }) {
  const isUnread = conv.lastMessage && !conv.lastMessage.fromMe && !conv.lastMessage.read;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${
        isUnread ? "bg-green-50/40" : ""
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-sm font-bold">
          {conv.otherUser?.image ? (
            <img src={conv.otherUser.image} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(conv.otherUser?.name ?? null)
          )}
        </div>
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#006e2f] rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isUnread ? "font-bold text-[#191c1e]" : "font-semibold text-[#191c1e]"}`}>
            {conv.otherUser?.name ?? conv.otherUser?.email ?? "Conversation"}
          </p>
          <p className={`text-[10px] flex-shrink-0 ${isUnread ? "text-[#006e2f] font-bold" : "text-[#5c647a]"}`}>
            {timeAgo(conv.updatedAt)}
          </p>
        </div>
        <p className={`text-xs truncate mt-0.5 ${isUnread ? "text-[#191c1e] font-medium" : "text-[#5c647a]"}`}>
          {lastMsgPreview(conv.lastMessage)}
        </p>
      </div>
    </button>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery<{
    data: { conversations: ConversationItem[]; unreadCount: number };
  }>({
    queryKey: ["messages-inbox"],
    queryFn: () => fetch("/api/formations/messages/conversations").then((r) => r.json()),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const conversations = data?.data?.conversations ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.otherUser?.name ?? "").toLowerCase().includes(q) ||
      (c.otherUser?.email ?? "").toLowerCase().includes(q) ||
      (c.lastMessage?.content ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <span className="text-sm font-bold text-[#191c1e] flex-1">
            Messages
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#006e2f] text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </span>
          <button
            onClick={() => refetch()}
            className="text-[#5c647a] hover:text-[#191c1e]"
            title="Rafraîchir"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Search */}
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[#5c647a]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une conversation…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-[#f7f9fb] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                  <div className="w-11 h-11 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded-lg w-36" />
                    <div className="h-3 bg-gray-200 rounded-lg w-52" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl">forum</span>
              <p className="text-sm text-[#5c647a] font-medium mt-3">
                {search ? "Aucune conversation trouvée" : "Aucune conversation pour l'instant"}
              </p>
              <p className="text-xs text-gray-400 mt-1.5 px-8">
                {search
                  ? "Essayez un autre terme de recherche."
                  : "Achetez une formation et contactez directement votre instructeur depuis votre espace commandes."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-3 text-xs text-[#006e2f] font-semibold hover:underline"
                >
                  Effacer
                </button>
              )}
            </div>
          ) : (
            filtered.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                onClick={() => router.push(`/formations/messages/${conv.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
