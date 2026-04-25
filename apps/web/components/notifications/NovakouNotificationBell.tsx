"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  admin_action: { icon: "admin_panel_settings", color: "text-amber-500" },
  message: { icon: "chat", color: "text-blue-500" },
  order: { icon: "shopping_cart", color: "text-emerald-500" },
  kyc: { icon: "verified", color: "text-purple-500" },
  payment: { icon: "payments", color: "text-emerald-600" },
  system: { icon: "info", color: "text-slate-500" },
  ADMIN_ACTION: { icon: "admin_panel_settings", color: "text-amber-500" },
  MESSAGE: { icon: "chat", color: "text-blue-500" },
  ORDER: { icon: "shopping_cart", color: "text-emerald-500" },
  KYC: { icon: "verified", color: "text-purple-500" },
  PAYMENT: { icon: "payments", color: "text-emerald-600" },
  SYSTEM: { icon: "info", color: "text-slate-500" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface NovakouNotificationBellProps {
  tone?: "light" | "slate";
  viewAllHref?: string;
}

/**
 * NotificationBell pour l'espace Novakou (theme clair / fond blanc).
 * - Charge les notifications depuis /api/notifications
 * - Compte les non-lues + badge
 * - Dropdown avec list + actions marquer comme lu + "tout marquer lu"
 * - Lien de chaque notification si `link` present
 */
export function NovakouNotificationBell({ tone = "slate", viewAllHref }: NovakouNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const j = await res.json();
      setNotifications(j.notifications ?? []);
      setUnreadCount(j.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    // Poll every 60s
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markOneRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("[NovakouNotificationBell] markOneRead", e);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("[NovakouNotificationBell] markAllRead", e);
    }
  }

  const buttonTone = tone === "light"
    ? "text-[#5c647a] hover:bg-gray-100"
    : "text-slate-600 hover:bg-slate-100";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition-colors ${buttonTone}`}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-zinc-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-[#006e2f] hover:bg-[#006e2f]/5 px-2 py-1 rounded-lg transition-colors uppercase tracking-wider"
                title="Tout marquer comme lu"
              >
                Tout lu
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-xs text-zinc-400">Chargement…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                <span className="material-symbols-outlined text-3xl mb-2">notifications_off</span>
                <p className="text-xs">Aucune notification</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const typeInfo = TYPE_ICONS[notif.type] ?? TYPE_ICONS.system;
                const content = (
                  <div
                    className={`flex gap-3 px-4 py-3 border-b border-zinc-50 cursor-pointer transition-colors ${
                      notif.read ? "hover:bg-zinc-50" : "bg-[#22c55e]/5 hover:bg-[#22c55e]/10"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg mt-0.5 flex-shrink-0 ${typeInfo.color}`}>
                      {typeInfo.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] font-bold truncate ${notif.read ? "text-zinc-700" : "text-zinc-900"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                );

                if (notif.link) {
                  return (
                    <Link
                      key={notif.id}
                      href={notif.link}
                      onClick={() => {
                        if (!notif.read) markOneRead(notif.id);
                        setOpen(false);
                      }}
                    >
                      {content}
                    </Link>
                  );
                }
                return (
                  <div key={notif.id} onClick={() => !notif.read && markOneRead(notif.id)}>
                    {content}
                  </div>
                );
              })
            )}
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-xs font-bold text-[#006e2f] hover:bg-[#006e2f]/5 border-t border-zinc-100 transition-colors"
            >
              Voir toutes les notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
