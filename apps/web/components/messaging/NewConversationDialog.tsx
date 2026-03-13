"use client";

import { useState, useCallback } from "react";
import { conversationsApi } from "@/lib/api-client";
import { useMessagingStore } from "@/store/messaging";

interface SearchUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (convId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  freelance: "Freelance",
  client: "Client",
  agence: "Agence",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  freelance: "bg-primary/10 text-primary",
  client: "bg-blue-500/10 text-blue-400",
  agence: "bg-amber-500/10 text-amber-400",
  admin: "bg-red-500/10 text-red-400",
};

export function NewConversationDialog({ open, onClose, onConversationCreated }: NewConversationDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const syncFromApi = useMessagingStore((s) => s.syncFromApi);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  async function handleSelectUser(user: SearchUser) {
    setCreating(true);
    try {
      const res = await conversationsApi.create({
        participantId: user.id,
        contactName: user.name,
        contactAvatar: user.avatar,
        contactRole: user.role === "admin" ? "support" : user.role,
      });
      // Sync store
      await syncFromApi();
      onConversationCreated(res.conversation.id);
      onClose();
      setQuery("");
      setResults([]);
    } catch (err) {
      console.error("[NewConversationDialog]", err);
    }
    setCreating(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white">Nouvelle conversation</h3>
          <button
            onClick={() => { onClose(); setQuery(""); setResults([]); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-2 pb-4">
          {loading && (
            <div className="py-6 text-center">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Recherche...</p>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-600 mb-1">person_off</span>
              <p className="text-xs text-slate-500">Aucun utilisateur trouve</p>
            </div>
          )}

          {!loading && results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              disabled={creating}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || ROLE_COLORS.client}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </button>
          ))}

          {!loading && query.length < 2 && (
            <div className="py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-600 mb-1">person_search</span>
              <p className="text-xs text-slate-500">Tapez au moins 2 caracteres pour rechercher</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
