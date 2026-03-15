"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { useCurrencyStore, CURRENCIES } from "@/store/currency";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const TABS = [
  { id: "profil", label: "Profil Public", icon: "person" },
  { id: "securite", label: "Sécurité", icon: "shield" },
  { id: "paiements", label: "Paiements & Facturation", icon: "payments" },
  { id: "langues", label: "Langues & Devises", icon: "language" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PAYMENT_METHODS = [
  { id: "visa", label: "Visa •••• 4242", icon: "credit_card", default: true },
  { id: "orange", label: "Orange Money +221 77 123 4567", icon: "phone_android", default: false },
  { id: "paypal", label: "PayPal jean@email.com", icon: "account_balance_wallet", default: false },
];

export default function ParametresPage() {
  const { profile, updateProfile, settings, updateSettings, notificationSettings, updateNotificationSetting } = useDashboardStore();
  const { currency, setCurrency } = useCurrencyStore();
  const addToast = useToastStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<TabId>("profil");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    title: profile.title,
    bio: profile.bio,
    city: profile.city,
    country: profile.country,
  });

  function handleSaveProfile() {
    setSaving(true);
    setTimeout(() => {
      updateProfile(profileForm);
      setSaving(false);
      addToast("success", "Profil mis à jour avec succès !");
    }, 500);
  }

  function handlePasswordChange() {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      addToast("error", "Tous les champs sont requis");
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      addToast("error", "Les mots de passe ne correspondent pas");
      return;
    }
    if (passwordForm.new.length < 8) {
      addToast("error", "Le mot de passe doit faire au moins 8 caractères");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setPasswordForm({ current: "", new: "", confirm: "" });
      addToast("success", "Mot de passe modifié avec succès !");
    }, 600);
  }

  function handleDeleteAccount() {
    setShowDeleteConfirm(false);
    addToast("info", "Votre demande de suppression a été enregistrée. Vous recevrez un email de confirmation.");
  }

  function handleDisableAccount() {
    setShowDisableConfirm(false);
    addToast("info", "Votre compte a été désactivé. Il sera caché de la plateforme jusqu'à votre prochaine connexion.");
  }

  const categories = [...new Set(notificationSettings.map((n) => n.category))];

  return (
    <div className="max-w-6xl mx-auto">
      <ConfirmModal open={showDeleteConfirm} title="Supprimer le compte" variant="danger"
        message="Cette action est définitive. Toutes vos données, services et historique seront supprimées."
        confirmLabel="Supprimer définitivement" onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteConfirm(false)} />
      <ConfirmModal open={showDisableConfirm} title="Désactiver le compte" variant="danger"
        message="Votre profil sera caché de la plateforme jusqu'à votre prochaine connexion."
        confirmLabel="Désactiver" onConfirm={handleDisableAccount} onCancel={() => setShowDisableConfirm(false)} />

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Paramètres du compte</h2>
        <p className="text-slate-400 mt-1">Gérez vos informations personnelles, votre sécurité et vos préférences de paiement.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-56 flex-shrink-0 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-slate-400 hover:bg-neutral-dark hover:text-slate-200"
              )}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-border-dark">
            <Link href={`/freelances/${profile.username}`}
              className="flex items-center gap-2 px-4 py-3 border border-border-dark rounded-lg text-sm font-semibold text-slate-400 hover:border-primary/50 hover:text-primary transition-all">
              <span className="material-symbols-outlined text-lg">visibility</span>
              Voir mon profil public
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* PROFIL TAB */}
          {activeTab === "profil" && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
                <div className="flex items-center gap-6">
                  <div
                    className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold cursor-pointer overflow-hidden flex-shrink-0"
                    onMouseEnter={() => setAvatarHover(true)}
                    onMouseLeave={() => setAvatarHover(false)}
                  >
                    {profile.firstName[0]}{profile.lastName[0]}
                    {avatarHover && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h3>
                    <p className="text-sm text-slate-400">{profile.title} &bull; {profile.city}, {profile.country}</p>
                    <p className="text-xs text-primary mt-1">Profil complété à {profile.completionPercent}%</p>
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="ml-auto px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-all hidden sm:flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">save</span>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </div>

              {/* Profile Form */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Prenom</label>
                    <input value={profileForm.firstName} onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Nom</label>
                    <input value={profileForm.lastName} onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                    <input value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Telephone</label>
                    <input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Ville</label>
                    <input value={profileForm.city} onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pays</label>
                    <input value={profileForm.country} onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Titre professionnel</label>
                  <input value={profileForm.title} onChange={(e) => setProfileForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bio professionnelle</label>
                  <textarea value={profileForm.bio} onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))} rows={4}
                    className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
                </div>
                <button onClick={handleSaveProfile} disabled={saving}
                  className="sm:hidden px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-all w-full">
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          )}

          {/* SECURITE TAB */}
          {activeTab === "securite" && (
            <div className="space-y-6">
              {/* Password */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">lock</span>
                  Securite du compte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="password" placeholder="Mot de passe actuel" value={passwordForm.current}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  <input type="password" placeholder="Nouveau mot de passe" value={passwordForm.new}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, new: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={handlePasswordChange} disabled={saving}
                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
                    {saving ? "Modification..." : "Mettre a jour"}
                  </button>
                </div>
                <input type="password" placeholder="Confirmer le nouveau mot de passe" value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="w-full md:w-1/3 px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* 2FA Quick Toggle */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  Double authentification (2FA)
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      {settings.twoFactorEnabled ? "2FA active" : "2FA desactive"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Google Authenticator ou SMS</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/dashboard/securite"
                      className="text-xs text-primary font-semibold hover:underline">
                      Configuration avancee
                    </Link>
                    <button onClick={() => {
                      updateSettings({ twoFactorEnabled: !settings.twoFactorEnabled });
                      addToast("success", settings.twoFactorEnabled ? "2FA desactive" : "2FA active !");
                    }}
                      className={cn("relative w-11 h-6 rounded-full transition-colors",
                        settings.twoFactorEnabled ? "bg-primary" : "bg-border-dark"
                      )}>
                      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow"
                        style={{ left: settings.twoFactorEnabled ? "22px" : "2px" }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 space-y-3">
                  <h3 className="font-bold text-lg text-amber-400 flex items-center gap-2">
                    <span className="material-symbols-outlined">warning</span>
                    Desactiver le compte
                  </h3>
                  <p className="text-sm text-slate-400">
                    Votre profil sera cache de la plateforme jusqu&apos;a votre prochaine connexion.
                  </p>
                  <button onClick={() => setShowDisableConfirm(true)}
                    className="px-5 py-2.5 border border-amber-500/50 text-amber-400 font-bold rounded-lg text-sm hover:bg-amber-500/10 transition-all">
                    Desactiver
                  </button>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-3">
                  <h3 className="font-bold text-lg text-red-400 flex items-center gap-2">
                    <span className="material-symbols-outlined">delete_forever</span>
                    Supprimer le compte
                  </h3>
                  <p className="text-sm text-slate-400">
                    La suppression de votre compte est définitive et irréversible. Toutes vos données seront perdues.
                  </p>
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg text-sm hover:bg-red-600 transition-all">
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAIEMENTS TAB */}
          {activeTab === "paiements" && (
            <div className="space-y-6">
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">credit_card</span>
                    Methodes de paiement
                  </h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Ajouter
                  </button>
                </div>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <div key={method.id}
                      className="flex items-center gap-4 p-4 bg-neutral-dark border border-border-dark rounded-lg hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">{method.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{method.label}</p>
                        {method.default && (
                          <span className="text-[10px] font-bold text-primary uppercase">Par defaut</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.default && (
                          <button onClick={() => addToast("success", "Methode definie par defaut")}
                            className="text-xs text-primary font-semibold hover:underline">
                            Par defaut
                          </button>
                        )}
                        <button onClick={() => addToast("info", "Methode de paiement supprimee")}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  Historique de facturation
                </h3>
                <div className="divide-y divide-border-dark">
                  {[
                    { id: "INV-2026-003", date: "01/03/2026", amount: 15, status: "en_attente" },
                    { id: "INV-2026-002", date: "01/02/2026", amount: 15, status: "payee" },
                    { id: "INV-2026-001", date: "01/01/2026", amount: 15, status: "payee" },
                  ].map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold">{inv.id}</p>
                        <p className="text-xs text-slate-500">{inv.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full",
                          inv.status === "payee" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                        )}>
                          {inv.status === "payee" ? "Payee" : "En attente"}
                        </span>
                        <span className="text-sm font-bold">&euro;{inv.amount}</span>
                        <button className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all">
                          <span className="material-symbols-outlined text-lg">download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LANGUES & DEVISES TAB */}
          {activeTab === "langues" && (
            <div className="space-y-6">
              {/* Language */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">translate</span>
                  Langue de l&apos;interface
                </h3>
                <div className="flex gap-3">
                  {[
                    { code: "fr", label: "Francais", flag: "🇫🇷" },
                    { code: "en", label: "English", flag: "🇬🇧" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { updateSettings({ language: lang.code }); addToast("success", `Langue: ${lang.label}`); }}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-lg border text-sm font-semibold transition-all",
                        settings.language === lang.code
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border-dark text-slate-400 hover:border-primary/30"
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      {lang.label}
                      {settings.language === lang.code && (
                        <span className="material-symbols-outlined text-lg">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">monetization_on</span>
                  Devise preferee
                </h3>
                <select value={currency} onChange={(e) => { setCurrency(e.target.value as typeof currency); addToast("success", "Devise modifiee"); }}
                  className="w-full md:w-1/2 px-4 py-3 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} - {c.label}</option>)}
                </select>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Les conversions de devises sont approximatives et basees sur les taux du marche en temps reel.
                </p>
              </div>

              {/* Theme */}
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">palette</span>
                  Theme de l&apos;interface
                </h3>
                <div className="flex gap-3">
                  {[
                    { code: "sombre" as const, label: "Sombre", icon: "dark_mode" },
                    { code: "clair" as const, label: "Clair", icon: "light_mode" },
                  ].map((theme) => (
                    <button
                      key={theme.code}
                      onClick={() => { updateSettings({ theme: theme.code }); addToast("success", `Theme: ${theme.label}`); }}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-lg border text-sm font-semibold transition-all",
                        settings.theme === theme.code
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border-dark text-slate-400 hover:border-primary/30"
                      )}
                    >
                      <span className="material-symbols-outlined text-lg">{theme.icon}</span>
                      {theme.label}
                      {settings.theme === theme.code && (
                        <span className="material-symbols-outlined text-lg">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">notifications</span>
                  Preferences de notifications
                </h3>

                {/* Header row */}
                <div className="flex items-center justify-end gap-6 pr-2">
                  {(["email", "push", "sms"] as const).map((ch) => (
                    <span key={ch} className="text-[10px] font-bold text-slate-500 uppercase w-12 text-center">{ch}</span>
                  ))}
                </div>

                {categories.map((cat) => (
                  <div key={cat} className="space-y-3">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider border-b border-border-dark pb-2">{cat}</p>
                    {notificationSettings.filter((n) => n.category === cat).map((n) => (
                      <div key={n.id} className="flex items-center justify-between py-1">
                        <span className="text-sm flex-1">{n.label}</span>
                        <div className="flex items-center gap-6">
                          {(["email", "push", "sms"] as const).map((ch) => (
                            <label key={ch} className="w-12 flex justify-center cursor-pointer">
                              <input type="checkbox" checked={n[ch]}
                                onChange={(e) => {
                                  updateNotificationSetting(n.id, { [ch]: e.target.checked });
                                  addToast("info", `${n.label}: ${ch} ${e.target.checked ? "active" : "desactive"}`);
                                }}
                                className="w-4 h-4 rounded accent-primary cursor-pointer" />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
