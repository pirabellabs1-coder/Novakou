"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";
import type { ApiNotification } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Type icons mapping
// ---------------------------------------------------------------------------

const TYPE_META: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  admin_action: { icon: "admin_panel_settings", color: "text-amber-400", bgColor: "bg-amber-400/10", label: "Action admin" },
  message: { icon: "chat", color: "text-blue-400", bgColor: "bg-blue-400/10", label: "Message" },
  order: { icon: "shopping_cart", color: "text-green-400", bgColor: "bg-green-400/10", label: "Commande" },
  kyc: { icon: "verified", color: "text-purple-400", bgColor: "bg-purple-400/10", label: "Verification" },
  payment: { icon: "payments", color: "text-emerald-400", bgColor: "bg-emerald-400/10", label: "Paiement" },
  system: { icon: "info", color: "text-slate-400", bgColor: "bg-slate-400/10", label: "Systeme" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function groupByDate(notifications: ApiNotification[]): { label: string; items: ApiNotification[] }[] {
  const groups: Record<string, ApiNotification[]> = {};

  for (const notif of notifications) {
    const date = new Date(notif.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

    let label: string;
    if (diffDays === 0) {
      label = "Aujourd'hui";
    } else if (diffDays === 1) {
      label = "Hier";
    } else if (diffDays < 7) {
      label = "Cette semaine";
    } else if (diffDays < 30) {
      label = "Ce mois";
    } else {
      label = "Plus ancien";
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(notif);
  }

  const order = ["Aujourd'hui", "Hier", "Cette semaine", "Ce mois", "Plus ancien"];
  return order
    .filter((label) => groups[label] && groups[label].length > 0)
    .map((label) => ({ label, items: groups[label] }));
}

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

type FilterType = "all" | "unread" | "order" | "message" | "payment" | "system";

const FILTER_TABS: { value: FilterType; label: string; icon: string }[] = [
  { value: "all", label: "Toutes", icon: "notifications" },
  { value: "unread", label: "Non lues", icon: "mark_email_unread" },
  { value: "order", label: "Commandes", icon: "shopping_cart" },
  { value: "message", label: "Messages", icon: "chat" },
  { value: "payment", label: "Paiements", icon: "payments" },
  { value: "system", label: "Systeme", icon: "info" },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const apiNotifications = useDashboardStore((s) => s.apiNotifications);
  const unreadCount = useDashboardStore((s) => s.unreadCount);
  const markNotificationRead = useDashboardStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useDashboardStore((s) => s.markAllNotificationsRead);
  const refreshNotifications = useDashboardStore((s) => s.refreshNotifications);

  const [filter, setFilter] = useState<FilterType>("all");
  const hasRefreshed = useRef(false);

  // Refresh notifications from API on mount
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Apply filter
  const filtered = apiNotifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const grouped = groupByDate(filtered);

  function handleMarkRead(notif: ApiNotification) {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes vos notifications sont lues"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              Tout marquer comme lu
            </button>
          )}
          <Link
            href="/dashboard/parametres"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-border-dark transition-colors"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            Preferences
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.value;
          const count =
            tab.value === "all"
              ? apiNotifications.length
              : tab.value === "unread"
                ? unreadCount
                : apiNotifications.filter((n) => n.type === tab.value).length;

          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1",
                    isActive ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-500"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border-dark bg-neutral-dark">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">
            {filter === "unread" ? "mark_email_read" : "notifications_off"}
          </span>
          <p className="text-sm font-semibold text-slate-400 mb-1">
            {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
          </p>
          <p className="text-xs text-slate-500">
            {filter === "unread"
              ? "Vous avez lu toutes vos notifications."
              : filter === "all"
                ? "Vous n'avez pas encore de notifications."
                : `Aucune notification de type "${FILTER_TABS.find((t) => t.value === filter)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
                {group.label}
              </h2>
              <div className="rounded-xl border border-border-dark bg-neutral-dark overflow-hidden divide-y divide-border-dark/50">
                {group.items.map((notif) => {
                  const meta = TYPE_META[notif.type] ?? TYPE_META.system;
                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex gap-4 px-4 py-4 sm:px-5 transition-colors group",
                        !notif.read
                          ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                          : "hover:bg-white/[0.02]"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          meta.bgColor
                        )}
                      >
                        <span className={cn("material-symbols-outlined text-xl", meta.color)}>
                          {meta.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p
                                className={cn(
                                  "text-sm font-semibold truncate",
                                  notif.read ? "text-slate-400" : "text-white"
                                )}
                              >
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-slate-600">
                                {formatDate(notif.createdAt)}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                                  meta.bgColor,
                                  meta.color
                                )}
                              >
                                {meta.label}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.read && (
                              <button
                                onClick={() => handleMarkRead(notif)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Marquer comme lu"
                              >
                                <span className="material-symbols-outlined text-sm">done</span>
                              </button>
                            )}
                            {notif.link && (
                              <Link
                                href={notif.link}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Voir le detail"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  open_in_new
                                </span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
