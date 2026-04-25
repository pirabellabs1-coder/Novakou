"use client";

import { useState, useCallback, useEffect } from "react";
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

const TYPE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  order: { icon: "shopping_cart", color: "text-emerald-600", bg: "bg-emerald-50" },
  ORDER: { icon: "shopping_cart", color: "text-emerald-600", bg: "bg-emerald-50" },
  message: { icon: "chat", color: "text-blue-600", bg: "bg-blue-50" },
  MESSAGE: { icon: "chat", color: "text-blue-600", bg: "bg-blue-50" },
  payment: { icon: "payments", color: "text-emerald-700", bg: "bg-emerald-50" },
  PAYMENT: { icon: "payments", color: "text-emerald-700", bg: "bg-emerald-50" },
  system: { icon: "info", color: "text-slate-600", bg: "bg-slate-50" },
  SYSTEM: { icon: "info", color: "text-slate-600", bg: "bg-slate-50" },
  kyc: { icon: "verified", color: "text-purple-600", bg: "bg-purple-50" },
  KYC: { icon: "verified", color: "text-purple-600", bg: "bg-purple-50" },
  admin_action: { icon: "admin_panel_settings", color: "text-amber-600", bg: "bg-amber-50" },
  ADMIN_ACTION: { icon: "admin_panel_settings", color: "text-amber-600", bg: "bg-amber-50" },
  product: { icon: "inventory_2", color: "text-indigo-600", bg: "bg-indigo-50" },
  PRODUCT: { icon: "inventory_2", color: "text-indigo-600", bg: "bg-indigo-50" },
  course: { icon: "school", color: "text-teal-600", bg: "bg-teal-50" },
  COURSE: { icon: "school", color: "text-teal-600", bg: "bg-teal-50" },
  review: { icon: "star", color: "text-yellow-600", bg: "bg-yellow-50" },
  REVIEW: { icon: "star", color: "text-yellow-600", bg: "bg-yellow-50" },
  offer: { icon: "local_offer", color: "text-pink-600", bg: "bg-pink-50" },
  OFFER: { icon: "local_offer", color: "text-pink-600", bg: "bg-pink-50" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

type FilterType = "all" | "unread" | "read";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchNotifications = useCallback(async () => {
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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
      console.error("markOneRead", e);
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
      console.error("markAllRead", e);
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#5c647a] mb-2">
        <Link href="/vendeur/dashboard" className="hover:text-[#006e2f] transition-colors">
          Espace vendeur
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#191c1e] font-medium">Notifications</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Notifications</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes les notifications sont lues"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#191c1e] hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6">
        {([
          { value: "all" as const, label: "Toutes", count: notifications.length },
          { value: "unread" as const, label: "Non lues", count: unreadCount },
          { value: "read" as const, label: "Lues", count: notifications.length - unreadCount },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.value
                ? "bg-[#006e2f] text-white"
                : "bg-gray-100 text-[#5c647a] hover:bg-gray-200"
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`ml-1.5 text-xs tabular-nums ${
                filter === f.value ? "text-white/70" : "text-[#5c647a]"
              }`}>
                ({f.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                  <div className="h-3 w-64 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px] text-gray-400">notifications_off</span>
          </div>
          <p className="font-semibold text-[#191c1e]">
            {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
          </p>
          <p className="text-sm text-[#5c647a] mt-1">
            {filter === "unread"
              ? "Vous avez lu toutes vos notifications."
              : "Vos notifications apparaitront ici."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {filtered.map((notif) => {
            const typeInfo = TYPE_ICONS[notif.type] ?? TYPE_ICONS.system;
            const content = (
              <div
                className={`flex gap-4 px-5 py-4 transition-colors ${
                  notif.read
                    ? "hover:bg-gray-50"
                    : "bg-[#006e2f]/[0.03] hover:bg-[#006e2f]/[0.06]"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined text-[20px] ${typeInfo.color}`}>
                    {typeInfo.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold truncate ${notif.read ? "text-[#5c647a]" : "text-[#191c1e]"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#006e2f] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#5c647a] mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-zinc-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markOneRead(notif.id);
                    }}
                    className="flex-shrink-0 p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 hover:text-[#006e2f] transition-colors self-center"
                    title="Marquer comme lue"
                  >
                    <span className="material-symbols-outlined text-[16px]">done</span>
                  </button>
                )}
              </div>
            );

            if (notif.link) {
              return (
                <Link
                  key={notif.id}
                  href={notif.link}
                  onClick={() => {
                    if (!notif.read) markOneRead(notif.id);
                  }}
                  className="block"
                >
                  {content}
                </Link>
              );
            }
            return (
              <div
                key={notif.id}
                className="cursor-default"
                onClick={() => {
                  if (!notif.read) markOneRead(notif.id);
                }}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
