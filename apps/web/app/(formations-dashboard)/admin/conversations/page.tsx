"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Participant {
  user: { id: string; name: string | null; email: string | null; image: string | null; role: string | null };
}

interface ConversationSummary {
  id: string;
  type: string;
  title: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
  users: Participant[];
  messages: { content: string; createdAt: string; sender: { name: string | null } }[];
  _count: { messages: number };
}

interface ConversationDetail {
  id: string;
  type: string;
  title: string | null;
  orderId: string | null;
  users: Participant[];
  messages: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    fileName: string | null;
    fileUrl: string | null;
    audioUrl: string | null;
    sender: { id: string; name: string | null; email: string | null; image: string | null; role: string | null };
  }[];
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  DIRECT: { label: "Direct", color: "bg-blue-100 text-blue-700" },
  GROUP: { label: "Groupe", color: "bg-purple-100 text-purple-700" },
  ORDER: { label: "Commande", color: "bg-green-100 text-green-700" },
  ADMIN: { label: "Admin", color: "bg-red-100 text-red-700" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminConversationsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (typeFilter) params.set("type", typeFilter);
  if (search) params.set("search", search);

  const { data: listData, isLoading } = useQuery<{ data: ConversationSummary[]; total: number; pages: number }>({
    queryKey: ["admin-conversations", page, typeFilter, search],
    queryFn: () => fetch(`/api/formations/admin/conversations?${params}`).then((r) => r.json()),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<{ data: ConversationDetail }>({
    queryKey: ["admin-conversation-detail", selectedId],
    queryFn: () => fetch(`/api/formations/admin/conversations?id=${selectedId}`).then((r) => r.json()),
    enabled: !!selectedId,
  });

  const detail = detailData?.data;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006e2f]">forum</span>
          Conversations
        </h1>
        <p className="text-sm text-[#5c647a] mt-1">
          Historique de toutes les conversations de la plateforme (lecture seule)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
          >
            <option value="">Tous</option>
            <option value="DIRECT">Direct</option>
            <option value="GROUP">Groupe</option>
            <option value="ORDER">Commande</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Recherche</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
              placeholder="Nom, email ou contenu..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
            />
            <button
              onClick={() => { setSearch(searchInput); setPage(1); }}
              className="px-3 py-2 bg-[#006e2f] text-white text-xs font-bold rounded-lg hover:bg-[#005a26] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
            </button>
          </div>
        </div>
        <span className="text-xs text-[#5c647a]">{listData?.total ?? 0} conversations</span>
      </div>

      <div className="flex gap-4">
        {/* List */}
        <div className={`${selectedId ? "hidden md:block md:w-2/5" : "w-full"} space-y-2`}>
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-20">
              <span className="material-symbols-outlined text-[#006e2f] text-3xl animate-spin">progress_activity</span>
            </div>
          ) : !listData?.data?.length ? (
            <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 text-[#5c647a]">
              <span className="material-symbols-outlined text-4xl mb-2">forum</span>
              <p className="text-sm font-medium">Aucune conversation</p>
            </div>
          ) : (
            <>
              {listData.data.map((conv) => {
                const badge = TYPE_BADGES[conv.type] || { label: conv.type, color: "bg-gray-100 text-gray-700" };
                const lastMsg = conv.messages[0];
                const participants = conv.users.map((u) => u.user.name || u.user.email || "?").join(", ");
                const isActive = selectedId === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left bg-white rounded-xl border p-4 hover:bg-gray-50 transition-colors ${
                      isActive ? "border-[#006e2f] ring-1 ring-[#006e2f]/20" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-[#5c647a]">{formatDate(conv.updatedAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#191c1e] truncate">
                      {conv.title || participants}
                    </p>
                    <p className="text-xs text-[#5c647a] truncate mt-1">
                      {lastMsg ? `${lastMsg.sender.name ?? "?"}: ${lastMsg.content}` : "Aucun message"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-[#5c647a]">
                        {conv._count.messages} message{conv._count.messages !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] text-[#5c647a]">
                        {conv.users.length} participant{conv.users.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Pagination */}
              {listData.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] disabled:opacity-30"
                  >
                    Précédent
                  </button>
                  <span className="text-xs text-[#5c647a]">Page {page} / {listData.pages}</span>
                  <button
                    onClick={() => setPage(Math.min(listData.pages, page + 1))}
                    disabled={page === listData.pages}
                    className="px-3 py-1.5 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] disabled:opacity-30"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col max-h-[75vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-1 text-[#5c647a] hover:text-[#191c1e]"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <h2 className="text-sm font-bold text-[#191c1e]">
                    {detail?.title || "Conversation"}
                  </h2>
                </div>
                {detail && (
                  <p className="text-[10px] text-[#5c647a] mt-0.5">
                    {detail.users.map((u) => u.user.name || u.user.email).join(", ")}
                    {detail.orderId && ` · Commande #${detail.orderId.slice(-6).toUpperCase()}`}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-[#5c647a] bg-gray-100 px-2 py-1 rounded-full font-bold">
                Lecture seule
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {detailLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="material-symbols-outlined text-[#006e2f] text-2xl animate-spin">progress_activity</span>
                </div>
              ) : !detail?.messages?.length ? (
                <div className="text-center py-10 text-[#5c647a]">
                  <p className="text-sm">Aucun message</p>
                </div>
              ) : (
                detail.messages.map((msg) => {
                  const roleColor: Record<string, string> = {
                    VENDEUR: "text-emerald-600",
                    APPRENANT: "text-blue-600",
                    ADMIN: "text-red-600",
                    MENTOR: "text-amber-600",
                  };
                  return (
                    <div key={msg.id} className="flex gap-3">
                      {msg.sender.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.sender.image} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#006e2f]/10 flex items-center justify-center text-[9px] font-bold text-[#006e2f] flex-shrink-0 mt-0.5">
                          {(msg.sender.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xs font-semibold ${roleColor[msg.sender.role || ""] || "text-[#191c1e]"}`}>
                            {msg.sender.name || msg.sender.email}
                          </span>
                          <span className="text-[10px] text-[#5c647a]">{formatFullDate(msg.createdAt)}</span>
                          {msg.sender.role && (
                            <span className="text-[9px] text-[#5c647a] bg-gray-100 px-1.5 py-0.5 rounded capitalize">
                              {msg.sender.role.toLowerCase()}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-[#191c1e] bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap break-words">
                          {msg.type === "system" ? (
                            <span className="italic text-[#5c647a]">{msg.content}</span>
                          ) : (
                            msg.content
                          )}
                          {msg.fileName && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-[#5c647a]">
                              <span className="material-symbols-outlined text-[14px]">attach_file</span>
                              {msg.fileUrl ? (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#006e2f]">
                                  {msg.fileName}
                                </a>
                              ) : msg.fileName}
                            </div>
                          )}
                          {msg.audioUrl && (
                            <div className="mt-1">
                              <audio src={msg.audioUrl} controls className="h-8" preload="metadata" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
