"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { profileApi } from "@/lib/api-client";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "agence", label: "Informations", icon: "business" },
  { key: "roles", label: "Rôles & Permissions", icon: "shield" },
  { key: "plan", label: "Abonnement", icon: "loyalty" },
  { key: "paiements", label: "Paiements", icon: "credit_card" },
  { key: "notifications", label: "Notifications", icon: "notifications" },
  { key: "danger", label: "Zone danger", icon: "warning" },
];
const PERMISSIONS = ["Voir projets", "Créer projets", "Gérer équipe", "Voir finances", "Retirer fonds", "Modifier paramètres", "Supprimer contenu"];
const DEFAULT_PERMS: Record<string, boolean[]> = {
  Admin: [true, true, true, true, true, true, true],
  Manager: [true, true, true, true, false, false, false],
  Membre: [true, true, false, false, false, false, false],
  Commercial: [true, false, false, true, false, false, false],
};
const PLAN_FEATURES = ["Membres : jusqu'à 20", "Commission : 8%", "Services actifs : illimité", "Boosts publicitaires : 10/mois", "Certification IA", "Clés API & Webhooks", "Stockage ressources : 50 GB", "Support prioritaire"];
const NOTIF_TYPES = [
  { id: "new_order", label: "Nouvelle commande" },
  { id: "member_joined", label: "Membre rejoint l'agence" },
  { id: "payment_received", label: "Paiement reçu" },
  { id: "dispute_opened", label: "Litige ouvert" },
  { id: "weekly_report", label: "Rapport hebdomadaire" },
  { id: "deadline_near", label: "Délai de livraison proche" },
  { id: "new_client_message", label: "Nouveau message client" },
];

interface NotifSetting { id: string; label: string; email: boolean; push: boolean; sms: boolean }
const inputCls = "w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50";
const labelCls = "block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5";
const saveBtnCls = "px-6 py-2.5 bg-primary text-background-dark rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50";

