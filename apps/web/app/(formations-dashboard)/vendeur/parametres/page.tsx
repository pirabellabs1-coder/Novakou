"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import VendorDomainTab from "@/components/formations/VendorDomainTab";

type Tab = "compte" | "paiements" | "notifications" | "securite" | "coaching" | "domaine";

const tabs: { value: Tab; label: string; icon: string }[] = [
  { value: "compte", label: "Compte", icon: "manage_accounts" },
  { value: "domaine", label: "Nom de domaine", icon: "alternate_email" },
  { value: "paiements", label: "Paiements", icon: "account_balance_wallet" },
  { value: "notifications", label: "Notifications", icon: "notifications" },
  { value: "securite", label: "Sécurité", icon: "security" },
  { value: "coaching", label: "Coaching", icon: "support_agent" },
];

const payoutMethods = [
  {
    id: 1,
    name: "Orange Money",
    detail: "+221 77 654 32 10",
    icon: "smartphone",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    primary: true,
  },
  {
    id: 2,
    name: "Wave",
    detail: "+221 76 123 45 67",
    icon: "waves",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    primary: false,
  },
];

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
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-[#006e2f]" : "bg-gray-200"}`}
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
  const [activeTab, setActiveTab] = useState<Tab>("compte");
  const [twoFA, setTwoFA] = useState(false);

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
      await fetch("/api/formations/vendeur/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName }),
      });
      setCompteSaved(true);
      setTimeout(() => setCompteSaved(false), 2500);
    } finally {
      setSavingCompte(false);
    }
  }

  async function handleLogout() {
    await signOut({ callbackUrl: "/" });
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
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Paramètres</h1>
        <p className="text-sm text-[#5c647a] mt-1">Gérez votre compte et vos préférences</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.value
                ? "bg-white text-[#191c1e] shadow-sm"
                : "text-[#5c647a] hover:text-[#191c1e]"
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.value ? "text-[#006e2f]" : "text-[#5c647a]"}`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
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
              <select className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all">
                <option>Sénégal</option>
                <option>Côte d'Ivoire</option>
                <option>Cameroun</option>
                <option>Mali</option>
                <option>Bénin</option>
                <option>France</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={saveCompte}
                disabled={savingCompte}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 shadow-md shadow-[#006e2f]/20 disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {savingCompte ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Sauvegarde…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Enregistrer les modifications
                  </>
                )}
              </button>
              {compteSaved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Sauvegardé !
                </span>
              )}
            </div>
          </div>

          {/* Logout + Danger zone */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-base font-bold text-[#191c1e] mb-1">Session</h2>
            <p className="text-sm text-[#5c647a] mb-4">Déconnectez-vous de votre compte sur cet appareil.</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-[#191c1e] text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Se déconnecter
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-red-600 mb-1">Zone dangereuse</h2>
            <p className="text-sm text-[#5c647a] mb-4">Ces actions sont irréversibles. Soyez prudent.</p>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Supprimer mon compte
            </button>
          </div>
        </div>
      )}

      {/* ─── NOM DE DOMAINE ─── */}
      {activeTab === "domaine" && <VendorDomainTab />}

      {/* ─── PAIEMENTS ─── */}
      {activeTab === "paiements" && (
        <div className="space-y-6">
          {/* Existing methods */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-[#191c1e] mb-4">Méthodes de retrait</h2>
            <div className="space-y-3 mb-5">
              {payoutMethods.map((method) => (
                <div key={method.id} className={`flex items-center gap-4 p-4 rounded-xl border ${method.primary ? "border-[#006e2f]/30 bg-[#006e2f]/4" : "border-gray-200 bg-white"}`}>
                  <div className={`w-10 h-10 rounded-xl ${method.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[20px] ${method.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {method.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#191c1e]">{method.name}</p>
                      {method.primary && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">Principale</span>
                      )}
                    </div>
                    <p className="text-xs text-[#5c647a]">{method.detail}</p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Add new method */}
            <h3 className="text-sm font-bold text-[#191c1e] mb-3">Ajouter une méthode</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Orange Money", icon: "smartphone", iconBg: "bg-orange-100", iconColor: "text-orange-500" },
                { name: "Wave", icon: "waves", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
                { name: "Virement SEPA", icon: "account_balance", iconBg: "bg-gray-100", iconColor: "text-gray-600" },
                { name: "PayPal", icon: "credit_card", iconBg: "bg-sky-100", iconColor: "text-sky-600" },
              ].map((m) => (
                <button key={m.name} className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#006e2f]/40 hover:bg-[#006e2f]/3 transition-all">
                  <div className={`w-9 h-9 rounded-xl ${m.iconBg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-[18px] ${m.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {m.icon}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#191c1e] text-center leading-tight">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payout schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-[#191c1e] mb-4">Calendrier de versement</h2>
            <div className="space-y-3">
              {[
                { label: "Hebdomadaire", desc: "Virement chaque lundi", recommended: false },
                { label: "Bi-mensuel", desc: "1er et 15 de chaque mois", recommended: true },
                { label: "Mensuel", desc: "Le 1er de chaque mois", recommended: false },
              ].map((opt, i) => (
                <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${i === 1 ? "border-[#006e2f]/30 bg-[#006e2f]/4" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="payout_schedule" defaultChecked={i === 1} className="accent-[#006e2f]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#191c1e]">{opt.label}</p>
                      {opt.recommended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">Recommandé</span>}
                    </div>
                    <p className="text-xs text-[#5c647a]">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${coachActif ? "bg-[#006e2f]/10" : "bg-gray-100"}`}>
                  <span className={`material-symbols-outlined text-[24px] ${coachActif ? "text-[#006e2f]" : "text-[#5c647a]"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    support_agent
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#191c1e]">Mode Coach</h2>
                  <p className="text-sm text-[#5c647a] mt-0.5 max-w-sm">
                    Activez cette option pour proposer des sessions de coaching 1:1 et apparaître sur la page <span className="font-semibold text-[#006e2f]">Mentors</span> de Novakou.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${coachActif ? "bg-[#22c55e]" : "bg-gray-300"}`} />
                    <span className={`text-xs font-semibold ${coachActif ? "text-[#006e2f]" : "text-[#5c647a]"}`}>
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
                      ≈ {Math.round(Number(tarifSession) / 655.957)} € · Vous recevez {Math.round(Number(tarifSession) * 0.85).toLocaleString("fr-FR")} FCFA (15% commission)
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
              <div className="bg-white rounded-2xl border border-[#006e2f]/20 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[18px] text-[#006e2f]">preview</span>
                  <h2 className="text-sm font-bold text-[#006e2f]">Aperçu de votre fiche mentor</h2>
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

              <button
                onClick={saveCoach}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm transition-opacity hover:opacity-90 shadow-md shadow-[#006e2f]/20"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {coachSaved ? "check_circle" : "save"}
                </span>
                {coachSaved ? "Profil coach sauvegardé !" : "Sauvegarder mon profil coach"}
              </button>
            </>
          )}

          {!coachActif && (
            <div className="bg-[#f7f9fb] rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-gray-300 block mb-3">support_agent</span>
              <p className="text-sm font-semibold text-[#191c1e] mb-1">Activez le mode coach pour configurer vos sessions</p>
              <p className="text-xs text-[#5c647a]">Une fois activé, vous apparaîtrez sur la page Mentors et les apprenants pourront réserver des sessions avec vous.</p>
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
            {[
              { label: "Mot de passe actuel", placeholder: "••••••••••" },
              { label: "Nouveau mot de passe", placeholder: "Minimum 8 caractères" },
              { label: "Confirmer le nouveau mot de passe", placeholder: "Répéter le nouveau mot de passe" },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">{field.label}</label>
                <input
                  type="password"
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder:text-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
                />
              </div>
            ))}
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              Mettre à jour le mot de passe
            </button>
          </div>

          {/* 2FA */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${twoFA ? "bg-[#006e2f]/10" : "bg-gray-100"}`}>
                  <span className={`material-symbols-outlined text-[24px] ${twoFA ? "text-[#006e2f]" : "text-[#5c647a]"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    phone_iphone
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#191c1e]">Double authentification (2FA)</h2>
                  <p className="text-sm text-[#5c647a] mt-0.5">Sécurisez votre compte avec un code SMS ou une application d'authentification.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${twoFA ? "bg-[#22c55e]" : "bg-gray-300"}`} />
                    <span className={`text-xs font-semibold ${twoFA ? "text-[#006e2f]" : "text-[#5c647a]"}`}>
                      {twoFA ? "Activée" : "Désactivée"}
                    </span>
                  </div>
                </div>
              </div>
              <Toggle on={twoFA} onChange={setTwoFA} />
            </div>
          </div>

          {/* Active sessions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-[#191c1e] mb-4">Sessions actives</h2>
            <div className="space-y-3">
              {[
                { device: "Chrome · Windows 11", location: "Dakar, Sénégal", time: "Actif maintenant", current: true },
                { device: "Safari · iPhone 15", location: "Dakar, Sénégal", time: "Il y a 2 heures", current: false },
                { device: "Firefox · macOS", location: "Abidjan, Côte d'Ivoire", time: "Il y a 3 jours", current: false },
              ].map((session, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${session.current ? "border-[#006e2f]/20 bg-[#006e2f]/4" : "border-gray-100"}`}>
                  <span className="material-symbols-outlined text-[20px] text-[#5c647a]">
                    {session.device.includes("iPhone") ? "smartphone" : "computer"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#191c1e]">{session.device}</p>
                      {session.current && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">Actuelle</span>}
                    </div>
                    <p className="text-xs text-[#5c647a]">{session.location} · {session.time}</p>
                  </div>
                  {!session.current && (
                    <button className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                      Révoquer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
