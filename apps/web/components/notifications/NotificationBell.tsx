"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { notificationsApi, type ApiNotification } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  admin_action: { icon: "admin_panel_settings", color: "text-amber-400" },
  message: { icon: "chat", color: "text-blue-400" },
  order: { icon: "shopping_cart", color: "text-green-400" },
  kyc: { icon: "verified", color: "text-purple-400" },
  payment: { icon: "payments", color: "text-emerald-400" },
  system: { icon: "info", color: "text-slate-400" },
  offer: { icon: "local_offer", color: "text-orange-400" },
  review: { icon: "star", color: "text-yellow-400" },
  agency: { icon: "business", color: "text-cyan-400" },
  course: { icon: "school", color: "text-indigo-400" },
  product: { icon: "inventory_2", color: "text-pink-400" },
  service: { icon: "design_services", color: "text-violet-400" },
  boost: { icon: "rocket_launch", color: "text-rose-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

interface NotificationBellProps {
  userId: string;
  notificationsHref?: string;
}

export function NotificationBell({ userId, notificationsHref = "/dashboard/parametres" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await notificationsApi.list();
      setNotifications((data?.notifications ?? []) as ApiNotification[]);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch (err) {
      console.error("[NotificationBell] fetch error:", err);
    }
  }, [userId]);

  // Fetch on first mount
  useEffect(() => {
    if (!hasFetched.current && userId) {
      hasFetched.current = true;
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Re-fetch when dropdown opens to keep data fresh
  useEffect(() => {
    if (open && userId) {
      fetchNotifications();
    }
  }, [open, userId, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNotificationClick(notif: ApiNotification) {
    if (!notif.read) {
      try {
        await notificationsApi.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("[NotificationBell] markRead error:", err);
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[NotificationBell] markAllRead error:", err);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
      >
        <span className="material-symbols-outlined text-lg">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-neutral-dark border border-border-dark rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-slate-400 hover:text-primary transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <span className="material-symbols-outlined text-sm">done_all</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <span className="material-symbols-outlined text-3xl mb-2">notifications_off</span>
                <p className="text-xs">Aucune notification</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const typeInfo = TYPE_ICONS[notif.type] ?? TYPE_ICONS.system;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-border-dark/50 cursor-pointer hover:bg-background-dark/30 transition-colors",
                      !notif.read && "bg-primary/5"
                    )}
                  >
                    <span className={cn("material-symbols-outlined text-lg mt-0.5 flex-shrink-0", typeInfo.color)}>
                      {typeInfo.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-xs font-semibold truncate", notif.read ? "text-slate-400" : "text-white")}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            href={notificationsHref}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-border-dark"
          >
            Voir toutes les notifications
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
      )}
    </div>
  );
}
