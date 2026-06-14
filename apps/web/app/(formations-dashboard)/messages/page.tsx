// Refonte design "Stitch" — messages liste — vert Novakou — 2026-06-14
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  StPageHeader,
  StButton,
  StCard,
  StAvatar,
  ST,
} from "@/components/stitch";
import {
  Search,
  RefreshCw,
  MessagesSquare,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";

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

function LastMsgPreview({ msg }: { msg: ConversationItem["lastMessage"] }) {
  if (!msg) return <span>Démarrer la conversation</span>;
  if (msg.type === "FILE")
    return (
      <span className="inline-flex items-center gap-1">
        <Paperclip className="w-3 h-3" />
        {msg.fileName ?? "Fichier"}
      </span>
    );
  if (msg.type === "IMAGE")
    return (
      <span className="inline-flex items-center gap-1">
        <ImageIcon className="w-3 h-3" />
        Image
      </span>
    );
  return <span>{msg.fromMe ? `Vous : ${msg.content}` : msg.content}</span>;
}

function ConvItem({ conv, onClick }: { conv: ConversationItem; onClick: () => void }) {
  const isUnread = conv.lastMessage && !conv.lastMessage.fromMe && !conv.lastMessage.read;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left"
      style={{
        borderBottom: `1px solid ${ST.divider}`,
        background: isUnread ? ST.greenSoft : undefined,
      }}
    >
      <div className="relative flex-shrink-0">
        <StAvatar name={conv.otherUser?.name ?? conv.otherUser?.email ?? "?"} src={conv.otherUser?.image} size={44} />
        {isUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: ST.greenBright }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[13.5px] truncate font-extrabold"
            style={{ color: ST.text, fontWeight: isUnread ? 800 : 700 }}
          >
            {conv.otherUser?.name ?? conv.otherUser?.email ?? "Conversation"}
          </p>
          <p
            className="text-[10px] flex-shrink-0 font-bold"
            style={{ color: isUnread ? ST.green : ST.textMuted }}
          >
            {timeAgo(conv.updatedAt)}
          </p>
        </div>
        <p
          className="text-[12px] truncate mt-0.5 font-semibold"
          style={{ color: isUnread ? ST.textSecondary : ST.textMuted }}
        >
          <LastMsgPreview msg={conv.lastMessage} />
        </p>
      </div>
    </button>
  );
}

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1000px] mx-auto">
        <StPageHeader
          title="Messages"
          subtitle={
            unreadCount > 0 ? (
              <>
                Discutez avec vos vendeurs, mentors et le support ·{" "}
                <span className="font-extrabold" style={{ color: ST.green }}>
                  {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
                </span>
              </>
            ) : (
              "Discutez avec vos vendeurs, mentors et le support Novakou"
            )
          }
          actions={
            <StButton variant="secondary" onClick={() => refetch()} icon={RefreshCw}>
              Rafraîchir
            </StButton>
          }
        />

        <StCard noPadding className="overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${ST.divider}` }}>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: ST.textMuted }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une conversation…"
                className="w-full rounded-[12px] bg-white pl-11 pr-4 py-[11px] text-[13.5px] font-semibold transition-all focus:outline-none"
                style={{ color: ST.text, border: "1px solid #dde6e0" }}
              />
            </div>
          </div>

          <div>
            {isLoading ? (
              <div>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3.5 animate-pulse"
                    style={{ borderBottom: `1px solid ${ST.divider}` }}
                  >
                    <div className="w-11 h-11 rounded-full flex-shrink-0" style={{ background: "#f3f6f4" }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 rounded-lg w-36" style={{ background: "#f3f6f4" }} />
                      <div className="h-3 rounded-lg w-52" style={{ background: "#f3f6f4" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
                  <MessagesSquare size={32} style={{ color: ST.green }} strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>
                  {search ? "Aucune conversation trouvée" : "Aucune conversation pour l'instant"}
                </h3>
                <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                  {search
                    ? "Essayez un autre terme de recherche, ou effacez le filtre."
                    : "Achetez une formation et contactez directement votre instructeur depuis l'espace commandes."}
                </p>
                {search && (
                  <StButton variant="secondary" onClick={() => setSearch("")}>
                    Effacer la recherche
                  </StButton>
                )}
              </div>
            ) : (
              filtered.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  onClick={() => router.push(`/messages/${conv.id}`)}
                />
              ))
            )}
          </div>
        </StCard>
      </main>
    </div>
  );
}
