// Refonte design "Stitch" — apprenant parametres — vert Novakou — 2026-06-13
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import AccountDeletionPanel from "@/components/account/AccountDeletionPanel";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import CountrySelect from "@/components/account/CountrySelect";
import ActiveSessions from "@/components/account/ActiveSessions";
import { StCard, StPageHeader, StButton, StChip, StSectionTitle, ST } from "@/components/stitch";
import {
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

const FIELD_CLASS =
  "w-full px-3.5 py-3 rounded-[12px] text-[13.5px] font-semibold focus:outline-none focus:ring-2 transition-all bg-white";
const FIELD_STYLE: React.CSSProperties = {
  border: "1px solid #dde6e0",
  color: ST.text,
};

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Paramètres"
          subtitle="Gérez votre compte, sécurité, notifications et paiements"
        />

        <div className="flex flex-col md:flex-row gap-6">
          {/* ── Sidebar nav ──────────────────────────────────────────── */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <StCard noPadding className="overflow-hidden">
              <ul>
                {sidebarItems.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-[13px] font-bold text-left transition-all duration-200"
                        style={{
                          borderBottom: i < sidebarItems.length - 1 ? `1px solid ${ST.divider}` : undefined,
                          background: isActive ? ST.greenSoft : undefined,
                          color: isActive ? ST.green : ST.textSecondary,
                        }}
                      >
                        <Icon size={20} className="flex-shrink-0" style={{ color: isActive ? ST.green : ST.textMuted }} />
                        {item.label}
                        {isActive && <ChevronRight size={16} className="ml-auto" style={{ color: ST.green }} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </StCard>
          </aside>

          {/* ── Main content ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* PROFIL TAB */}
            {activeTab === "profil" && (
              <div className="space-y-5">
                {/* Avatar section */}
                <StCard>
                  <StSectionTitle>Photo de profil</StSectionTitle>
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
                          style={{ background: ST.gradient }}
                        >
                          {(prenom[0] ?? "A").toUpperCase()}{(nom[0] ?? "").toUpperCase()}
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white transition-colors disabled:opacity-50 hover:opacity-90"
                        style={{ background: ST.greenBright }}
                        aria-label="Changer la photo"
                      >
                        <Camera size={14} className="text-white" />
                      </button>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-extrabold mb-1" style={{ color: ST.text }}>{prenom || "Apprenant"} {nom}</p>
                      <p className="text-[12px] font-semibold mb-3" style={{ color: ST.textSecondary }}>Apprenant · {email || "—"}</p>
                      <div className="flex gap-2 flex-wrap">
                        <StButton
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          size="sm"
                          icon={uploadingPhoto ? Loader2 : Camera}
                        >
                          {uploadingPhoto ? "Envoi…" : "Changer la photo"}
                        </StButton>
                        {image && (
                          <StButton onClick={handlePhotoDelete} variant="secondary" size="sm" icon={Trash2}>
                            Supprimer
                          </StButton>
                        )}
                      </div>
                      {photoError && (
                        <p className="text-[11.5px] font-bold mt-1.5" style={{ color: ST.roseText }}>{photoError}</p>
                      )}
                    </div>
                  </div>
                </StCard>

                {/* Personal info */}
                <StCard>
                  <StSectionTitle>Informations personnelles</StSectionTitle>
                  <div className="space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Prénom</label>
                        <input
                          type="text"
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          className={FIELD_CLASS}
                          style={FIELD_STYLE}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Nom</label>
                        <input
                          type="text"
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          className={FIELD_CLASS}
                          style={FIELD_STYLE}
                        />
                      </div>
                    </div>

                    {/* Email (disabled) + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>
                          Adresse email
                          <span className="ml-1.5 text-[10px] font-bold" style={{ color: ST.textMuted }}>(non modifiable)</span>
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: ST.textMuted }} />
                          <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full pl-10 pr-4 py-3 rounded-[12px] text-[13.5px] font-semibold cursor-not-allowed"
                            style={{ border: "1px solid #eef2ef", color: ST.textMuted, background: "#f7f9fb" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+221 77 123 45 67"
                          className={FIELD_CLASS}
                          style={FIELD_STYLE}
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>
                        Biographie
                        <span className="ml-1.5 text-[10px] font-bold" style={{ color: ST.textMuted }}>{bio.length}/250</span>
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 250))}
                        rows={3}
                        placeholder="Décrivez-vous en quelques mots..."
                        className={`${FIELD_CLASS} resize-none`}
                        style={FIELD_STYLE}
                      />
                    </div>

                    {/* Country & language row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Pays</label>
                        <CountrySelect
                          value={country}
                          onChange={setCountry}
                          className={FIELD_CLASS}
                          includeBlank
                          placeholder="Sélectionnez votre pays"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Langue préférée</label>
                        <select className={FIELD_CLASS} style={FIELD_STYLE}>
                          <option>Français</option>
                          <option>English</option>
                        </select>
                      </div>
                    </div>

                    {/* Save button */}
                    <div className="flex items-center gap-3 pt-2">
                      <StButton
                        onClick={handleSave}
                        disabled={saving}
                        icon={saving ? Loader2 : Save}
                      >
                        {saving ? "Sauvegarde…" : "Sauvegarder"}
                      </StButton>
                      {saved && (
                        <span className="flex items-center gap-1.5 text-[13px] font-extrabold animate-pulse" style={{ color: ST.green }}>
                          <CheckCircle2 size={16} />
                          Modifications sauvegardées
                        </span>
                      )}
                    </div>
                  </div>
                </StCard>
              </div>
            )}

            {/* SECURITE TAB */}
            {activeTab === "securite" && (
              <div className="space-y-5">
                {/* Password */}
                <StCard>
                  <StSectionTitle>Mot de passe</StSectionTitle>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Mot de passe actuel</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: ST.textMuted }} />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 rounded-[12px] text-[13.5px] font-semibold focus:outline-none focus:ring-2 transition-all bg-white"
                          style={FIELD_STYLE}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Nouveau mot de passe</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: ST.textMuted }} />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Minimum 8 caractères"
                          className="w-full pl-10 pr-4 py-3 rounded-[12px] text-[13.5px] font-semibold focus:outline-none focus:ring-2 transition-all bg-white"
                          style={FIELD_STYLE}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-extrabold mb-1.5" style={{ color: ST.textLabel }}>Confirmer le nouveau mot de passe</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: ST.textMuted }} />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Répéter le nouveau mot de passe"
                          className="w-full pl-10 pr-4 py-3 rounded-[12px] text-[13.5px] font-semibold focus:outline-none focus:ring-2 transition-all bg-white"
                          style={FIELD_STYLE}
                        />
                      </div>
                    </div>
                    {pwdMessage && (
                      <div
                        className="px-4 py-3 rounded-[12px] text-[13px] font-semibold"
                        style={
                          pwdMessage.type === "success"
                            ? { background: ST.greenSoft, border: `1px solid #d7ecde`, color: ST.greenDark }
                            : { background: ST.roseSoft, border: `1px solid ${ST.roseText}33`, color: ST.roseText }
                        }
                      >
                        {pwdMessage.text}
                      </div>
                    )}
                    <StButton onClick={handleChangePassword} disabled={pwdSubmitting}>
                      {pwdSubmitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}
                    </StButton>
                  </div>
                </StCard>

                {/* 2FA — full setup flow */}
                <TwoFactorSetup />

                {/* Sessions — real login history */}
                <ActiveSessions />
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <StCard>
                <StSectionTitle>Préférences de notifications</StSectionTitle>
                <p className="text-[12px] font-semibold -mt-2 mb-4" style={{ color: ST.textSecondary }}>Choisissez comment vous souhaitez être notifié.</p>
                {/* Legend */}
                <div className="flex items-center gap-6 mb-5 pb-4" style={{ borderBottom: `1px solid ${ST.divider}` }}>
                  <span className="text-[11.5px] font-bold flex-1" style={{ color: ST.textSecondary }}>Notification</span>
                  <span className="text-[11.5px] font-extrabold w-12 text-center" style={{ color: ST.textSecondary }}>Email</span>
                  <span className="text-[11.5px] font-extrabold w-12 text-center" style={{ color: ST.textSecondary }}>Push</span>
                </div>

                <div className="space-y-5">
                  {notifs.map((n) => (
                    <div key={n.id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>{n.label}</p>
                        <p className="text-[11.5px] font-semibold mt-0.5 leading-relaxed" style={{ color: ST.textSecondary }}>{n.desc}</p>
                      </div>
                      <button
                        onClick={() => toggleNotif(n.id, "email")}
                        className="w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                        style={{ background: n.email ? ST.greenBright : "#e9efeb" }}
                      >
                        <span
                          className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-all duration-300 ${
                            n.email ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => toggleNotif(n.id, "push")}
                        className="w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                        style={{ background: n.push ? ST.greenBright : "#e9efeb" }}
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

                <StButton icon={Save} className="mt-7">
                  Sauvegarder les préférences
                </StButton>
              </StCard>
            )}

            {/* PAIEMENTS TAB */}
            {activeTab === "paiements" && (
              <div className="space-y-5">
                <StCard>
                  <StSectionTitle>Méthodes de paiement sauvegardées</StSectionTitle>
                  <div className="space-y-3 mb-4">
                    {[
                      { Icon: Smartphone, label: "Orange Money", detail: "+225 07 00 XX XX XX", primary: true, tone: { background: ST.amberSoft, color: ST.amberText } },
                      { Icon: Waves, label: "Wave", detail: "+225 05 00 XX XX XX", primary: false, tone: { background: ST.blueSoft, color: ST.blueText } },
                    ].map((method, i) => {
                      const Icon = method.Icon;
                      return (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-[12px] transition-colors" style={{ border: `1px solid ${ST.divider}` }}>
                          <div className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0" style={method.tone}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>{method.label}</p>
                            <p className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>{method.detail}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {method.primary && <StChip tone="green">Principale</StChip>}
                            <button className="p-1 transition-colors" style={{ color: ST.textMuted }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-extrabold transition-all" style={{ border: "2px dashed #bcd6c5", color: ST.green, background: "#fbfdfc" }}>
                    <Plus size={16} />
                    Ajouter une méthode de paiement
                  </button>
                </StCard>

                <StCard>
                  <StSectionTitle>Historique de facturation</StSectionTitle>
                  <div className="space-y-1">
                    {[
                      { ref: "FAC-2026-0412", date: "12 avr. 2026", label: "Formation — Algorithmes de vente", amount: 45000 },
                      { ref: "FAC-2026-0403", date: "3 avr. 2026", label: "Formation — UX/UI Figma", amount: 65000 },
                      { ref: "FAC-2026-0315", date: "15 mars 2026", label: "E-book — Copywriting Africain", amount: 8500 },
                    ].map((inv, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: i < 2 ? `1px solid ${ST.divider}` : undefined }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] font-semibold tabular-nums mb-0.5" style={{ color: ST.textMuted }}>{inv.ref}</p>
                          <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>{inv.label}</p>
                          <p className="text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.text }}>{inv.amount.toLocaleString("fr-FR")} FCFA</p>
                          </div>
                          <button className="p-1.5 rounded-lg transition-colors" style={{ color: ST.textMuted }}>
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </StCard>

                {/* Danger zone */}
                <AccountDeletionPanel />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
