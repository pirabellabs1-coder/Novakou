// Refonte style KAZA — apprenant parametres — 2026-06-07
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import AccountDeletionPanel from "@/components/account/AccountDeletionPanel";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import CountrySelect from "@/components/account/CountrySelect";
import ActiveSessions from "@/components/account/ActiveSessions";
import { KazaHero, KazaButton, KazaCard, KazaBadge } from "@/components/kaza";
import {
  Settings,
  User,
  Shield,
  Bell,
  Wallet,
  ChevronRight,
  Camera,
  Save,
  CheckCircle2,
  Mail,
  Lock,
  Smartphone,
  Waves,
  Plus,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";

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
  const [image, setImage] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "avatar");
      const uploadRes = await fetch("/api/upload/image", { method: "POST", body: form });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        setPhotoError(uploadJson.error ?? "Erreur d'upload");
        return;
      }
      // Save the returned URL on the user profile
      const saveRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: uploadJson.url }),
      });
      if (!saveRes.ok) {
        const saveJson = await saveRes.json().catch(() => ({}));
        setPhotoError(saveJson.error ?? "Impossible de sauvegarder la photo");
        return;
      }
      setImage(uploadJson.url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePhotoDelete() {
    setPhotoError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: null }),
      });
      if (res.ok) setImage("");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Erreur");
    }
  }

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleChangePassword() {
    setPwdMessage(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdMessage({ type: "error", text: "Remplissez tous les champs" });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMessage({ type: "error", text: "Le nouveau mot de passe doit faire au moins 8 caractères" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: "error", text: "Les deux nouveaux mots de passe ne correspondent pas" });
      return;
    }
    setPwdSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = await res.json();
      if (!res.ok) {
        setPwdMessage({ type: "error", text: j.error ?? "Erreur" });
        return;
      }
      setPwdMessage({ type: "success", text: "Mot de passe modifié avec succès" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdMessage(null), 5000);
    } catch (e) {
      setPwdMessage({ type: "error", text: e instanceof Error ? e.message : "Erreur réseau" });
    } finally {
      setPwdSubmitting(false);
    }
  }

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
        if (u.photo || u.image) setImage((u.photo ?? u.image) as string);
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

  const sidebarItems: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: "profil", label: "Profil", icon: User },
    { id: "securite", label: "Sécurité", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "paiements", label: "Paiements", icon: Wallet },
  ];

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Settings}
        title="Paramètres"
        subtitle="Gérez votre compte, sécurité, notifications et paiements"
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Sidebar nav ──────────────────────────────────────────── */}
        <aside className="w-full md:w-56 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <ul>
              {sidebarItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left transition-all duration-200 ${
                        i < sidebarItems.length - 1 ? "border-b border-slate-50" : ""
                      } ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#0b2540]"
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
                      {item.label}
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* PROFIL TAB */}
          {activeTab === "profil" && (
            <div className="space-y-5">
              {/* Avatar section */}
              <KazaCard title="Photo de profil">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={prenom || "Apprenant"}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-extrabold"
                        style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
                      >
                        {(prenom[0] ?? "A").toUpperCase()}{(nom[0] ?? "").toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      aria-label="Changer la photo"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0b2540] text-sm mb-1">{prenom || "Apprenant"} {nom}</p>
                    <p className="text-xs text-slate-500 mb-3">Apprenant · {email || "—"}</p>
                    <div className="flex gap-2 flex-wrap">
                      <KazaButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        variant="primary"
                        size="sm"
                        icon={uploadingPhoto ? Loader2 : Camera}
                      >
                        {uploadingPhoto ? "Envoi…" : "Changer la photo"}
                      </KazaButton>
                      {image && (
                        <KazaButton onClick={handlePhotoDelete} variant="ghost" size="sm" icon={Trash2}>
                          Supprimer
                        </KazaButton>
                      )}
                    </div>
                    {photoError && (
                      <p className="text-xs text-rose-600 mt-1.5">{photoError}</p>
                    )}
                  </div>
                </div>
              </KazaCard>

              {/* Personal info */}
              <KazaCard title="Informations personnelles">
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
                      <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">
                        Adresse email
                        <span className="ml-1.5 text-[10px] text-slate-500 font-normal">(non modifiable)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                    <KazaButton
                      onClick={handleSave}
                      disabled={saving}
                      variant="primary"
                      icon={saving ? Loader2 : Save}
                    >
                      {saving ? "Sauvegarde…" : "Sauvegarder"}
                    </KazaButton>
                    {saved && (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold animate-pulse">
                        <CheckCircle2 className="w-4 h-4" />
                        Modifications sauvegardées
                      </span>
                    )}
                  </div>
                </div>
              </KazaCard>
            </div>
          )}

          {/* SECURITE TAB */}
          {activeTab === "securite" && (
            <div className="space-y-5">
              {/* Password */}
              <KazaCard title="Mot de passe">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">Mot de passe actuel</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Minimum 8 caractères"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0b2540] mb-1.5">Confirmer le nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Répéter le nouveau mot de passe"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white transition-all"
                      />
                    </div>
                  </div>
                  {pwdMessage && (
                    <div
                      className={`px-4 py-3 rounded-xl text-sm ${
                        pwdMessage.type === "success"
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border border-rose-200 text-rose-800"
                      }`}
                    >
                      {pwdMessage.text}
                    </div>
                  )}
                  <KazaButton onClick={handleChangePassword} disabled={pwdSubmitting} variant="primary">
                    {pwdSubmitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}
                  </KazaButton>
                </div>
              </KazaCard>

              {/* 2FA — full setup flow */}
              <TwoFactorSetup />

              {/* Sessions — real login history */}
              <ActiveSessions />
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <KazaCard title="Préférences de notifications" subtitle="Choisissez comment vous souhaitez être notifié.">
              {/* Legend */}
              <div className="flex items-center gap-6 mb-5 pb-4 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium flex-1">Notification</span>
                <span className="text-xs text-slate-500 font-semibold w-12 text-center">Email</span>
                <span className="text-xs text-slate-500 font-semibold w-12 text-center">Push</span>
              </div>

              <div className="space-y-5">
                {notifs.map((n) => (
                  <div key={n.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0b2540]">{n.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(n.id, "email")}
                      className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                        n.email ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-all duration-300 ${
                          n.email ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => toggleNotif(n.id, "push")}
                      className={`w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                        n.push ? "bg-emerald-500" : "bg-slate-200"
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

              <KazaButton variant="primary" icon={Save} className="mt-7">
                Sauvegarder les préférences
              </KazaButton>
            </KazaCard>
          )}

          {/* PAIEMENTS TAB */}
          {activeTab === "paiements" && (
            <div className="space-y-5">
              <KazaCard title="Méthodes de paiement sauvegardées">
                <div className="space-y-3 mb-4">
                  {[
                    { Icon: Smartphone, label: "Orange Money", detail: "+225 07 00 XX XX XX", primary: true, color: "bg-orange-100 text-orange-600" },
                    { Icon: Waves, label: "Wave", detail: "+225 05 00 XX XX XX", primary: false, color: "bg-blue-100 text-blue-600" },
                  ].map((method, i) => {
                    const Icon = method.Icon;
                    return (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0b2540]">{method.label}</p>
                          <p className="text-xs text-slate-500">{method.detail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.primary && <KazaBadge variant="green" size="sm">Principale</KazaBadge>}
                          <button className="text-slate-500 hover:text-rose-500 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-600 hover:border-emerald-500/40 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <Plus className="w-4 h-4" />
                  Ajouter une méthode de paiement
                </button>
              </KazaCard>

              <KazaCard title="Historique de facturation">
                <div className="space-y-2">
                  {[
                    { ref: "FAC-2026-0412", date: "12 avr. 2026", label: "Formation — Algorithmes de vente", amount: 45000 },
                    { ref: "FAC-2026-0403", date: "3 avr. 2026", label: "Formation — UX/UI Figma", amount: 65000 },
                    { ref: "FAC-2026-0315", date: "15 mars 2026", label: "E-book — Copywriting Africain", amount: 8500 },
                  ].map((inv, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-3 border-b border-slate-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 tabular-nums mb-0.5">{inv.ref}</p>
                        <p className="text-sm font-semibold text-[#0b2540] truncate">{inv.label}</p>
                        <p className="text-xs text-slate-500">{inv.date}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0b2540]">{inv.amount.toLocaleString("fr-FR")} FCFA</p>
                          <p className="text-[10px] text-slate-500">≈ {Math.round(inv.amount / 655.957)} €</p>
                        </div>
                        <button className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </KazaCard>

              {/* Danger zone */}
              <AccountDeletionPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

