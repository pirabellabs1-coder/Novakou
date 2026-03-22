"use client";

import { useState, useEffect } from "react";
import { useClientStore } from "@/store/client";
import { profileApi } from "@/lib/api-client";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS = [
  { key: "profil", label: "Profil Public", icon: "person" },
  { key: "securite", label: "Sécurité", icon: "lock" },
  { key: "paiements", label: "Paiements & Facturation", icon: "payments" },
  { key: "langues", label: "Langues & Devises", icon: "language" },
  { key: "notifications", label: "Notifications", icon: "notifications_active" },
];

const NOTIFICATION_ITEMS_DEFAULT = [
  { id: "1", label: "Nouvelles candidatures", desc: "Quand un freelance postule sur vos projets", email: true, push: true },
  { id: "2", label: "Messages reçus", desc: "Quand vous recevez un message", email: true, push: true },
  { id: "3", label: "Livraison commande", desc: "Quand un freelance livre une commande", email: true, push: false },
  { id: "4", label: "Paiement effectué", desc: "Confirmation de paiement", email: true, push: false },
  { id: "5", label: "Rappels de délais", desc: "Quand une deadline approche", email: false, push: true },
  { id: "6", label: "Newsletter", desc: "Actualités et conseils FreelanceHigh", email: false, push: false },
];

