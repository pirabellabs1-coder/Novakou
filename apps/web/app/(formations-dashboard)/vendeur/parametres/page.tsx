"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Settings,
  UserCog,
  AtSign,
  Wallet,
  Bell,
  Shield,
  Headphones,
  Save,
  LogOut,
  CheckCircle2,
  Loader2,
  KeyRound,
  Eye,
  type LucideIcon,
} from "lucide-react";
import VendorDomainTab from "@/components/formations/VendorDomainTab";
import AccountDeletionPanel from "@/components/account/AccountDeletionPanel";
import TwoFactorSetup from "@/components/account/TwoFactorSetup";
import CountrySelect from "@/components/account/CountrySelect";
import ActiveSessions from "@/components/account/ActiveSessions";
import PaymentSettingsPanel from "@/components/vendeur/PaymentSettingsPanel";
import {
  KazaHero,
  KazaCard,
  KazaButton,
} from "@/components/kaza";

type Tab = "compte" | "paiements" | "notifications" | "securite" | "coaching" | "domaine";

const ALL_TABS: { value: Tab; label: string; icon: LucideIcon }[] = [
  { value: "compte", label: "Compte", icon: UserCog },
  { value: "domaine", label: "Nom de domaine", icon: AtSign },
  { value: "paiements", label: "Paiements", icon: Wallet },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "securite", label: "Sécurité", icon: Shield },
  { value: "coaching", label: "Coaching", icon: Headphones },
];

// (payoutMethods is now loaded dynamically by <PaymentSettingsPanel />)

