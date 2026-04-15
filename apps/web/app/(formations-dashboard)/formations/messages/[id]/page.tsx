"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Sender {
  id: string;
  name: string | null;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  read: boolean;
  createdAt: string;
  fileName: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSizeBytes: number | null;
  sender: Sender;
}

interface OtherUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7)
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isDifferentDay(a: string, b: string) {
  const da = new Date(a).toDateString();
  const db = new Date(b).toDateString();
  return da !== db;
}

function fmtDaySep(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isMe,
  showAvatar,
}: {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
}) {
  const [showTimestamp, setShowTimestamp] = useState(false);

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="w-7 h-7 flex-shrink-0">
        {!isMe && showAvatar ? (
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-[10px] font-bold">
            {message.sender.image ? (
              <img src={message.sender.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(message.sender.name)
            )}
          </div>
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[70%] cursor-pointer`}
        onClick={() => setShowTimestamp(!showTimestamp)}
      >
        {message.type === "FILE" ? (
          <a
            href={message.fileUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${
              isMe
                ? "bg-[#006e2f] text-white border-transparent"
                : "bg-white text-[#191c1e] border-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">attach_file</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate max-w-40">{message.fileName ?? "Fichier"}</p>
              {message.fileSizeBytes && (
                <p className={`text-[10px] ${isMe ? "text-white/70" : "text-[#5c647a]"}`}>
                  {fmtBytes(message.fileSizeBytes)}
                </p>
              )}
            </div>
            <span className="material-symbols-outlined text-[16px] ml-1">download</span>
          </a>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isMe
                ? "bg-[#006e2f] text-white rounded-br-md"
                : "bg-white text-[#191c1e] rounded-bl-md border border-gray-200"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          </div>
        )}

        {showTimestamp && (
          <p
            className={`text-[10px] text-[#5c647a] mt-1 ${isMe ? "text-right" : "text-left"}`}
          >
            {fmtFull(message.createdAt)}
            {isMe && (
              <span className="ml-1">
                {message.read ? "✓✓" : "✓"}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myId = session?.user?.id;

  const load = useCallback(async (cursor?: string) => {
    const url = cursor
      ? `/api/formations/messages/conversations/${params.id}?cursor=${cursor}`
      : `/api/formations/messages/conversations/${params.id}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const json = await res.json();
    return json.data as {
      messages: Message[];
      hasMore: boolean;
      otherUser: OtherUser | null;
      conversation: { id: string; type: string; title: string | null };
    };
  }, [params.id]);

  useEffect(() => {
    async function init() {
      const data = await load();
      if (data) {
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setOtherUser(data.otherUser);
      }
      setLoading(false);
    }
    init();
  }, [load]);

  // Scroll to bottom on first load
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

  // Polling for new messages every 5s
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const data = await load();
      if (data) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            return [...prev, ...newMsgs];
          }
          return prev;
        });
      }
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [load]);

  async function loadMore() {
    if (!messages[0] || loadingMore) return;
    setLoadingMore(true);
    const data = await load(messages[0].id);
    if (data) {
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    }
    setLoadingMore(false);
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content: text,
      type: "TEXT",
      senderId: myId ?? "",
      read: false,
      createdAt: new Date().toISOString(),
      fileName: null,
      fileUrl: null,
      fileType: null,
      fileSizeBytes: null,
      sender: { id: myId ?? "", name: session?.user?.name ?? null, image: session?.user?.image ?? null },
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch(`/api/formations/messages/conversations/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? json.data : m))
        );
      }
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#f7f9fb]">
        <div className="bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3 animate-pulse">
          <div className="w-9 h-9 bg-gray-200 rounded-full" />
          <div className="h-4 w-40 bg-gray-200 rounded-xl" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "flex-row-reverse" : ""} gap-2 items-end`}>
              <div className="w-7 h-7 bg-gray-200 rounded-full" />
              <div className={`h-10 bg-gray-200 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f7f9fb]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="h-14 flex items-center gap-3 px-4">
          <Link href="/formations/messages" className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {otherUser?.image ? (
              <img src={otherUser.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(otherUser?.name ?? null)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#191c1e] truncate">
              {otherUser?.name ?? otherUser?.email ?? "Conversation"}
            </p>
            <p className="text-[10px] text-[#5c647a]">
              {otherUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {/* Load more */}
        {hasMore && (
          <div className="text-center pb-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-[#006e2f] font-semibold hover:underline disabled:opacity-50"
            >
              {loadingMore ? (
                <span className="flex items-center gap-1 justify-center">
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                  Chargement…
                </span>
              ) : (
                "Charger les messages précédents"
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl">forum</span>
            <p className="text-sm text-[#5c647a] font-medium mt-3">Aucun message pour l'instant</p>
            <p className="text-xs text-gray-400 mt-1">Envoyez le premier message pour démarrer la conversation.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === myId;
            const prev = messages[i - 1];
            const showDaySep = !prev || isDifferentDay(prev.createdAt, msg.createdAt);
            const showAvatar =
              !isMe &&
              (!messages[i + 1] || messages[i + 1].senderId !== msg.senderId);

            return (
              <div key={msg.id}>
                {showDaySep && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-[#5c647a] font-medium px-2">
                      {fmtDaySep(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <MessageBubble message={msg} isMe={isMe} showAvatar={showAvatar} />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez un message… (Entrée pour envoyer)"
              rows={1}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none transition-all"
              style={{
                minHeight: "44px",
                maxHeight: "120px",
                overflowY: input.split("\n").length > 3 ? "auto" : "hidden",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{
              background: input.trim()
                ? "linear-gradient(135deg, #006e2f, #22c55e)"
                : "#e5e7eb",
            }}
          >
            {sending ? (
              <span className="material-symbols-outlined text-[20px] text-white animate-spin">
                progress_activity
              </span>
            ) : (
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ color: input.trim() ? "white" : "#9ca3af" }}
              >
                send
              </span>
            )}
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1 text-center">
          Shift+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  );
}
