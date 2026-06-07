// Refonte style KAZA — apprenant notifications — 2026-06-07
"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  KazaHero,
  KazaButton,
  KazaEmpty,
} from "@/components/kaza";
import {
  Bell,
  BellOff,
  CheckCheck,
  Check,
  ShoppingCart,
  MessageSquare,
  Wallet,
  Info,
  BadgeCheck,
  ShieldCheck,
  Package,
  GraduationCap,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";

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

const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  order: { icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
  ORDER: { icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
  message: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
  MESSAGE: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
  payment: { icon: Wallet, color: "text-emerald-700", bg: "bg-emerald-50" },
  PAYMENT: { icon: Wallet, color: "text-emerald-700", bg: "bg-emerald-50" },
  system: { icon: Info, color: "text-slate-600", bg: "bg-slate-50" },
  SYSTEM: { icon: Info, color: "text-slate-600", bg: "bg-slate-50" },
  kyc: { icon: BadgeCheck, color: "text-violet-600", bg: "bg-violet-50" },
  KYC: { icon: BadgeCheck, color: "text-violet-600", bg: "bg-violet-50" },
  admin_action: { icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
  ADMIN_ACTION: { icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
  product: { icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  PRODUCT: { icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
  course: { icon: GraduationCap, color: "text-teal-600", bg: "bg-teal-50" },
  COURSE: { icon: GraduationCap, color: "text-teal-600", bg: "bg-teal-50" },
  review: { icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
  REVIEW: { icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
  offer: { icon: Tag, color: "text-pink-600", bg: "bg-pink-50" },
  OFFER: { icon: Tag, color: "text-pink-600", bg: "bg-pink-50" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "À l'instant";
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
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Bell}
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
            : "Toutes les notifications sont lues"
        }
        actions={
          unreadCount > 0 ? (
            <KazaButton variant="secondary" onClick={markAllRead} icon={CheckCheck}>
              Tout marquer comme lu
            </KazaButton>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {([
          { value: "all" as const, label: "Toutes", count: notifications.length },
          { value: "unread" as const, label: "Non lues", count: unreadCount },
          { value: "read" as const, label: "Lues", count: notifications.length - unreadCount },
        ]).map((f) => {
          const isActive = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#0b2540] text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#0b2540]/30 hover:text-[#0b2540]"
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-100 rounded" />
                  <div className="h-3 w-64 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <KazaEmpty
          icon={BellOff}
          title={filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
          description={
            filter === "unread"
              ? "Vous avez lu toutes vos notifications. Bravo !"
              : "Vos notifications apparaîtront ici dès qu'il y aura de l'activité sur votre compte."
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filtered.map((notif) => {
            const typeInfo = TYPE_ICONS[notif.type] ?? TYPE_ICONS.system;
            const Icon = typeInfo.icon;
            const content = (
              <div
                className={`flex gap-4 px-5 py-4 transition-colors ${
                  notif.read
                    ? "hover:bg-slate-50"
                    : "bg-emerald-50/40 hover:bg-emerald-50/70"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold truncate ${notif.read ? "text-slate-600" : "text-[#0b2540]"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markOneRead(notif.id);
                    }}
                    className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors self-center"
                    title="Marquer comme lue"
                  >
                    <Check className="w-4 h-4" />
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
