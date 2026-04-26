"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import CountrySelect from "@/components/account/CountrySelect";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import ActiveSessions from "@/components/account/ActiveSessions";
import AccountDeletionPanel from "@/components/account/AccountDeletionPanel";

type Tab = "profil" | "paiement" | "securite" | "notifications";

interface NotifPref {
  id: string;
  label: string;
  desc: string;
  email: boolean;
  push: boolean;
}

export default function AffilieParametresPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Payout method (PayPal / Mobile Money / Bank)
  const [payoutMethod, setPayoutMethod] = useState<"orange" | "wave" | "mtn" | "paypal" | "bank">("orange");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutSaved, setPayoutSaved] = useState(false);

  // Password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notifications (affilie-specific)
  const [notifs, setNotifs] = useState<NotifPref[]>([
    { id: "new_click", label: "Nouveau clic", desc: "Quand quelqu'un clique sur un de vos liens", email: false, push: true },
    { id: "new_conversion", label: "Nouvelle conversion", desc: "Quand un clic se transforme en achat", email: true, push: true },
    { id: "commission_confirmed", label: "Commission confirmée", desc: "Après les 14 jours de rétractation, la commission est validée", email: true, push: false },
    { id: "payout_sent", label: "Retrait envoyé", desc: "Confirmation du virement vers votre compte", email: true, push: true },
    { id: "weekly_report", label: "Rapport hebdomadaire", desc: "Résumé chaque lundi de vos performances", email: true, push: false },
  ]);

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

  async function handleSave() {
    setSaving(true);
    try {
      const fullName = `${prenom} ${nom}`.trim();
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, phone: phone.trim(), country: country.trim(), bio: bio.trim() }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "avatar");
      const up = await fetch("/api/upload/image", { method: "POST", body: form });
      const upJ = await up.json();
      if (!up.ok) { setPhotoError(upJ.error ?? "Erreur"); return; }
      const sv = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: upJ.url }),
      });
      if (!sv.ok) { setPhotoError("Impossible de sauvegarder la photo"); return; }
      setImage(upJ.url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleChangePassword() {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) { setPwdMsg({ type: "error", text: "Remplissez tous les champs" }); return; }
    if (newPwd.length < 8) { setPwdMsg({ type: "error", text: "Minimum 8 caractères" }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "Les mots de passe ne correspondent pas" }); return; }
    setPwdSubmitting(true);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const j = await r.json();
      if (!r.ok) { setPwdMsg({ type: "error", text: j.error ?? "Erreur" }); return; }
      setPwdMsg({ type: "success", text: "Mot de passe mis à jour" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => setPwdMsg(null), 5000);
    } finally {
      setPwdSubmitting(false);
    }
  }

  function savePayout() {
    setPayoutSaved(true);
    setTimeout(() => setPayoutSaved(false), 2500);
  }

  function toggleNotif(id: string, field: "email" | "push") {
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, [field]: !n[field] } : n)));
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "profil", label: "Profil", icon: "person" },
    { id: "paiement", label: "Méthode de retrait", icon: "account_balance_wallet" },
    { id: "notifications", label: "Notifications", icon: "notifications" },
    { id: "securite", label: "Sécurité", icon: "shield" },
  ];

  const card = "bg-[#0d1f17] border border-[#1e3a2f] rounded-2xl p-6";
  const inp = "w-full px-4 py-3 rounded-xl bg-[#0a1510] border border-[#1e3a2f] text-sm text-white placeholder-[#5c9e7a] focus:outline-none focus:border-[#22c55e]";
  const lbl = "block text-xs font-bold text-[#22c55e] mb-1.5 uppercase tracking-wide";
  const email = session?.user?.email ?? "";

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Paramètres</h1>
        <p className="text-sm text-[#5c9e7a] mt-1">Gérez votre compte affilié et vos préférences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-56 flex-shrink-0">
          <nav className={`${card} p-2 overflow-hidden`}>
            <ul>
              {tabs.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-left rounded-xl transition-all ${
                      activeTab === t.id ? "bg-[#22c55e]/15 text-[#22c55e] font-semibold" : "text-[#5c9e7a] hover:bg-[#1e3a2f] hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] flex-shrink-0" style={{ fontVariationSettings: activeTab === t.id ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === "profil" && (
            <>
              <div className={card}>
                <h2 className="text-base font-bold text-white mb-5">Photo de profil</h2>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoUpload} className="hidden" />
                <div className="flex items-center gap-5">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={prenom || "Affilié"} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-extrabold" style={{ background: "linear-gradient(135deg, #006e2f 0%, #22c55e 100%)" }}>
                      {(prenom[0] ?? "A").toUpperCase()}{(nom[0] ?? "").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white text-sm mb-1">{prenom || "Affilié"} {nom}</p>
                    <p className="text-xs text-[#5c9e7a] mb-3">Affilié · {email}</p>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                      {uploading ? "Envoi…" : "Changer la photo"}
                    </button>
                    {photoError && <p className="text-xs text-rose-400 mt-1.5">{photoError}</p>}
                  </div>
                </div>
              </div>

              <div className={card}>
                <h2 className="text-base font-bold text-white mb-5">Informations personnelles</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Prénom</label>
                      <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Nom</label>
                      <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} className={inp} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Email <span className="text-[#5c9e7a] normal-case font-normal">(non modifiable)</span></label>
                      <input type="email" value={email} disabled className={`${inp} opacity-60 cursor-not-allowed`} />
                    </div>
                    <div>
                      <label className={lbl}>Téléphone</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 123 45 67" className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Bio courte <span className="text-[#5c9e7a] normal-case font-normal">{bio.length}/250</span></label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 250))} rows={3}
                      placeholder="Présentez-vous à vos audiences..." className={`${inp} resize-none`} />
                  </div>
                  <div>
                    <label className={lbl}>Pays</label>
                    <CountrySelect value={country} onChange={setCountry}
                      className={inp} includeBlank placeholder="Sélectionnez votre pays" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                      <span className={`material-symbols-outlined text-[17px] ${saving ? "animate-spin" : ""}`}>{saving ? "progress_activity" : "save"}</span>
                      {saving ? "Sauvegarde…" : "Sauvegarder"}
                    </button>
                    {saved && <span className="text-sm text-[#22c55e] font-semibold">✓ Modifications sauvegardées</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "paiement" && (
            <div className={card}>
              <h2 className="text-base font-bold text-white mb-2">Méthode de retrait</h2>
              <p className="text-xs text-[#5c9e7a] mb-5">Choisissez où vous voulez recevoir vos commissions (montant min. 5 000 FCFA).</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {[
                  { id: "orange", label: "Orange Money", icon: "phone_android", color: "from-orange-500/30 to-orange-600/10" },
                  { id: "wave", label: "Wave", icon: "waves", color: "from-blue-500/30 to-blue-600/10" },
                  { id: "mtn", label: "MTN Mobile Money", icon: "phone_android", color: "from-yellow-500/30 to-yellow-600/10" },
                  { id: "paypal", label: "PayPal", icon: "account_balance_wallet", color: "from-sky-500/30 to-sky-600/10" },
                  { id: "bank", label: "Virement bancaire", icon: "account_balance", color: "from-purple-500/30 to-purple-600/10" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayoutMethod(m.id as "orange" | "wave" | "mtn" | "paypal" | "bank")}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      payoutMethod === m.id ? "border-[#22c55e] bg-[#22c55e]/10" : "border-[#1e3a2f] hover:border-[#22c55e]/40"
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${m.color}`}>
                      <span className="material-symbols-outlined text-[20px] text-white">{m.icon}</span>
                    </span>
                    <span className="text-sm font-semibold text-white flex-1">{m.label}</span>
                    {payoutMethod === m.id && <span className="material-symbols-outlined text-[18px] text-[#22c55e]">check_circle</span>}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className={lbl}>
                  {payoutMethod === "paypal" ? "Email PayPal" :
                   payoutMethod === "bank" ? "IBAN" :
                   "Numéro de téléphone"}
                </label>
                <input
                  type="text"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder={
                    payoutMethod === "paypal" ? "vous@exemple.com" :
                    payoutMethod === "bank" ? "FR76 ..." :
                    "+221 77 123 45 67"
                  }
                  className={inp}
                />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={savePayout}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                  <span className="material-symbols-outlined text-[17px]">save</span>
                  Sauvegarder la méthode
                </button>
                {payoutSaved && <span className="text-sm text-[#22c55e] font-semibold">✓ Sauvegardé</span>}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className={card}>
              <h2 className="text-base font-bold text-white mb-1">Préférences de notifications</h2>
              <p className="text-sm text-[#5c9e7a] mb-6">Choisissez comment être notifié de votre activité d&apos;affiliation.</p>

              <div className="flex items-center gap-6 mb-5 pb-4 border-b border-[#1e3a2f]">
                <span className="text-xs text-[#5c9e7a] font-medium flex-1">Notification</span>
                <span className="text-xs text-[#5c9e7a] font-semibold w-12 text-center">Email</span>
                <span className="text-xs text-[#5c9e7a] font-semibold w-12 text-center">Push</span>
              </div>

              <div className="space-y-5">
                {notifs.map((n) => (
                  <div key={n.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{n.label}</p>
                      <p className="text-xs text-[#5c9e7a] mt-0.5">{n.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(n.id, "email")}
                      className={`w-12 h-6 rounded-full transition-all ${n.email ? "bg-[#22c55e]" : "bg-[#1e3a2f]"}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-all ${n.email ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                    <button
                      onClick={() => toggleNotif(n.id, "push")}
                      className={`w-12 h-6 rounded-full transition-all ${n.push ? "bg-[#22c55e]" : "bg-[#1e3a2f]"}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full shadow mx-1 transition-all ${n.push ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>

              <button className="mt-7 flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                <span className="material-symbols-outlined text-[17px]">save</span>
                Sauvegarder
              </button>
            </div>
          )}

          {activeTab === "securite" && (
            <>
              <div className={card}>
                <h2 className="text-base font-bold text-white mb-5">Mot de passe</h2>
                <div className="space-y-4">
                  <div>
                    <label className={lbl}>Mot de passe actuel</label>
                    <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} autoComplete="current-password" placeholder="••••••••" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Nouveau mot de passe</label>
                    <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" placeholder="Min 8 caractères" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Confirmer</label>
                    <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} autoComplete="new-password" placeholder="Répéter" className={inp} />
                  </div>
                  {pwdMsg && (
                    <div className={`px-4 py-3 rounded-xl text-sm border ${pwdMsg.type === "success" ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-300" : "bg-rose-900/30 border-rose-700/50 text-rose-300"}`}>
                      {pwdMsg.text}
                    </div>
                  )}
                  <button onClick={handleChangePassword} disabled={pwdSubmitting}
                    className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                    {pwdSubmitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}
                  </button>
                </div>
              </div>

              <TwoFactorSetup />
              <ActiveSessions />
              <AccountDeletionPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
