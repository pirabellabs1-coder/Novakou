// Refonte style KAZA — messages liste — 2026-06-07
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  KazaHero,
  KazaButton,
  KazaInput,
  KazaEmpty,
} from "@/components/kaza";
import {
  MessageSquare,
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

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0 ${
        isUnread ? "bg-emerald-50/40" : ""
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#0b2540] to-[#1a4a7d] flex items-center justify-center text-white text-sm font-bold">
          {conv.otherUser?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conv.otherUser.image} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(conv.otherUser?.name ?? null)
          )}
        </div>
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isUnread ? "font-bold text-[#0b2540]" : "font-semibold text-[#0b2540]"}`}>
            {conv.otherUser?.name ?? conv.otherUser?.email ?? "Conversation"}
          </p>
          <p className={`text-[10px] flex-shrink-0 ${isUnread ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
            {timeAgo(conv.updatedAt)}
          </p>
        </div>
        <p className={`text-xs truncate mt-0.5 ${isUnread ? "text-[#0b2540] font-medium" : "text-slate-500"}`}>
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
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1000px] mx-auto space-y-6">
      <KazaHero
        badge={unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? "s" : ""}` : "Messagerie"}
        badgeColor="blue"
        icon={MessageSquare}
        title="Messages"
        subtitle="Discutez avec vos vendeurs, mentors et le support Novakou"
        actions={
          <KazaButton variant="secondary" onClick={() => refetch()} icon={RefreshCw}>
            Rafraîchir
          </KazaButton>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <KazaInput
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une conversation…"
            icon={Search}
          />
        </div>

        <div>
          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                  <div className="w-11 h-11 bg-slate-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded-lg w-36" />
                    <div className="h-3 bg-slate-200 rounded-lg w-52" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <KazaEmpty
                icon={MessagesSquare}
                title={search ? "Aucune conversation trouvée" : "Aucune conversation pour l'instant"}
                description={
                  search
                    ? "Essayez un autre terme de recherche, ou effacez le filtre."
                    : "Achetez une formation et contactez directement votre instructeur depuis l'espace commandes."
                }
                action={search ? { label: "Effacer la recherche", onClick: () => setSearch("") } : undefined}
              />
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
      </div>
    </div>
  );
}
