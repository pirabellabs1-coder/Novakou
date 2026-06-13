// Refonte design "Stitch" — apprenant notifications — vert Novakou — 2026-06-13
"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { StCard, StPageHeader, StButton, StTabs, ST } from "@/components/stitch";
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

// Pastilles d'icône en tons Stitch (vert / bleu / ambre / rose)
const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  order: { icon: ShoppingCart, color: ST.green, bg: ST.greenSoft },
  ORDER: { icon: ShoppingCart, color: ST.green, bg: ST.greenSoft },
  message: { icon: MessageSquare, color: ST.blueText, bg: ST.blueSoft },
  MESSAGE: { icon: MessageSquare, color: ST.blueText, bg: ST.blueSoft },
  payment: { icon: Wallet, color: ST.green, bg: ST.greenSoft },
  PAYMENT: { icon: Wallet, color: ST.green, bg: ST.greenSoft },
  system: { icon: Info, color: ST.textSecondary, bg: "#f1efe8" },
  SYSTEM: { icon: Info, color: ST.textSecondary, bg: "#f1efe8" },
  kyc: { icon: BadgeCheck, color: ST.blueText, bg: ST.blueSoft },
  KYC: { icon: BadgeCheck, color: ST.blueText, bg: ST.blueSoft },
  admin_action: { icon: ShieldCheck, color: ST.amberText, bg: ST.amberSoft },
  ADMIN_ACTION: { icon: ShieldCheck, color: ST.amberText, bg: ST.amberSoft },
  product: { icon: Package, color: ST.blueText, bg: ST.blueSoft },
  PRODUCT: { icon: Package, color: ST.blueText, bg: ST.blueSoft },
  course: { icon: GraduationCap, color: ST.green, bg: ST.greenSoft },
  COURSE: { icon: GraduationCap, color: ST.green, bg: ST.greenSoft },
  review: { icon: Star, color: ST.amberText, bg: ST.amberSoft },
  REVIEW: { icon: Star, color: ST.amberText, bg: ST.amberSoft },
  offer: { icon: Tag, color: ST.roseText, bg: ST.roseSoft },
  OFFER: { icon: Tag, color: ST.roseText, bg: ST.roseSoft },
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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Notifications"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes les notifications sont lues"
          }
          actions={
            unreadCount > 0 ? (
              <StButton variant="secondary" onClick={markAllRead} icon={CheckCheck}>
                Tout marquer comme lu
              </StButton>
            ) : undefined
          }
        />

        {/* Filters */}
        <div className="mb-4">
          <StTabs
            tabs={[
              { key: "all", label: "Toutes", count: notifications.length },
              { key: "unread", label: "Non lues", count: unreadCount },
              { key: "read", label: "Lues", count: notifications.length - unreadCount },
            ]}
            active={filter}
            onChange={(k) => setFilter(k as FilterType)}
          />
        </div>

        {/* Notifications list */}
        {loading ? (
          <StCard className="!p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "#f3f6f4" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded" style={{ background: "#f3f6f4" }} />
                    <div className="h-3 w-64 rounded" style={{ background: "#f3f6f4" }} />
                  </div>
                </div>
              ))}
            </div>
          </StCard>
        ) : filtered.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <BellOff size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>
              {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
            </h3>
            <p className="text-[13px] font-semibold max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              {filter === "unread"
                ? "Vous avez lu toutes vos notifications. Bravo !"
                : "Vos notifications apparaîtront ici dès qu'il y aura de l'activité sur votre compte."}
            </p>
          </StCard>
        ) : (
          <StCard noPadding className="overflow-hidden">
            {filtered.map((notif, idx) => {
              const typeInfo = TYPE_ICONS[notif.type] ?? TYPE_ICONS.system;
              const Icon = typeInfo.icon;
              const content = (
                <div
                  className="flex gap-4 px-5 py-4 transition-colors hover:bg-[#f7faf8]"
                  style={{
                    ...(idx ? { borderTop: `1px solid ${ST.divider}` } : {}),
                    ...(notif.read ? {} : { background: "#f0faf3" }),
                  }}
                >
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: typeInfo.bg }}>
                    <Icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-extrabold truncate" style={{ color: notif.read ? ST.textSecondary : ST.text }}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ST.greenBright }} />
                      )}
                    </div>
                    <p className="text-[12px] font-semibold mt-0.5 line-clamp-2" style={{ color: ST.textSecondary }}>{notif.message}</p>
                    <p className="text-[10px] font-semibold mt-1.5" style={{ color: ST.textFaint }}>{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markOneRead(notif.id);
                      }}
                      className="flex-shrink-0 p-1.5 rounded-lg transition-colors self-center hover:bg-[#e6f5eb]"
                      style={{ color: ST.textSecondary }}
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
          </StCard>
        )}
      </main>
    </div>
  );
}