export default function AgenceParametres() {
  const [section, setSection] = useState("agence");
  const { data: session } = useSession();
  const { members } = useAgencyStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [agency, setAgency] = useState({ name: "", description: "", sector: "", website: "", country: "", siret: "" });
  const [payments, setPayments] = useState({ iban: "", paypalEmail: "", orangeMoney: "", waveMoney: "" });
  const [permissions, setPermissions] = useState<Record<string, boolean[]>>(DEFAULT_PERMS);
  // Notifications critiques activées par défaut (email + push)
  const CRITICAL_NOTIFS = ["new_order", "dispute_opened", "payment_received", "new_client_message"];
  const [notifs, setNotifs] = useState<NotifSetting[]>(NOTIF_TYPES.map((n) => ({
    ...n,
    email: CRITICAL_NOTIFS.includes(n.id),
    push: CRITICAL_NOTIFS.includes(n.id),
    sms: false,
  })));

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await profileApi.get();
      const raw = profile as unknown as Record<string, unknown>;
      setAgency({
        name: session?.user?.name || (raw.agencyName as string) || "",
        description: (raw.bio as string) || "",
        sector: (raw.sector as string) || "",
        website: (raw.website as string) || (raw.links as Record<string, string>)?.portfolio || "",
        country: (raw.country as string) || "",
        siret: (raw.siret as string) || "",
      });
      if (raw.paymentInfo) {
        const pi = raw.paymentInfo as Record<string, string>;
        setPayments({ iban: pi.iban || "", paypalEmail: pi.paypalEmail || "", orangeMoney: pi.orangeMoney || "", waveMoney: pi.waveMoney || "" });
      }
      if (raw.permissions) setPermissions(raw.permissions as Record<string, boolean[]>);
      if (raw.notificationSettings && Array.isArray(raw.notificationSettings)) setNotifs(raw.notificationSettings as NotifSetting[]);
    } catch { /* New agency or API unavailable — keep defaults */ } finally { setLoading(false); }
  }, [session?.user?.name]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const saveToApi = async (data: Record<string, unknown>, msg: string) => {
    setSaving(true);
    try { await profileApi.update(data); addToast("success", msg); }
    catch { addToast("error", "Erreur lors de la sauvegarde"); }
    finally { setSaving(false); }
  };

  const togglePerm = (role: string, idx: number) => {
    setPermissions((prev) => ({ ...prev, [role]: prev[role].map((v, i) => (i === idx ? !v : v)) }));
  };
  const toggleNotif = (id: string, ch: "email" | "push" | "sms") => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, [ch]: !n[ch] } : n)));
  };

  const initials = agency.name ? agency.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "AG";

  if (loading) {
    return <div className="flex items-center justify-center h-96"><span className="material-symbols-outlined text-primary animate-spin text-3xl">progress_activity</span></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configurez votre agence, les rôles et les préférences.{members.length > 0 && <span className="ml-2 text-slate-500">({members.length} membres)</span>}</p>
      </div>
      <div className="flex gap-6">
        {/* Left menu */}
        <div className="w-56 shrink-0 space-y-1">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => setSection(s.key)} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-left", section === s.key ? "bg-primary text-background-dark" : "text-slate-400 hover:text-white hover:bg-neutral-dark")}>
              <span className="material-symbols-outlined text-lg">{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 bg-neutral-dark rounded-xl border border-border-dark p-6">
          {/* Informations agence */}
          {section === "agence" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-bold text-white mb-4">Informations de l&apos;agence</h2>
              <div>
                <label className={labelCls}>Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black">{initials}</div>
                  <button onClick={() => addToast("info", "Upload de logo bientôt disponible")} className="text-xs text-primary font-semibold hover:underline">Changer le logo</button>
                </div>
              </div>
              <div><label className={labelCls}>Nom de l&apos;agence</label><input value={agency.name} onChange={(e) => setAgency((a) => ({ ...a, name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Description</label><textarea value={agency.description} onChange={(e) => setAgency((a) => ({ ...a, description: e.target.value }))} rows={3} className={cn(inputCls, "resize-none")} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Secteur</label><input value={agency.sector} onChange={(e) => setAgency((a) => ({ ...a, sector: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Pays</label><input value={agency.country} onChange={(e) => setAgency((a) => ({ ...a, country: e.target.value }))} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Site web</label><input value={agency.website} onChange={(e) => setAgency((a) => ({ ...a, website: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>SIRET (optionnel)</label><input value={agency.siret} onChange={(e) => setAgency((a) => ({ ...a, siret: e.target.value }))} placeholder="XXX XXX XXX XXXXX" className={inputCls} /></div>
              <button disabled={saving} onClick={() => saveToApi({ agencyName: agency.name, bio: agency.description, sector: agency.sector, website: agency.website, country: agency.country, siret: agency.siret }, "Informations sauvegardées")} className={saveBtnCls}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          )}

          {/* Roles & Permissions */}
          {section === "roles" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white mb-4">Rôles & Permissions</h2>
              <p className="text-sm text-slate-400">Définissez les permissions pour chaque rôle de l&apos;agence.</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                    <th className="px-4 py-3 text-left font-semibold">Permission</th>
                    {Object.keys(permissions).map((r) => <th key={r} className="px-4 py-3 text-center font-semibold">{r}</th>)}
                  </tr></thead>
                  <tbody>{PERMISSIONS.map((perm, idx) => (
                    <tr key={perm} className="border-b border-border-dark/50">
                      <td className="px-4 py-3 text-sm text-white font-medium">{perm}</td>
                      {Object.keys(permissions).map((role) => (
                        <td key={role} className="px-4 py-3 text-center">
                          <button onClick={() => togglePerm(role, idx)} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", permissions[role][idx] ? "bg-primary/20 text-primary" : "bg-border-dark text-slate-500 hover:text-slate-300")}>
                            <span className="material-symbols-outlined text-lg">{permissions[role][idx] ? "check" : "close"}</span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <button disabled={saving} onClick={() => saveToApi({ permissions }, "Permissions mises à jour")} className={saveBtnCls}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          )}

          {/* Plan */}
          {section === "plan" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white mb-4">Abonnement</h2>
              <div className="bg-primary/10 rounded-xl border border-primary/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div><p className="text-xl font-black text-white">Plan Agence</p><p className="text-sm text-slate-400">99/mois - Commission 8%</p></div>
                  <span className="text-xs bg-primary text-background-dark px-3 py-1.5 rounded-full font-bold">Actif</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PLAN_FEATURES.map((f) => <div key={f} className="flex items-center gap-2 text-sm text-slate-300"><span className="material-symbols-outlined text-primary text-sm">check_circle</span>{f}</div>)}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => addToast("info", "Changement de plan en cours de développement")} className="px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white font-semibold hover:bg-border-dark transition-colors">Changer de plan</button>
                <button onClick={() => addToast("info", "Annulation du plan en cours de développement")} className="px-4 py-2.5 text-red-400 text-sm font-semibold hover:text-red-300 transition-colors">Annuler l&apos;abonnement</button>
              </div>
            </div>
          )}

          {/* Paiements */}
          {section === "paiements" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-bold text-white mb-4">Méthodes de paiement & retrait</h2>
              <div><label className={labelCls}>IBAN</label><input value={payments.iban} onChange={(e) => setPayments((p) => ({ ...p, iban: e.target.value }))} placeholder="FR76 XXXX XXXX XXXX XXXX XXX" className={inputCls} /></div>
              <div><label className={labelCls}>Email PayPal</label><input value={payments.paypalEmail} onChange={(e) => setPayments((p) => ({ ...p, paypalEmail: e.target.value }))} placeholder="agence@exemple.com" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Orange Money</label><input value={payments.orangeMoney} onChange={(e) => setPayments((p) => ({ ...p, orangeMoney: e.target.value }))} placeholder="+221 77 XXX XX XX" className={inputCls} /></div>
                <div><label className={labelCls}>Wave</label><input value={payments.waveMoney} onChange={(e) => setPayments((p) => ({ ...p, waveMoney: e.target.value }))} placeholder="+221 76 XXX XX XX" className={inputCls} /></div>
              </div>
              <button disabled={saving} onClick={() => saveToApi({ paymentInfo: payments }, "Méthodes de paiement sauvegardées")} className={saveBtnCls}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white mb-4">Notifications</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                    <th className="px-4 py-3 text-left font-semibold">Événement</th>
                    <th className="px-4 py-3 text-center font-semibold">Email</th>
                    <th className="px-4 py-3 text-center font-semibold">Push</th>
                    <th className="px-4 py-3 text-center font-semibold">SMS</th>
                  </tr></thead>
                  <tbody>{notifs.map((n) => (
                    <tr key={n.id} className="border-b border-border-dark/50">
                      <td className="px-4 py-3 text-sm text-white font-medium">{n.label}</td>
                      {(["email", "push", "sms"] as const).map((ch) => (
                        <td key={ch} className="px-4 py-3 text-center">
                          <button onClick={() => toggleNotif(n.id, ch)} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", n[ch] ? "bg-primary/20 text-primary" : "bg-border-dark text-slate-500")}>
                            <span className="material-symbols-outlined text-lg">{n[ch] ? "check" : "close"}</span>
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <button disabled={saving} onClick={() => saveToApi({ notificationSettings: notifs }, "Notifications mises à jour")} className={saveBtnCls}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          )}

          {/* Zone danger */}
          {section === "danger" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-bold text-white mb-4">Zone danger</h2>
              <div className="p-5 bg-red-500/5 rounded-xl border border-red-500/20">
                <h3 className="text-sm font-bold text-red-400 mb-2">Suspendre l&apos;agence</h3>
                <p className="text-xs text-slate-400 mb-3">Mettre l&apos;agence en pause désactive tous les services et rend le profil invisible. Les commandes en cours seront maintenues.</p>
                <button onClick={() => addToast("info", "Suspension en cours de développement")} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspendre l&apos;agence</button>
              </div>
              <div className="p-5 bg-red-500/5 rounded-xl border border-red-500/20">
                <h3 className="text-sm font-bold text-red-400 mb-2">Supprimer l&apos;agence</h3>
                <p className="text-xs text-slate-400 mb-3">Cette action est irréversible. Toutes les données, services, historiques et accès des membres seront définitivement supprimés.</p>
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors">Supprimer définitivement</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-neutral-dark rounded-2xl border border-red-500/30 p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><span className="material-symbols-outlined text-red-400">warning</span></div>
              <h3 className="text-lg font-bold text-white">Confirmer la suppression</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">Êtes-vous sûr de vouloir supprimer définitivement votre agence ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors">Annuler</button>
              <button onClick={async () => { try { await profileApi.update({ deleted: true }); addToast("error", "Agence supprimée"); } catch { addToast("error", "Erreur lors de la suppression"); } setShowDeleteConfirm(false); }} className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-all">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
