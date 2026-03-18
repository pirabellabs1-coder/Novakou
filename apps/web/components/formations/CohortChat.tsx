"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Pin, PinOff } from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  avatar: string | null;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  isInstructor: boolean;
  isPinned: boolean;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  user: UserInfo;
}

interface CohortChatProps {
  cohortId: string;
  currentUserId: string;
  isInstructor: boolean;
  formationId?: string;
  locale: string;
}

function timeAgo(dateStr: string, fr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return fr ? "À l'instant" : "Just now";
  if (mins < 60) return `${mins}${fr ? " min" : "m"}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}${fr ? "j" : "d"}`;
}

function Avatar({ user }: { user: UserInfo }) {
  const src = user.avatar || user.image;
  return src ? (
    <img src={src} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CohortChat({ cohortId, currentUserId, isInstructor, formationId, locale }: CohortChatProps) {
  const fr = locale === "fr";
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinned, setPinned] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPinned, setShowPinned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<string | null>(null);

  const apiBase = isInstructor && formationId
    ? `/api/instructeur/formations/${formationId}/cohorts/${cohortId}/messages`
    : `/api/formations/cohorts/${cohortId}/messages`;

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const url = initial
        ? apiBase
        : lastFetchRef.current
          ? `${apiBase}?after=${encodeURIComponent(lastFetchRef.current)}`
          : apiBase;

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const fetchedMsgs: Message[] = data.messages ?? [];

      if (initial) {
        setMessages(fetchedMsgs);
        setPinned(data.pinned ?? []);
      } else {
        if (fetchedMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const truly = fetchedMsgs.filter((m) => !existingIds.has(m.id));
            return truly.length > 0 ? [...prev, ...truly] : prev;
          });
        }
        if (data.pinned) setPinned(data.pinned);
      }

      if (fetchedMsgs.length > 0) {
        lastFetchRef.current = fetchedMsgs[fetchedMsgs.length - 1].createdAt;
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchMessages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // Polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        lastFetchRef.current = msg.createdAt;
      }
    } catch {}
    finally { setSending(false); }
  };

  const togglePin = async (messageId: string, currentPinned: boolean) => {
    if (!isInstructor) return;
    try {
      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, isPinned: !currentPinned }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => m.id === messageId ? { ...m, isPinned: !currentPinned } : m)
        );
        fetchMessages(true);
      }
    } catch {}
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
      {/* Pinned messages header */}
      {pinned.length > 0 && (
        <button
          onClick={() => setShowPinned(!showPinned)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b text-xs text-amber-700 font-medium hover:bg-amber-100 transition-colors"
        >
          <Pin className="w-3 h-3" />
          {pinned.length} {fr ? "message(s) épinglé(s)" : "pinned message(s)"}
        </button>
      )}

      {showPinned && pinned.length > 0 && (
        <div className="border-b bg-amber-50/50 px-4 py-2 space-y-2 max-h-32 overflow-y-auto">
          {pinned.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 text-xs">
              <Pin className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{msg.user.name}</span>
                {msg.isInstructor && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">
                    {fr ? "Instructeur" : "Instructor"}
                  </span>
                )}
                <p className="text-slate-600 mt-0.5">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <div className="text-4xl mb-2">💬</div>
            <p>{fr ? "Aucun message. Soyez le premier à écrire !" : "No messages yet. Be the first!"}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar user={msg.user} />
                <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {!isOwn && (
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{msg.user.name}</span>
                    )}
                    {msg.isInstructor && (
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">
                        {fr ? "Instructeur" : "Instructor"}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{timeAgo(msg.createdAt, fr)}</span>
                    {isInstructor && (
                      <button
                        onClick={() => togglePin(msg.id, msg.isPinned)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100 dark:bg-slate-800"
                        title={msg.isPinned ? (fr ? "Désépingler" : "Unpin") : (fr ? "Épingler" : "Pin")}
                      >
                        {msg.isPinned ? (
                          <PinOff className="w-3 h-3 text-amber-500" />
                        ) : (
                          <Pin className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                  <div
                    className={`inline-block px-3 py-2 rounded-xl text-sm ${
                      isOwn
                        ? "bg-primary text-white rounded-tr-sm"
                        : msg.isInstructor
                          ? "bg-purple-50 text-slate-900 dark:text-white border border-purple-200 rounded-tl-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.attachmentUrl && (
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-primary hover:underline mt-1"
                    >
                      📎 {msg.attachmentName || (fr ? "Pièce jointe" : "Attachment")}
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={fr ? "Écrire un message..." : "Write a message..."}
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
