"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AccountDeletionPanel from "@/components/account/AccountDeletionPanel";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import CountrySelect from "@/components/account/CountrySelect";
import ActiveSessions from "@/components/account/ActiveSessions";

type SettingsTab = "profil" | "securite" | "notifications" | "paiements";

interface NotifPref {
  id: string;
  label: string;
  desc: string;
  email: boolean;
  push: boolean;
}

export default function ParametresPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profil");

  // Profil — prefilled with real user data
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user data from the API (authoritative) — session only has name/email.
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const j = await res.json();
        const u = j?.data ?? j?.user ?? j;
        if (cancelled || !u) return;
        const parts = (u.name ?? "").trim().split(/\s+/);
        setPrenom(parts[0] ?? "");
        setNom(parts.slice(1).join(" ") ?? "");
        if (u.phone) setPhone(u.phone);
        if (u.country) setCountry(u.country);
        if (u.bio) setBio(u.bio);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const email = session?.user?.email ?? "";

  // (2FA state managed inside TwoFactorSetup component)

  // Notifications
  const [notifs, setNotifs] = useState<NotifPref[]>([
    { id: "new_lesson", label: "Nouvelle leçon disponible", desc: "Quand une leçon est ajoutée à une de vos formations", email: true, push: true },
    { id: "order_confirm", label: "Confirmation de commande", desc: "Reçu de paiement et accès accordé", email: true, push: false },
    { id: "promo", label: "Promotions & offres", desc: "Réductions et offres spéciales", email: false, push: false },
    { id: "newsletter", label: "Newsletter Novakou", desc: "Conseils, success stories et mises à jour plateforme", email: true, push: false },
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fullName = `${prenom} ${nom}`.trim();
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone: phone.trim(),
          country: country.trim(),
          bio: bio.trim(),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (id: string, field: "email" | "push") => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [field]: !n[field] } : n))
    );
  };

  const sidebarItems: { id: SettingsTab; label: string; icon: string }[] = [
    { id: "profil", label: "Profil", icon: "person" },
    { id: "securite", label: "Sécurité", icon: "shield" },
    { id: "notifications", label: "Notifications", icon: "notifications" },
    { id: "paiements", label: "Paiements", icon: "account_balance_wallet" },
  ];

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Paramètres</h1>
        <p className="text-sm text-[#5c647a] mt-1">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Sidebar nav ──────────────────────────────────────────── */}
        <aside className="w-full md:w-52 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul>
              {sidebarItems.map((item, i) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left transition-all duration-200 ${
                      i < sidebarItems.length - 1 ? "border-b border-gray-50" : ""
                    } ${
                      activeTab === item.id
                        ? "bg-[#006e2f]/8 text-[#006e2f] font-semibold"
                        : "text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                        activeTab === item.id ? "text-[#006e2f]" : "text-[#5c647a]"
                      }`}
                      style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {activeTab === item.id && (
                      <span className="ml-auto material-symbols-outlined text-[16px] text-[#006e2f]">
                        chevron_right
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* PROFIL TAB */}
          {activeTab === "profil" && (
            <div className="space-y-5">
              {/* Avatar section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-[#191c1e] mb-5">Photo de profil</h2>
                <div className="flex items-center gap-5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-extrabold"
                      style={{ background: "linear-gradient(135deg, #006e2f 0%, #22c55e 100%)" }}
                    >
                      {(prenom[0] ?? "A").toUpperCase()}{(nom[0] ?? "").toUpperCase()}
                    </div>
                    <button
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#006e2f] rounded-full flex items-center justify-center border-2 border-white hover:bg-[#005a26] transition-colors"
                      aria-label="Changer la photo"
                    >
                      <span className="material-symbols-outlined text-white text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        photo_camera
                      </span>
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-[#191c1e] text-sm mb-1">{prenom || "Apprenant"} {nom}</p>
                    <p className="text-xs text-[#5c647a] mb-3">Apprenant · {email || "—"}</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                        Changer la photo
                      </button>
                      <button className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5c647a] border border-gray-200 hover:bg-gray-50 transition-colors">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-[#191c1e] mb-5">Informations personnelles</h2>
                <div className="space-y-4">
                  {/* Name row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Prénom</label>
                      <input
                        type="text"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nom</label>
                      <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Email (disabled) + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                        Adresse email
                        <span className="ml-1.5 text-[10px] text-[#5c647a] font-normal">(non modifiable)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[17px] text-gray-400">
                          mail
                        </span>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm text-[#5c647a] bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+221 77 123 45 67"
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                      Biographie
                      <span className="ml-1.5 text-[10px] text-[#5c647a] font-normal">{bio.length}/250</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 250))}
                      rows={3}
                      placeholder="Décrivez-vous en quelques mots..."
                      className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none transition-all bg-white"
                    />
                  </div>

                  {/* Country & language row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Pays</label>
                      <CountrySelect
                        value={country}
                        onChange={setCountry}
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white transition-all"
                        includeBlank
                        placeholder="Sélectionnez votre pays"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Langue préférée</label>
                      <select className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white transition-all">
                        <option>Français</option>
                        <option>English</option>
                      </select>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                    >
                      <span className={`material-symbols-outlined text-[17px] ${saving ? "animate-spin" : ""}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {saving ? "progress_activity" : "save"}
                      </span>
                      {saving ? "Sauvegarde…" : "Sauvegarder"}
                    </button>
                    {saved && (
                      <span className="flex items-center gap-1.5 text-sm text-[#006e2f] font-semibold animate-pulse">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Modifications sauvegardées
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITE TAB */}
          {activeTab === "securite" && (
            <div className="space-y-5">
              {/* Password */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-[#191c1e] mb-5">Mot de passe</h2>
                <div className="space-y-4">
                  {[
                    { label: "Mot de passe actuel", id: "current" },
                    { label: "Nouveau mot de passe", id: "new" },
                    { label: "Confirmer le nouveau mot de passe", id: "confirm" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">{field.label}</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[17px] text-[#5c647a]">lock</span>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white transition-all"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                  >
                    Mettre à jour le mot de passe
                  </button>
                </div>
              </div>

              {/* 2FA — full setup flow */}
              <TwoFactorSetup />


              {/* Sessions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-[#191c1e] mb-4">Sessions actives</h2>
                <div className="space-y-3">
                  {[
                    { device: "Chrome · Windows 11", location: "Abidjan, CI", date: "Maintenant", current: true },
                    { device: "Safari · iPhone 15", location: "Abidjan, CI", date: "Il y a 2h", current: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${session.current ? "bg-[#006e2f]/10" : "bg-gray-100"}`}>
                          <span className={`material-symbols-outlined text-[18px] ${session.current ? "text-[#006e2f]" : "text-[#5c647a]"}`}>
                            {session.device.includes("iPhone") ? "phone_iphone" : "computer"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#191c1e]">{session.device}</p>
                          <p className="text-[11px] text-[#5c647a]">{session.location} · {session.date}</p>
                        </div>
                      </div>
                      {session.current ? (
                        <span className="text-[10px] font-bold bg-[#006e2f]/10 text-[#006e2f] px-2.5 py-1 rounded-full">Actif</span>
                      ) : (
                        <button className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
                          Révoquer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#191c1e] mb-1">Préférences de notifications</h2>
              <p className="text-sm text-[#5c647a] mb-6">Choisissez comment vous souhaitez être notifié.</p>

              {/* Legend */}
              <div className="flex items-center gap-6 mb-5 pb-4 border-b border-gray-100">
                <span className="text-xs text-[#5c647a] font-medium flex-1">Notification</span>
                <span className="text-xs text-[#5c647a] font-semibold w-12 text-center">Email</span>
                <span className="text-xs text-[#5c647a] font-semibold w-12 text-center">Push</span>
              </div>

              <div className="space-y-5">
                {notifs.map((n) => (
                  <div key={n.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#191c1e]">{n.label}</p>
                      <p className="text-xs text-[#5c647a] mt-0.5 leading-relaxed">{n.desc}</p>
                    </div>
                    {/* Email toggle */}
                    <button
                      onClick={() => toggleNotif(n.id, "email")}
                      className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                        n.email ? "bg-[#006e2f]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-all duration-300 ${
                          n.email ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                    {/* Push toggle */}
                    <button
                      onClick={() => toggleNotif(n.id, "push")}
                      className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                        n.push ? "bg-[#006e2f]" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-all duration-300 ${
                          n.push ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="mt-7 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                Sauvegarder les préférences
              </button>
            </div>
          )}

          {/* PAIEMENTS TAB */}
          {activeTab === "paiements" && (
            <div className="space-y-5">
              {/* Payment methods */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-[#191c1e] mb-4">Méthodes de paiement sauvegardées</h2>
                <div className="space-y-3 mb-4">
                  {[
                    { icon: "phone_android", label: "Orange Money", detail: "+225 07 00 XX XX XX", primary: true, color: "bg-orange-100 text-orange-600" },
                    { icon: "waves", label: "Wave", detail: "+225 05 00 XX XX XX", primary: false, color: "bg-blue-100 text-blue-600" },
                  ].map((method, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method.color}`}>
                        <span className="material-symbols-outlined text-[20px]">{method.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#191c1e]">{method.label}</p>
                        <p className="text-xs text-[#5c647a]">{method.detail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.primary && (
                          <span className="text-[10px] font-bold bg-[#006e2f]/10 text-[#006e2f] px-2 py-0.5 rounded-full">
                            Principale
                          </span>
                        )}
                        <button className="text-[#5c647a] hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-[#5c647a] hover:border-[#006e2f]/40 hover:text-[#006e2f] hover:bg-[#006e2f]/5 transition-all">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Ajouter une méthode de paiement
                </button>
              </div>

              {/* Billing history */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-[#191c1e] mb-4">Historique de facturation</h2>
                <div className="space-y-2">
                  {[
                    { ref: "FAC-2026-0412", date: "12 avr. 2026", label: "Formation — Algorithmes de vente", amount: 45000 },
                    { ref: "FAC-2026-0403", date: "3 avr. 2026", label: "Formation — UX/UI Figma", amount: 65000 },
                    { ref: "FAC-2026-0315", date: "15 mars 2026", label: "E-book — Copywriting Africain", amount: 8500 },
                  ].map((inv, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#5c647a] tabular-nums mb-0.5">{inv.ref}</p>
                        <p className="text-sm font-semibold text-[#191c1e] truncate">{inv.label}</p>
                        <p className="text-xs text-[#5c647a]">{inv.date}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#191c1e]">{inv.amount.toLocaleString("fr-FR")} FCFA</p>
                          <p className="text-[10px] text-[#5c647a]">≈ {Math.round(inv.amount / 655.957)} €</p>
                        </div>
                        <button className="p-1.5 rounded-lg text-[#5c647a] hover:text-[#006e2f] hover:bg-[#006e2f]/5 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <AccountDeletionPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

