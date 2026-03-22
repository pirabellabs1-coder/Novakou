"use client";

import { useState, useEffect } from "react";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/client/EmptyState";

const TYPE_ICON_MAP: Record<string, { icon: string; color: string }> = {
  message: { icon: "chat", color: "text-blue-400 bg-blue-500/10" },
  payment: { icon: "payments", color: "text-primary bg-primary/10" },
  project: { icon: "work", color: "text-amber-400 bg-amber-500/10" },
  system: { icon: "settings", color: "text-slate-400 bg-slate-500/10" },
  order: { icon: "shopping_cart", color: "text-primary bg-primary/10" },
  review: { icon: "star", color: "text-amber-400 bg-amber-500/10" },
  offer: { icon: "local_offer", color: "text-orange-400 bg-orange-500/10" },
  agency: { icon: "business", color: "text-cyan-400 bg-cyan-500/10" },
  course: { icon: "school", color: "text-indigo-400 bg-indigo-500/10" },
  product: { icon: "inventory_2", color: "text-pink-400 bg-pink-500/10" },
  service: { icon: "design_services", color: "text-violet-400 bg-violet-500/10" },
  boost: { icon: "rocket_launch", color: "text-rose-400 bg-rose-500/10" },
  kyc: { icon: "verified", color: "text-purple-400 bg-purple-500/10" },
};

const PREF_SECTIONS = [
  {
    title: "Messages et Communications",
    icon: "mail",
    prefs: [
      { id: "msg_email", label: "Emails de nouveaux messages", desc: "Recevoir un résumé par email pour chaque nouveau message non lu.", email: true, push: true },
      { id: "msg_push", label: "Notifications Push (Navigateur)", desc: "Alertes en temps réel sur votre bureau lorsque vous êtes connecté.", email: false, push: true },
    ],
  },
  {
    title: "Finances et Paiements",
    icon: "payments",
    prefs: [
      { id: "pay_confirm", label: "Paiements confirmés", desc: "Alerte immédiate par SMS et Email dès qu'un paiement est confirmé.", email: true, push: true },
      { id: "pay_invoice", label: "Nouvelles factures", desc: "Notification quand une facture est générée.", email: true, push: false },
    ],
  },
  {
    title: "Projets et Missions",
    icon: "assignment",
    prefs: [
      { id: "proj_update", label: "Mises à jour de commandes", desc: "Changements de statut, validations d'étapes et retours freelances.", email: true, push: true },
      { id: "proj_candidature", label: "Nouvelles candidatures", desc: "Quand un freelance postule sur un de vos projets.", email: true, push: true },
      { id: "proj_deadline", label: "Rappels de délais", desc: "Alertes quand une deadline approche (3 jours, 1 jour avant).", email: true, push: false },
    ],
  },
];

function NotificationListSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-neutral-dark border border-border-dark animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-border-dark flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-border-dark rounded" />
            <div className="h-3 w-full bg-border-dark rounded" />
            <div className="h-2 w-16 bg-border-dark rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClientNotifications() {
  const [tab, setTab] = useState<"all" | "prefs">("all");
  const [filter, setFilter] = useState("tous");
  const [preferences, setPreferences] = useState(PREF_SECTIONS);
  const { addToast } = useToastStore();

  const {
    notifications,
    unreadCount,
    syncNotifications,
    markNotificationRead,
    updateSettings,
    loading,
  } = useClientStore();

  useEffect(() => {
    syncNotifications();
  }, [syncNotifications]);

  const isLoading = loading.notifications;

  const filtered = filter === "tous"
    ? notifications
    : filter === "non_lus"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === filter);

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await markNotificationRead(n.id);
    }
    addToast("success", "Toutes les notifications marquées comme lues");
  }

  async function handleNotificationClick(id: string) {
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.read) {
      await markNotificationRead(id);
    }
  }

  function togglePref(sectionIndex: number, prefIndex: number, type: "email" | "push") {
    setPreferences((prev) => prev.map((s, si) => si === sectionIndex ? {
      ...s,
      prefs: s.prefs.map((p, pi) => pi === prefIndex ? { ...p, [type]: !p[type] } : p),
    } : s));
  }

  function getTypeIcon(type: string) {
    return TYPE_ICON_MAP[type] || TYPE_ICON_MAP.system;
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH}h`;
    if (diffD < 7) return `Il y a ${diffD} jour${diffD > 1 ? "s" : ""}`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos notifications et configurez vos préférences d&apos;alertes.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm font-semibold text-white hover:bg-border-dark transition-colors">
            <span className="material-symbols-outlined text-lg">done_all</span>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab("all")} className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2", tab === "all" ? "bg-primary text-background-dark" : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white")}>
          <span className="material-symbols-outlined text-lg">notifications</span>
          Toutes
          {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </button>
        <button onClick={() => setTab("prefs")} className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2", tab === "prefs" ? "bg-primary text-background-dark" : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white")}>
          <span className="material-symbols-outlined text-lg">tune</span>
          Préférences
        </button>
      </div>

      {/* Notifications List */}
      {tab === "all" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "tous", label: "Toutes" },
              { key: "non_lus", label: "Non lues" },
              { key: "message", label: "Messages" },
              { key: "payment", label: "Paiements" },
              { key: "project", label: "Projets" },
              { key: "system", label: "Système" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  filter === f.key ? "bg-primary/10 text-primary border border-primary/20" : "bg-neutral-dark text-slate-500 border border-border-dark hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <NotificationListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="notifications_off"
              title={notifications.length === 0 ? "Aucune notification" : "Aucune notification dans cette catégorie"}
              description={notifications.length === 0
                ? "Vous recevrez des notifications pour vos commandes, messages et projets."
                : "Essayez un autre filtre pour voir vos notifications."}
            />
          ) : (
            <div className="space-y-1">
              {filtered.map((n) => {
                const { icon, color } = getTypeIcon(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all",
                      n.read ? "hover:bg-neutral-dark/50" : "bg-neutral-dark border border-border-dark hover:border-primary/20"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", color)}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold truncate", n.read ? "text-slate-400" : "text-white")}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                      </div>
                      <p className={cn("text-xs mt-0.5 truncate", n.read ? "text-slate-500" : "text-slate-400")}>{n.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Preferences */}
      {tab === "prefs" && (
        <div className="space-y-6">
          {preferences.map((section, si) => (
            <div key={section.title} className="bg-neutral-dark rounded-xl border border-border-dark p-6">
              <h3 className="font-bold text-white flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary text-xl">{section.icon}</span>
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.prefs.map((pref, pi) => (
                  <div key={pref.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-background-dark/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{pref.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pref.desc}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Email</span>
                        <button
                          onClick={() => togglePref(si, pi, "email")}
                          className={cn("w-10 h-5 rounded-full transition-colors relative flex-shrink-0", pref.email ? "bg-primary" : "bg-slate-600")}
                        >
                          <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", pref.email ? "left-5" : "left-0.5")} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Push</span>
                        <button
                          onClick={() => togglePref(si, pi, "push")}
                          className={cn("w-10 h-5 rounded-full transition-colors relative flex-shrink-0", pref.push ? "bg-primary" : "bg-slate-600")}
                        >
                          <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", pref.push ? "left-5" : "left-0.5")} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-border-dark">
            <button className="px-5 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors">Annuler</button>
            <button
              onClick={async () => {
                const notifSettings = preferences.reduce((acc, s) => {
                  s.prefs.forEach((p) => {
                    acc[`${p.id}_email`] = p.email;
                    acc[`${p.id}_push`] = p.push;
                  });
                  return acc;
                }, {} as Record<string, boolean>);
                const success = await updateSettings(notifSettings);
                if (success) {
                  addToast("success", "Préférences enregistrées");
                } else {
                  addToast("error", "Erreur lors de la sauvegarde des préférences");
                }
              }}
              className="px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              Enregistrer les préférences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
