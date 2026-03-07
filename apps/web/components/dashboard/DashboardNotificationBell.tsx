"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import type { ApiNotification } from "@/lib/api-client";

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  admin_action: { icon: "admin_panel_settings", color: "text-amber-400" },
  message: { icon: "chat", color: "text-blue-400" },
  order: { icon: "shopping_cart", color: "text-green-400" },
  kyc: { icon: "verified", color: "text-purple-400" },
  payment: { icon: "payments", color: "text-emerald-400" },
  system: { icon: "info", color: "text-slate-400" },
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

export function DashboardNotificationBell() {
  const apiNotifications = useDashboardStore((s) => s.apiNotifications);
  const unreadCount = useDashboardStore((s) => s.unreadCount);
  const markNotificationRead = useDashboardStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useDashboardStore((s) => s.markAllNotificationsRead);
  const refreshNotifications = useDashboardStore((s) => s.refreshNotifications);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasRefreshed = useRef(false);

  // Refresh notifications from API on first mount
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshNotifications();
    }
  }, [refreshNotifications]);

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

  function handleNotificationClick(notif: ApiNotification) {
    if (!notif.read) {
      markNotificationRead(notif.id);
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-dark border border-border-dark rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => markAllNotificationsRead()}
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
            {apiNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <span className="material-symbols-outlined text-3xl mb-2">notifications_off</span>
                <p className="text-xs">Aucune notification</p>
              </div>
            ) : (
              apiNotifications.slice(0, 20).map((notif) => {
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
            href="/dashboard/notifications"
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