const notifGroups = [
  {
    label: "Ventes & Revenus",
    items: [
      { key: "new_sale", label: "Nouvelle vente", desc: "Quand un apprenant achète l'un de vos produits", email: true, push: true },
      { key: "payout", label: "Virement reçu", desc: "Confirmation d'un retrait sur votre compte", email: true, push: false },
      { key: "refund", label: "Remboursement", desc: "Un apprenant a demandé un remboursement", email: true, push: true },
    ],
  },
  {
    label: "Apprenants",
    items: [
      { key: "new_message", label: "Nouveau message", desc: "Un apprenant vous a envoyé un message", email: true, push: true },
      { key: "new_review", label: "Nouvel avis", desc: "Un apprenant a laissé un avis sur votre formation", email: false, push: true },
      { key: "completion", label: "Formation complétée", desc: "Un apprenant a terminé votre formation", email: false, push: false },
    ],
  },
  {
    label: "Plateforme",
    items: [
      { key: "promotion", label: "Offres promotionnelles", desc: "Invitations à participer aux ventes flash Novakou", email: true, push: false },
      { key: "updates", label: "Mises à jour produit", desc: "Nouvelles fonctionnalités et améliorations", email: true, push: false },
    ],
  },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-emerald-500" : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DUREES = ["30 min", "45 min", "60 min", "90 min"];
const SPECIALITES_OPTIONS = [
  "Freelancing", "Marketing Digital", "Design UI/UX", "Développement Web",
  "E-commerce", "Réseaux sociaux", "Finance personnelle", "Productivité",
  "Création de contenu", "Personal branding",
];

export default function ParamaetresPage() {
  const pathname = usePathname();
  // Mentors are already coaches by definition — hide the "Mode Coach"
  // toggle for them since the rest of the platform routes them through
  // the mentor space (calendrier, packs, rendez-vous…).
  const isMentorContext = pathname?.startsWith("/mentor") ?? false;
  const tabs = isMentorContext ? ALL_TABS.filter((t) => t.value !== "coaching") : ALL_TABS;
  const [activeTab, setActiveTab] = useState<Tab>("compte");

  // Real user/account state (loaded from API)
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [emailAcc, setEmailAcc] = useState("");
  const [telephone, setTelephone] = useState("");
  const [pays, setPays] = useState("Sénégal");
  const [savingCompte, setSavingCompte] = useState(false);
  const [compteSaved, setCompteSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/formations/vendeur/profile");
        if (!res.ok) return;
        const json = await res.json();
        const u = json.data?.user;
        if (u) {
          const parts = (u.name ?? "").split(" ");
          setPrenom(parts[0] ?? "");
          setNom(parts.slice(1).join(" ") ?? "");
          setEmailAcc(u.email ?? "");
          if (u.phone) setTelephone(u.phone);
          if (u.country) setPays(u.country);
        }
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  async function saveCompte() {
    setSavingCompte(true);
    try {
      const fullName = `${prenom} ${nom}`.trim();
      const res = await fetch("/api/formations/vendeur/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone: telephone.trim(),
          country: pays.trim(),
        }),
      });
      if (res.ok) {
        setCompteSaved(true);
        setTimeout(() => setCompteSaved(false), 2500);
      }
    } finally {
      setSavingCompte(false);
    }
  }

  async function handleLogout() {
    await signOut({ callbackUrl: "/" });
  }

  // Password change state
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

  // Coach mode state
  const [coachActif, setCoachActif] = useState(false);
  const [tarifSession, setTarifSession] = useState("25000");
  const [dureeSession, setDureeSession] = useState("60 min");
  const [sessionsSemaine, setSessionsSemaine] = useState("5");
  const [joursDispos, setJoursDispos] = useState<string[]>(["Lundi", "Mercredi", "Vendredi"]);
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("18:00");
  const [specialites, setSpecialites] = useState<string[]>(["Freelancing", "Marketing Digital"]);
  const [bioCoach, setBioCoach] = useState("");
  const [coachSaved, setCoachSaved] = useState(false);

  const toggleJour = (j: string) =>
    setJoursDispos((prev) => prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]);
  const toggleSpecialite = (s: string) =>
    setSpecialites((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  function saveCoach() {
    setCoachSaved(true);
    setTimeout(() => setCoachSaved(false), 2500);
  }
  const [notifState, setNotifState] = useState<Record<string, { email: boolean; push: boolean }>>(() => {
    const init: Record<string, { email: boolean; push: boolean }> = {};
    notifGroups.forEach((g) => g.items.forEach((item) => { init[item.key] = { email: item.email, push: item.push }; }));
    return init;
  });

  const toggleNotif = (key: string, type: "email" | "push") => {
    setNotifState((prev) => ({ ...prev, [key]: { ...prev[key], [type]: !prev[key][type] } }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-4xl mx-auto space-y-8">
        <KazaHero
          badge={isMentorContext ? "Mentor" : "Pro"}
          badgeColor={isMentorContext ? "white" : "orange"}
          icon={Settings}
          title="Paramètres"
          subtitle="Gérez votre compte et vos préférences"
        />

        {/* Tab navigation */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <TabIcon className={`w-4 h-4 ${activeTab === tab.value ? "text-emerald-700" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

      {/* ─── COMPTE ─── */}
      {activeTab === "compte" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-[#191c1e]">Informations du compte</h2>

            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 bg-white focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 bg-white focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Adresse email</label>
              <input
                type="email"
                value={emailAcc}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#5c647a] bg-gray-50 cursor-not-allowed"
              />
              <p className="text-[10px] text-[#5c647a] mt-1">L&apos;email ne peut pas être modifié. Contactez le support si besoin.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Numéro de téléphone</label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+221 77 123 45 67"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 bg-white focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Pays de résidence</label>
              <CountrySelect value={pays} onChange={setPays} />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <KazaButton
                variant="primary"
                icon={savingCompte ? Loader2 : Save}
                onClick={saveCompte}
                disabled={savingCompte}
              >
                {savingCompte ? "Sauvegarde…" : "Enregistrer les modifications"}
              </KazaButton>
              {compteSaved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Sauvegardé !
                </span>
              )}
            </div>
          </div>

          {/* Logout + Danger zone */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
            <h2 className="text-base font-bold text-slate-900 mb-1">Session</h2>
            <p className="text-sm text-slate-500 mb-4">Déconnectez-vous de votre compte sur cet appareil.</p>
            <KazaButton variant="ghost" icon={LogOut} onClick={handleLogout}>
              Se déconnecter
            </KazaButton>
          </div>

          <AccountDeletionPanel />
        </div>
      )}

      {/* ─── NOM DE DOMAINE ─── */}
      {activeTab === "domaine" && <VendorDomainTab />}

      {/* ─── PAIEMENTS ─── */}
      {activeTab === "paiements" && <PaymentSettingsPanel />}

      {/* ─── NOTIFICATIONS ─── */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          {/* Column labels */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-[#5c647a] uppercase tracking-wide">Événement</span>
            <span className="text-xs font-bold text-[#5c647a] uppercase tracking-wide text-center w-12">Email</span>
            <span className="text-xs font-bold text-[#5c647a] uppercase tracking-wide text-center w-12">Push</span>
          </div>

          {notifGroups.map((group) => (
            <div key={group.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-bold text-[#5c647a] uppercase tracking-wide">{group.label}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {group.items.map((item) => {
                  const state = notifState[item.key];
                  return (
                    <div key={item.key} className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-4 items-center">
                      <div>
                        <p className="text-sm font-semibold text-[#191c1e]">{item.label}</p>
                        <p className="text-xs text-[#5c647a] mt-0.5">{item.desc}</p>
                      </div>
                      <div className="flex items-center justify-center w-12">
                        <Toggle on={state?.email ?? false} onChange={() => toggleNotif(item.key, "email")} />
                      </div>
                      <div className="flex items-center justify-center w-12">
                        <Toggle on={state?.push ?? false} onChange={() => toggleNotif(item.key, "push")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── COACHING ─── */}
      {activeTab === "coaching" && (
        <div className="space-y-6">
          {/* Activation toggle */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${coachActif ? "bg-emerald-50" : "bg-slate-100"}`}>
                  <Headphones className={`w-6 h-6 ${coachActif ? "text-emerald-700" : "text-slate-500"}`} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mode Coach</h2>
                  <p className="text-sm text-slate-500 mt-0.5 max-w-sm">
                    Activez cette option pour proposer des sessions de coaching 1:1 et apparaître sur la page <span className="font-semibold text-emerald-700">Mentors</span> de Novakou.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${coachActif ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={`text-xs font-semibold ${coachActif ? "text-emerald-700" : "text-slate-500"}`}>
                      {coachActif ? "Actif — vous apparaissez sur la page Mentors" : "Inactif"}
                    </span>
                  </div>
                </div>
              </div>
              <Toggle on={coachActif} onChange={setCoachActif} />
            </div>
          </div>

          {coachActif && (
            <>
              {/* Tarif & durée */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-base font-bold text-[#191c1e]">Tarif & format</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">
                      Tarif par session (FCFA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={tarifSession}
                        onChange={(e) => setTarifSession(e.target.value)}
                        className="w-full pl-4 pr-16 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5c647a]">FCFA</span>
                    </div>
                    <p className="text-xs text-[#5c647a] mt-1">
                      ≈ {Math.round(Number(tarifSession) / 655.957)} € · Vous recevez {Math.round(Number(tarifSession) * 0.90).toLocaleString("fr-FR")} FCFA (10% commission)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Durée de session</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DUREES.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDureeSession(d)}
                          className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                            dureeSession === d
                              ? "border-[#006e2f] bg-[#006e2f]/8 text-[#006e2f]"
                              : "border-gray-200 text-[#5c647a] hover:border-gray-300"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Nombre max de sessions par semaine</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={sessionsSemaine}
                      onChange={(e) => setSessionsSemaine(e.target.value)}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-[#006e2f]"
                    />
                    <span className="w-12 text-center text-sm font-bold text-[#006e2f] bg-[#006e2f]/10 py-1 rounded-lg">
                      {sessionsSemaine}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disponibilités */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-base font-bold text-[#191c1e]">Disponibilités</h2>
                <div>
                  <label className="block text-sm font-semibold text-[#191c1e] mb-3">Jours disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {JOURS.map((j) => (
                      <button
                        key={j}
                        onClick={() => toggleJour(j)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          joursDispos.includes(j)
                            ? "border-[#006e2f] bg-[#006e2f]/8 text-[#006e2f]"
                            : "border-gray-200 text-[#5c647a] hover:border-gray-300"
                        }`}
                      >
                        {j.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Heure de début</label>
                    <input
                      type="time"
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Heure de fin</label>
                    <input
                      type="time"
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f]"
                    />
                  </div>
                </div>
              </div>

              {/* Spécialités */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold text-[#191c1e]">Spécialités de coaching</h2>
                <div className="flex flex-wrap gap-2">
                  {SPECIALITES_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSpecialite(s)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        specialites.includes(s)
                          ? "border-[#006e2f] bg-[#006e2f]/8 text-[#006e2f]"
                          : "border-gray-200 text-[#5c647a] hover:border-gray-300"
                      }`}
                    >
                      {specialites.includes(s) && <span className="mr-1">✓</span>}{s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#5c647a]">{specialites.length} spécialité{specialites.length !== 1 ? "s" : ""} sélectionnée{specialites.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Bio coaching */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold text-[#191c1e]">Message d'accueil coach</h2>
                <p className="text-sm text-[#5c647a]">Ce texte apparaît sur votre fiche mentor. Décrivez votre approche et ce que les apprenants gagnent avec vous.</p>
                <textarea
                  rows={4}
                  value={bioCoach}
                  onChange={(e) => setBioCoach(e.target.value)}
                  placeholder="Ex: Je vous aide à lancer votre activité freelance en Afrique francophone en 90 jours. Mes sessions sont pratiques, personnalisées et orientées résultats..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 resize-none"
                />
                <p className="text-xs text-[#5c647a] text-right">{bioCoach.length}/500 caractères</p>
              </div>

              {/* Aperçu fiche mentor */}
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-sm font-bold text-emerald-700">Aperçu de votre fiche mentor</h2>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-[#f7f9fb] border border-gray-100">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    KA
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-[#191c1e]">Kofi Asante</p>
                        <p className="text-xs text-[#5c647a]">Instructeur & Coach · Sénégal</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-[#006e2f]">{Number(tarifSession).toLocaleString("fr-FR")} FCFA</p>
                        <p className="text-[10px] text-[#5c647a]">par session · {dureeSession}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {specialites.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full bg-[#006e2f]/8 text-[#006e2f] text-[10px] font-semibold">{s}</span>
                      ))}
                      {specialites.length > 3 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a] text-[10px] font-semibold">+{specialites.length - 3}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-[#5c647a]">
                        <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full"></span>
                        Disponible {joursDispos.slice(0, 2).map(j => j.slice(0,3)).join(", ")}{joursDispos.length > 2 ? "..." : ""}
                      </span>
                      <span className="text-[10px] text-[#5c647a]">· Max {sessionsSemaine} sessions/sem.</span>
                    </div>
                  </div>
                </div>
              </div>

              <KazaButton
                variant="primary"
                icon={coachSaved ? CheckCircle2 : Save}
                onClick={saveCoach}
                className="w-full"
              >
                {coachSaved ? "Profil coach sauvegardé !" : "Sauvegarder mon profil coach"}
              </KazaButton>
            </>
          )}

          {!coachActif && (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-900 mb-1">Activez le mode coach pour configurer vos sessions</p>
              <p className="text-xs text-slate-500">Une fois activé, vous apparaîtrez sur la page Mentors et les apprenants pourront réserver des sessions avec vous.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── SÉCURITÉ ─── */}
      {activeTab === "securite" && (
        <div className="space-y-6">
          {/* Password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-[#191c1e]">Changer le mot de passe</h2>

            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder:text-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder:text-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répéter le nouveau mot de passe"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder:text-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
              />
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

            <KazaButton
              variant="primary"
              icon={KeyRound}
              onClick={handleChangePassword}
              disabled={pwdSubmitting}
            >
              {pwdSubmitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </KazaButton>
          </div>

          {/* 2FA — full setup flow (QR code + verification) */}
          <TwoFactorSetup />


          {/* Active sessions — real login history from LoginAttempt + IP geolocation */}
          <ActiveSessions />

        </div>
      )}
      </main>
    </div>
  );
}
