// Refonte style KAZA — messages chat — 2026-06-07
"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Download,
  Loader2,
  MessagesSquare,
  Check,
  CheckCheck,
} from "lucide-react";
import { KAZA_GRADIENT } from "@/components/kaza";

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
      <div className="w-7 h-7 flex-shrink-0">
        {!isMe && showAvatar ? (
          <div
            className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: KAZA_GRADIENT }}
          >
            {message.sender.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.sender.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(message.sender.name)
            )}
          </div>
        ) : null}
      </div>

      <div className="max-w-[70%] cursor-pointer" onClick={() => setShowTimestamp(!showTimestamp)}>
        {message.type === "FILE" ? (
          <a
            href={message.fileUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${
              isMe
                ? "bg-emerald-500 text-white border-transparent"
                : "bg-slate-100 text-[#0b2540] border-slate-200"
            }`}
          >
            <Paperclip className="w-5 h-5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate max-w-40">{message.fileName ?? "Fichier"}</p>
              {message.fileSizeBytes && (
                <p className={`text-[10px] ${isMe ? "text-white/70" : "text-slate-500"}`}>
                  {fmtBytes(message.fileSizeBytes)}
                </p>
              )}
            </div>
            <Download className="w-4 h-4 ml-1" />
          </a>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isMe
                ? "bg-emerald-500 text-white rounded-br-md shadow-sm"
                : "bg-slate-100 text-[#0b2540] rounded-bl-md"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          </div>
        )}

        {showTimestamp && (
          <p className={`text-[10px] text-slate-500 mt-1 flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {fmtFull(message.createdAt)}
            {isMe && (
              message.read ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Check className="w-3 h-3" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
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
      ? `/api/formations/messages/conversations/${conversationId}?cursor=${cursor}`
      : `/api/formations/messages/conversations/${conversationId}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const json = await res.json();
    return json.data as {
      messages: Message[];
      hasMore: boolean;
      otherUser: OtherUser | null;
      conversation: { id: string; type: string; title: string | null };
    };
  }, [conversationId]);

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

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

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
      const res = await fetch(`/api/formations/messages/conversations/${conversationId}`, {
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
      <div className="flex flex-col h-screen bg-slate-50">
        <div
          className="rounded-b-3xl px-5 py-4 flex items-center gap-3 animate-pulse"
          style={{ background: KAZA_GRADIENT }}
        >
          <div className="w-9 h-9 bg-white/20 rounded-full" />
          <div className="h-4 w-40 bg-white/20 rounded-xl" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "flex-row-reverse" : ""} gap-2 items-end`}>
              <div className="w-7 h-7 bg-slate-200 rounded-full" />
              <div className={`h-10 bg-slate-200 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ── Header navy verre dépoli ──────────────────────────────────────── */}
      <div
        className="rounded-b-3xl shadow-lg text-white sticky top-0 z-10"
        style={{ background: KAZA_GRADIENT }}
      >
        <div className="px-5 py-4 flex items-center gap-3">
          <Link
            href="/messages"
            className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 overflow-hidden">
            {otherUser?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherUser.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(otherUser?.name ?? null)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold truncate tracking-tight">
              {otherUser?.name ?? otherUser?.email ?? "Conversation"}
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              {otherUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Messages list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {hasMore && (
          <div className="text-center pb-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:underline disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Chargement…
                </>
              ) : (
                "Charger les messages précédents"
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <MessagesSquare className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm text-[#0b2540] font-bold">Aucun message pour l&apos;instant</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Envoyez le premier message pour démarrer la conversation.
            </p>
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
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2">
                      {fmtDaySep(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
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
      <div className="bg-white border-t border-slate-100 px-4 py-3">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez un message… (Entrée pour envoyer)"
              rows={1}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-sm text-[#0b2540] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 resize-none transition-all"
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
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 shadow-md ${
              input.trim() ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-slate-200"
            }`}
            aria-label="Envoyer"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className={`w-5 h-5 ${input.trim() ? "text-white" : "text-slate-400"}`} />
            )}
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Shift + Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  );
}
