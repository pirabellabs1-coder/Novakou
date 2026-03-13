"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard";
import { useClientStore } from "@/store/client";
import type { ApiNotification } from "@/lib/api-client";

function formatRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

const NOTIF_ICONS: Record<string, { icon: string; color: string }> = {
  order: { icon: "shopping_cart", color: "text-blue-400" },
  payment: { icon: "payments", color: "text-emerald-400" },
  message: { icon: "chat_bubble", color: "text-primary" },
  kyc: { icon: "verified_user", color: "text-amber-400" },
  system: { icon: "info", color: "text-slate-400" },
  review: { icon: "star", color: "text-yellow-400" },
};

interface NotificationBellProps {
  role: string;
}

export function NotificationBell({ role }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Get notifications from the appropriate store
  const dashboardNotifications = useDashboardStore((s) => s.apiNotifications);
  const dashboardUnread = useDashboardStore((s) => s.unreadCount);
  const dashboardMarkRead = useDashboardStore((s) => s.markNotificationRead);
  const dashboardMarkAllRead = useDashboardStore((s) => s.markAllNotificationsRead);

  const clientNotifications = useClientStore((s) => s.notifications);
  const clientUnread = useClientStore((s) => s.unreadCount);

  const notifications: ApiNotification[] =
    role === "client" ? clientNotifications : dashboardNotifications;
  const unreadCount = role === "client" ? clientUnread : dashboardUnread;

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

  const latest = notifications.slice(0, 5);

  const notifHref =
    role === "admin"
      ? "/admin/notifications"
      : `/${role === "freelance" ? "dashboard" : role}/notifications`;

  function handleMarkAllRead() {
    if (role !== "client") {
      dashboardMarkAllRead();
    }
    setOpen(false);
  }

  function handleNotifClick(notif: ApiNotification) {
    if (!notif.read && role !== "client") {
      dashboardMarkRead(notif.id);
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <h4 className="text-sm font-bold text-white">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary/80 font-semibold"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {latest.length === 0 ? (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-2xl text-slate-600 mb-1">
                  notifications_none
                </span>
                <p className="text-xs text-slate-500">Aucune notification</p>
              </div>
            ) : (
              latest.map((notif) => {
                const ic = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
                return (
                  <Link
                    key={notif.id}
                    href={notif.link || notifHref}
                    onClick={() => handleNotifClick(notif)}
                    className={`flex items-start gap-3 px-3 py-3 hover:bg-white/5 transition-colors ${
                      !notif.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className={`material-symbols-outlined text-base ${ic.color}`}>
                        {ic.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{notif.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        {formatRelative(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            href={notifHref}
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-xs font-semibold text-primary hover:bg-white/5 border-t border-white/10 transition-colors"
          >
            Voir tout
          </Link>
        </div>
      )}
    </div>
  );
}
