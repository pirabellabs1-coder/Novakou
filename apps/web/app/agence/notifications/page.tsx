"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { notificationsApi, type ApiNotification } from "@/lib/api-client";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/toast";

const TYPE_META: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  commande: { icon: "shopping_cart", color: "text-green-400", bgColor: "bg-green-400/10", label: "Commande" },
  message:  { icon: "chat", color: "text-blue-400", bgColor: "bg-blue-400/10", label: "Message" },
  equipe:   { icon: "groups", color: "text-purple-400", bgColor: "bg-purple-400/10", label: "Équipe" },
  finance:  { icon: "payments", color: "text-emerald-400", bgColor: "bg-emerald-400/10", label: "Finance" },
  systeme:  { icon: "info", color: "text-slate-400", bgColor: "bg-slate-400/10", label: "Système" },
  order:    { icon: "shopping_cart", color: "text-green-400", bgColor: "bg-green-400/10", label: "Commande" },
  payment:  { icon: "payments", color: "text-emerald-400", bgColor: "bg-emerald-400/10", label: "Paiement" },
  system:   { icon: "info", color: "text-slate-400", bgColor: "bg-slate-400/10", label: "Système" },
  offer:    { icon: "local_offer", color: "text-orange-400", bgColor: "bg-orange-400/10", label: "Offre" },
  review:   { icon: "star", color: "text-yellow-400", bgColor: "bg-yellow-400/10", label: "Avis" },
  agency:   { icon: "business", color: "text-cyan-400", bgColor: "bg-cyan-400/10", label: "Agence" },
  course:   { icon: "school", color: "text-indigo-400", bgColor: "bg-indigo-400/10", label: "Formation" },
  product:  { icon: "inventory_2", color: "text-pink-400", bgColor: "bg-pink-400/10", label: "Produit" },
  service:  { icon: "design_services", color: "text-violet-400", bgColor: "bg-violet-400/10", label: "Service" },
  boost:    { icon: "rocket_launch", color: "text-rose-400", bgColor: "bg-rose-400/10", label: "Boost" },
  kyc:      { icon: "verified", color: "text-purple-400", bgColor: "bg-purple-400/10", label: "KYC" },
};

type FilterType = "all" | "unread" | "commande" | "message" | "equipe" | "finance";

const FILTERS: { value: FilterType; label: string; icon: string }[] = [
  { value: "all",      label: "Toutes",     icon: "notifications" },
  { value: "unread",   label: "Non lues",   icon: "mark_email_unread" },
  { value: "commande", label: "Commandes",  icon: "shopping_cart" },
  { value: "message",  label: "Messages",   icon: "chat" },
  { value: "equipe",   label: "Équipe",     icon: "groups" },
  { value: "finance",  label: "Finances",   icon: "payments" },
];

function formatDate(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDate(items: ApiNotification[]): { label: string; items: ApiNotification[] }[] {
  const groups: Record<string, ApiNotification[]> = {};
  for (const n of items) {
    const days = Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 86_400_000);
    const label = days === 0 ? "Aujourd'hui" : days === 1 ? "Hier" : days < 7 ? "Cette semaine" : "Plus ancien";
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"]
    .filter((l) => groups[l]?.length)
    .map((label) => ({ label, items: groups[label] }));
}

export default function AgenceNotificationsPage() {
  const addToast = useToastStore((s) => s.addToast);
  const { notifications, unreadCount, syncNotifications } = useAgencyStore();
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => { syncNotifications(); }, [syncNotifications]);

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const grouped = groupByDate(filtered);

  async function handleMarkRead(notif: ApiNotification) {
    if (!notif.read) {
      await notificationsApi.markRead(notif.id);
      await syncNotifications();
    }
  }

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    await syncNotifications();
    addToast("success", "Toutes les notifications marquées comme lues");
  }

  function renderNotif(notif: ApiNotification) {
    const meta = TYPE_META[notif.type] ?? TYPE_META.systeme;
    const content = (
      <div
        className={cn(
          "flex gap-4 px-4 py-4 sm:px-5 transition-colors cursor-pointer group",
          !notif.read ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "hover:bg-white/[0.02]"
        )}
      >
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", meta.bgColor)}>
          <span className={cn("material-symbols-outlined text-xl", meta.color)}>{meta.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={cn("text-sm font-semibold truncate", notif.read ? "text-slate-400" : "text-white")}>{notif.title}</p>
            {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-slate-600">{formatDate(notif.createdAt)}</span>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", meta.bgColor, meta.color)}>{meta.label}</span>
          </div>
        </div>
      </div>
    );

    if (notif.link) {
      return (
        <Link key={notif.id} href={notif.link} onClick={() => handleMarkRead(notif)} className="block">
          {content}
        </Link>
      );
    }
    return (
      <div key={notif.id} onClick={() => handleMarkRead(notif)}>
        {content}
      </div>
    );
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
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">done_all</span>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((tab) => {
          const isActive = filter === tab.value;
          const count =
            tab.value === "all" ? notifications.length
            : tab.value === "unread" ? unreadCount
            : notifications.filter((n) => n.type === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
              {count > 0 && (
                <span className={cn("min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1", isActive ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-500")}>
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
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">inbox</span>
          <p className="text-sm font-semibold text-slate-400">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">{group.label}</h2>
              <div className="rounded-xl border border-border-dark bg-neutral-dark overflow-hidden divide-y divide-border-dark/50">
                {group.items.map(renderNotif)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
