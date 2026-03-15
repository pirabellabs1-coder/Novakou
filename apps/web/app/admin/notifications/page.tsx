"use client";

import { useState } from "react";
import { useAdminStore } from "@/store/admin";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";

const TYPE_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  info: { label: "Information", cls: "bg-blue-500/20 text-blue-400", icon: "info" },
  success: { label: "Succes", cls: "bg-emerald-500/20 text-emerald-400", icon: "check_circle" },
  warning: { label: "Avertissement", cls: "bg-amber-500/20 text-amber-400", icon: "warning" },
  error: { label: "Erreur", cls: "bg-red-500/20 text-red-400", icon: "error" },
  annonce: { label: "Annonce", cls: "bg-primary/20 text-primary", icon: "campaign" },
  maintenance: { label: "Maintenance", cls: "bg-amber-500/20 text-amber-400", icon: "build" },
  fonctionnalite: { label: "Fonctionnalite", cls: "bg-blue-500/20 text-blue-400", icon: "new_releases" },
  promotion: { label: "Promotion", cls: "bg-emerald-500/20 text-emerald-400", icon: "local_offer" },
};

const TARGET_OPTIONS: { value: string; label: string; target: Record<string, unknown> }[] = [
  { value: "tous", label: "Tous les utilisateurs", target: {} },
  { value: "freelance", label: "Freelances", target: { role: "freelance" } },
  { value: "client", label: "Clients", target: { role: "client" } },
  { value: "agence", label: "Agences", target: { role: "agence" } },
  { value: "pro", label: "Abonnes Pro", target: { plan: "pro" } },
  { value: "business", label: "Abonnes Business", target: { plan: "business" } },
];

const CHANNEL_MAP: Record<string, { label: string; icon: string }> = {
  "in-app": { label: "In-app", icon: "notifications" },
  email: { label: "Email", icon: "mail" },
  push: { label: "Push", icon: "phone_android" },
};

interface SentEntry {
  id: string;
  title: string;
  message: string;
  type: string;
  targetLabel: string;
  channel: string;
  count: number;
  sentAt: string;
}

export default function AdminNotifications() {
  const { sendNotification } = useAdminStore();
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    targetKey: "tous",
    channel: "in-app",
  });

  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentEntry[]>([]);

  const selectedTarget = TARGET_OPTIONS.find((t) => t.value === form.targetKey) ?? TARGET_OPTIONS[0];

  async function handleSend() {
    if (!form.title.trim() || !form.message.trim()) {
      addToast("error", "Veuillez remplir le titre et le message");
      return;
    }

    setSending(true);
    const result = await sendNotification({
      title: form.title,
      message: form.message,
      type: form.type,
      target: selectedTarget.target,
      channel: form.channel,
    });
    setSending(false);

    if (result) {
      const entry: SentEntry = {
        id: `notif-${Date.now()}`,
        title: form.title,
        message: form.message,
        type: form.type,
        targetLabel: selectedTarget.label,
        channel: form.channel,
        count: result.count,
        sentAt: new Date().toISOString(),
      };
      setHistory((h) => [entry, ...h]);
      addToast("success", `Notification envoyee a ${result.count} utilisateur${result.count > 1 ? "s" : ""}`);
      setForm({ title: "", message: "", type: "info", targetKey: "tous", channel: "in-app" });
    } else {
      addToast("error", "Erreur lors de l'envoi de la notification");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications</span>
            Notifications &amp; Emails
          </h1>
          <p className="text-slate-400 text-sm mt-1">Envoyer des notifications ciblees et consulter l&apos;historique.</p>
        </div>
        {history.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-primary text-lg">send</span>
            <span className="text-slate-400">
              <span className="font-bold text-white">{history.length}</span> notification{history.length > 1 ? "s" : ""} envoyee{history.length > 1 ? "s" : ""} cette session
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Envoyees (session)", value: history.length, icon: "send", color: "text-primary" },
          { label: "Destinataires totaux", value: history.reduce((acc, h) => acc + h.count, 0), icon: "people", color: "text-blue-400" },
          { label: "In-app", value: history.filter((h) => h.channel === "in-app").length, icon: "notifications", color: "text-emerald-400" },
          { label: "Email", value: history.filter((h) => h.channel === "email").length, icon: "mail", color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-dark rounded-xl p-4 border border-border-dark">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
            <p className="text-xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send form */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Nouvelle notification
          </h2>

          <div className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Type</label>
              <div className="flex gap-2 flex-wrap">
                {(["info", "success", "warning", "error", "annonce", "promotion", "maintenance"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1",
                      form.type === t ? cn(TYPE_MAP[t].cls, "border-current") : "border-border-dark text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">{TYPE_MAP[t].icon}</span>
                    {TYPE_MAP[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Cible</label>
              <select
                value={form.targetKey}
                onChange={(e) => setForm((f) => ({ ...f, targetKey: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary"
              >
                {TARGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Canal</label>
              <div className="flex gap-2">
                {(["in-app", "email", "push"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, channel: c }))}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-1",
                      form.channel === c ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">{CHANNEL_MAP[c].icon}</span>
                    {CHANNEL_MAP[c].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Titre</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Titre de la notification..."
                className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none focus:border-primary placeholder:text-slate-500"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                placeholder="Contenu du message..."
                className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-white text-sm outline-none resize-none focus:border-primary placeholder:text-slate-500"
              />
            </div>

            {/* Preview */}
            {form.title && (
              <div className="p-4 rounded-lg border border-border-dark bg-background-dark/50">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Aperçu</p>
                <div className="flex items-start gap-3">
                  <span className={cn("material-symbols-outlined text-lg mt-0.5", TYPE_MAP[form.type]?.cls.split(" ")[1])}>{TYPE_MAP[form.type]?.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{form.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{form.message || "(pas de message)"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_MAP[form.type]?.cls)}>{TYPE_MAP[form.type]?.label}</span>
                      <span className="text-[10px] text-slate-500">{selectedTarget.label}</span>
                      <span className="text-[10px] text-slate-500">{CHANNEL_MAP[form.channel]?.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!form.title.trim() || !form.message.trim() || sending}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">{sending ? "hourglass_top" : "send"}</span>
              {sending ? "Envoi en cours..." : `Envoyer (${selectedTarget.label})`}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-5">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Historique (session)
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-600">notifications_off</span>
              <p className="text-sm text-slate-500 mt-2">Aucune notification envoyee cette session</p>
              <p className="text-xs text-slate-600 mt-1">Les notifications envoyees apparaitront ici.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {history.map((n) => (
                <div key={n.id} className="p-4 bg-background-dark/50 rounded-lg border border-border-dark hover:border-border-dark/80 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("material-symbols-outlined text-lg", TYPE_MAP[n.type]?.cls.split(" ")[1])}>{TYPE_MAP[n.type]?.icon}</span>
                      <h3 className="font-semibold text-sm text-white">{n.title}</h3>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(n.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_MAP[n.type]?.cls)}>{TYPE_MAP[n.type]?.label}</span>
                    <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-semibold">{n.targetLabel}</span>
                    <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">{CHANNEL_MAP[n.channel]?.icon}</span>
                      {CHANNEL_MAP[n.channel]?.label}
                    </span>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                      {n.count} destinataire{n.count > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