export default function ClientSettings() {
  const [activeSection, setActiveSection] = useState("profil");
  const { addToast } = useToastStore();
  const { updateSettings } = useClientStore();
  const [fetching, setFetching] = useState(true);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    bio: "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
  });

  const [language, setLanguage] = useState("fr");
  const [currency, setCurrency] = useState("FCFA");

  const [notifications, setNotifications] = useState(NOTIFICATION_ITEMS_DEFAULT);

  // Fetch profile on mount to pre-fill forms
  useEffect(() => {
    setFetching(true);
    profileApi
      .get()
      .then((profile) => {
        setProfileForm({
          fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "",
          email: profile.email || "",
          bio: profile.bio || "",
        });
      })
      .catch(() => {
        // Keep default empty values on error
      })
      .finally(() => setFetching(false));
  }, []);

  function toggleNotif(id: string, type: "email" | "push") {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, [type]: !n[type] } : n));
  }

  async function saveSection(section: string, data: Record<string, unknown>) {
    const success = await updateSettings(data);
    if (success) {
      addToast("success", `${section} mis à jour`);
    } else {
      addToast("error", `Erreur lors de la mise à jour de ${section.toLowerCase()}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configurez votre compte, votre sécurité et vos préférences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-2 space-y-1">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left",
                  activeSection === item.key
                    ? "bg-primary text-background-dark shadow-lg shadow-primary/20"
                    : "text-slate-400 hover:bg-primary/10 hover:text-white"
                )}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}

            <div className="border-t border-border-dark my-2 mx-2" />

            <button
              onClick={() => window.open("/client/profil", "_blank")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-primary/10 hover:text-white transition-all text-left"
            >
              <span className="material-symbols-outlined text-lg">open_in_new</span>
              Voir mon profil public
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Profil Public */}
          {activeSection === "profil" && (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Profil Public
              </h2>

              {fetching ? (
                <div className="space-y-4 animate-pulse">
                  <div className="flex items-center gap-5">
                    <div className="w-24 h-24 rounded-full bg-border-dark" />
                    <div className="space-y-2">
                      <div className="h-5 w-40 bg-border-dark rounded" />
                      <div className="h-4 w-32 bg-border-dark rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-border-dark rounded-xl" />
                    <div className="h-10 bg-border-dark rounded-xl" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-black ring-4 ring-primary/20">
                        {profileForm.fullName.split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                      </div>
                      <button
                        onClick={() => addToast("info", "Upload photo bientôt disponible")}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background-dark shadow-lg"
                      >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                      </button>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{profileForm.fullName || "Votre nom"}</p>
                      <p className="text-sm text-slate-400">Client FreelanceHigh</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Nom Complet</label>
                      <input
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Email</label>
                      <input
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                        type="email"
                        className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Bio Professionnelle</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const nameParts = profileForm.fullName.trim().split(/\s+/);
                      saveSection("Profil", {
                        firstName: nameParts[0] || "",
                        lastName: nameParts.slice(1).join(" ") || "",
                        email: profileForm.email,
                        bio: profileForm.bio,
                      });
                    }}
                    className="px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
                  >
                    Enregistrer les modifications
                  </button>
                </>
              )}
            </div>
          )}

          {/* Securite */}
          {activeSection === "securite" && (
            <div className="space-y-6">
              <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">lock</span>
                  Sécurité du compte
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm((s) => ({ ...s, currentPassword: e.target.value }))}
                      placeholder="--------"
                      className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm((s) => ({ ...s, newPassword: e.target.value }))}
                      placeholder="--------"
                      className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-600 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        saveSection("Sécurité", {
                          currentPassword: securityForm.currentPassword,
                          newPassword: securityForm.newPassword,
                        });
                        setSecurityForm((s) => ({ ...s, currentPassword: "", newPassword: "" }));
                      }}
                      className="w-full px-4 py-2.5 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary hover:text-background-dark transition-all"
                    >
                      Mettre à jour
                    </button>
                  </div>
                </div>

                <div className="pt-5 border-t border-border-dark">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">Double authentification (2FA)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Protection supplémentaire via Google Authenticator ou SMS</p>
                    </div>
                    <button
                      onClick={() => {
                        const newValue = !securityForm.twoFactor;
                        setSecurityForm((s) => ({ ...s, twoFactor: newValue }));
                        saveSection("2FA", { twoFactor: newValue });
                      }}
                      className={cn("w-12 h-6 rounded-full transition-colors relative flex-shrink-0", securityForm.twoFactor ? "bg-primary" : "bg-slate-600")}
                    >
                      <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", securityForm.twoFactor ? "left-6" : "left-0.5")} />
                    </button>
                  </div>
                </div>

                <div className="pt-5 border-t border-border-dark">
                  <p className="font-bold text-white text-sm mb-3">Sessions actives</p>
                  <div className="space-y-2">
                    {[
                      { device: "Chrome - Windows", location: "Dakar, Sénégal", time: "Actuellement actif", current: true },
                      { device: "Safari - iPhone", location: "Dakar, Sénégal", time: "Il y a 2 heures", current: false },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-background-dark rounded-lg border border-border-dark">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-400">{s.device.includes("iPhone") ? "phone_iphone" : "laptop"}</span>
                          <div>
                            <p className="text-sm font-medium text-white">{s.device}</p>
                            <p className="text-xs text-slate-500">{s.location} &middot; {s.time}</p>
                          </div>
                        </div>
                        {s.current ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Session actuelle</span>
                        ) : (
                          <button
                            onClick={() => addToast("success", "Session révoquée")}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold"
                          >
                            Révoquer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paiements */}
          {activeSection === "paiements" && (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Paiements & Facturation
              </h2>
              <p className="text-sm text-slate-400">Vos méthodes de paiement enregistrées</p>
              <div className="space-y-3">
                {[
                  { icon: "credit_card", name: "Visa ---- 4242", detail: "Expire 12/28", isDefault: true },
                  { icon: "smartphone", name: "Orange Money", detail: "+221 77 --- -- 67", isDefault: false },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-background-dark rounded-xl border border-border-dark">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", i === 0 ? "bg-blue-500/10" : "bg-primary/10")}>
                      <span className={cn("material-symbols-outlined", i === 0 ? "text-blue-400" : "text-primary")}>{m.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.detail}</p>
                    </div>
                    {m.isDefault && <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">Par défaut</span>}
                    <button className="text-slate-500 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addToast("info", "Redirection vers la page Paiements...")}
                className="w-full py-3 border-2 border-dashed border-border-dark rounded-xl text-sm font-semibold text-slate-400 hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Ajouter une méthode de paiement
              </button>
            </div>
          )}

          {/* Langues & Devises */}
          {activeSection === "langues" && (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">language</span>
                Langue et Devise
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
                    <span className="material-symbols-outlined text-sm">translate</span>
                    Langue de l&apos;interface
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { code: "fr", label: "Français" },
                      { code: "en", label: "English" },
                    ].map((l) => (
                      <button
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all",
                          language === l.code
                            ? "border-primary bg-primary/10"
                            : "border-border-dark hover:border-primary/40"
                        )}
                      >
                        <p className="font-bold text-white text-sm">{l.label}</p>
                        {language === l.code && (
                          <span className="material-symbols-outlined text-primary text-sm mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
                    <span className="material-symbols-outlined text-sm">monetization_on</span>
                    Devise préférée
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="GBP">GBP (Livre sterling)</option>
                    <option value="MAD">MAD (Dirham marocain)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-2">Note : Les conversions sont approximatives et basées sur le taux du marché en temps réel.</p>
                </div>
              </div>
              <button
                onClick={() => saveSection("Préférences", { language, currency })}
                className="px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
              >
                Enregistrer les préférences
              </button>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">notifications_active</span>
                Notifications
              </h2>
              <p className="text-sm text-slate-400">Choisissez comment recevoir vos notifications</p>

              <div className="space-y-1">
                <div className="flex items-center justify-end gap-10 pr-4 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Email</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Push</span>
                </div>
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-background-dark/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{n.label}</p>
                      <p className="text-xs text-slate-500">{n.desc}</p>
                    </div>
                    <div className="flex items-center gap-10">
                      <button
                        onClick={() => toggleNotif(n.id, "email")}
                        className={cn("w-10 h-5 rounded-full transition-colors relative flex-shrink-0", n.email ? "bg-primary" : "bg-slate-600")}
                      >
                        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", n.email ? "left-5.5" : "left-0.5")} />
                      </button>
                      <button
                        onClick={() => toggleNotif(n.id, "push")}
                        className={cn("w-10 h-5 rounded-full transition-colors relative flex-shrink-0", n.push ? "bg-primary" : "bg-slate-600")}
                      >
                        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", n.push ? "left-5.5" : "left-0.5")} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const notifSettings = notifications.reduce((acc, n) => {
                    acc[`notif_${n.id}_email`] = n.email;
                    acc[`notif_${n.id}_push`] = n.push;
                    return acc;
                  }, {} as Record<string, boolean>);
                  saveSection("Notifications", notifSettings);
                }}
                className="px-6 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
              >
                Enregistrer les notifications
              </button>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-6">
            <h3 className="font-bold text-red-400 flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-red-400">warning</span>
              Désactiver le compte
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Ceci masquera votre profil de la plateforme jusqu&apos;à votre prochaine connexion.
            </p>
            <button
              onClick={() => addToast("info", "Veuillez contacter le support pour désactiver votre compte")}
              className="px-5 py-2 border border-red-500/40 text-red-400 text-sm font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-all"
            >
              Désactiver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
