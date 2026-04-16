"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type TabType = "vendeur" | "apprenant" | "mentor" | "affilie";
const VALID_ROLES: TabType[] = ["vendeur", "apprenant", "mentor", "affilie"];

// Map tab choice → formationsRole stored in DB (single source of truth for routing)
const roleToFormationsRole: Record<string, "instructeur" | "apprenant" | "mentor" | "affilie" | undefined> = {
  vendeur: "instructeur",
  apprenant: "apprenant",
  mentor: "mentor",
  affilie: "affilie",
};

function InscriptionInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role");
  const callbackUrl = searchParams.get("callbackUrl") ?? searchParams.get("returnTo") ?? undefined;
  const initialTab: TabType = VALID_ROLES.includes(roleParam as TabType) ? (roleParam as TabType) : "vendeur";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (VALID_ROLES.includes(roleParam as TabType)) setActiveTab(roleParam as TabType);
  }, [roleParam]);

  const formationsRole = roleToFormationsRole[activeTab];

  const redirectAfterAuth = callbackUrl ?? (
    activeTab === "vendeur" ? "/formations/vendeur/dashboard" :
    activeTab === "mentor" ? "/formations/mentor/dashboard" :
    activeTab === "affilie" ? "/formations/affilie/dashboard" :
    "/formations/apprenant/dashboard"
  );

  async function handleGoogle() {
    setLoading(true);
    // Store desired role in cookie so OAuth callback can pick it up
    if (formationsRole) {
      document.cookie = `pendingFormationsRole=${formationsRole}; path=/; max-age=300; SameSite=Lax`;
    }
    await signIn("google", { callbackUrl: redirectAfterAuth });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) { setError("Le prénom est requis."); return; }
    if (!email) { setError("L'email est requis."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!accepted) { setError("Veuillez accepter les conditions d'utilisation."); return; }

    setLoading(true);

    try {
      // 1. Create account
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          role: activeTab === "vendeur" ? "freelance" : activeTab === "mentor" ? "freelance" : "client",
          formationsRole,
        }),
      });
      const registerJson = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerJson.error ?? "Erreur lors de la création du compte.");
        setLoading(false);
        return;
      }

      // 2. If new account requires email verification, redirect to OTP page.
      //    Password is passed so auto-login can happen right after verification.
      if (registerJson.requiresVerification) {
        const params = new URLSearchParams({
          email: email.trim().toLowerCase(),
          callbackUrl: redirectAfterAuth,
          p: password,
        });
        router.push(`/formations/verifier-email?${params.toString()}`);
        return;
      }

      // 3. Existing account where only formationsRole was updated → direct sign-in
      const signInResult = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push(`/formations/connexion?callbackUrl=${encodeURIComponent(redirectAfterAuth)}&registered=1`);
        return;
      }

      router.push(redirectAfterAuth);
      router.refresh();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
      setLoading(false);
    }
  }

  const tabs: { id: TabType; label: string; icon: string; desc: string }[] = [
    { id: "vendeur", label: "Je vends", icon: "storefront", desc: "Formations & ebooks" },
    { id: "apprenant", label: "J'apprends", icon: "school", desc: "Accès au catalogue" },
    { id: "mentor", label: "Je coach", icon: "record_voice_over", desc: "Sessions 1:1" },
    { id: "affilie", label: "J'affilie", icon: "diversity_3", desc: "40% commission" },
  ];

  return (
    <div className="min-h-[calc(100vh-96px)] flex">
      {/* Left hero */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 60%, #22c55e 100%)" }}
      >
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-white font-extrabold text-sm tracking-tight">NK</span>
          </div>
          <span className="text-white font-bold text-lg">Novakou</span>
        </div>

        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-4 uppercase tracking-wider">La plateforme #1 en Afrique</p>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-6">
            {activeTab === "vendeur" && <>Créez votre<br />boutique en ligne<br />en 5 minutes</>}
            {activeTab === "apprenant" && <>Accédez à des<br />formations créées<br />par des experts</>}
            {activeTab === "mentor" && <>Partagez votre<br />expertise et<br />monétisez vos sessions</>}
            {activeTab === "affilie" && <>Gagnez 40%<br />sur chaque vente<br />que vous apportez</>}
          </h1>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[{ value: "0%", label: "Frais 30j" }, { value: "48h", label: "Paiement" }, { value: "7j/7", label: "Support" }].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                <p className="text-white font-extrabold text-lg">{s.value}</p>
                <p className="text-white/70 text-[10px] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3.5">
            {[
              "0% de frais les 30 premiers jours",
              "Paiement Mobile Money intégré (Orange, Wave, MTN)",
              "Vos fonds disponibles sous 48h",
              "Support en français 7j/7",
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#22c55e] text-[18px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="text-white/85 text-sm">{t}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <p className="text-white/80 text-xs">Plateforme 100% africaine · Construite pour les créateurs</p>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 xl:w-[55%] flex items-start justify-center px-5 py-8 bg-[#f7f9fb] overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-9 h-9 rounded-[9px] flex items-center justify-center" style={{ background: "#006e2f" }}>
              <span className="text-white font-extrabold text-xs">NK</span>
            </div>
            <span className="font-bold text-[#191c1e] text-base">Novakou</span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-[#191c1e] mb-1.5">
                {activeTab === "vendeur" && "Créez votre boutique gratuitement 🚀"}
                {activeTab === "apprenant" && "Accédez au meilleur catalogue 🎓"}
                {activeTab === "mentor" && "Devenez mentor rémunéré 🎤"}
                {activeTab === "affilie" && "Gagnez 40% de commission 💰"}
              </h2>
              <p className="text-sm text-[#5c647a]">
                {activeTab === "affilie" ? "Partagez votre lien unique et touchez 40% sur chaque vente." : "Choisissez votre profil pour commencer"}
              </p>
            </div>

            {/* Role tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-gray-100 rounded-2xl mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-center transition-all duration-200 ${activeTab === tab.id ? "bg-white shadow-sm text-[#006e2f]" : "text-[#5c647a] hover:text-[#191c1e]"}`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? "text-[#006e2f]" : "text-[#5c647a]"}`} style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}>
                    {tab.icon}
                  </span>
                  <span className="text-xs font-bold leading-tight">{tab.label}</span>
                  <span className="text-[9px] text-[#5c647a] leading-tight hidden sm:block">{tab.desc}</span>
                </button>
              ))}
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors mb-5 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>

            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-[#5c647a] font-medium flex-shrink-0">ou remplissez le formulaire</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Prénom <span className="text-red-500">*</span></label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Aminata" required
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nom</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Diallo"
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Adresse email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">mail</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Mot de passe <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">lock</span>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères minimum" required autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c647a] hover:text-[#191c1e]">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {password && password.length < 8 && (
                  <p className="text-[10px] text-red-500 mt-1">Au moins 8 caractères requis</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Confirmer le mot de passe <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">lock_reset</span>
                  <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Répétez votre mot de passe" required autoComplete="new-password"
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white ${confirm && confirm !== password ? "border-red-300" : "border-gray-200"}`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c647a] hover:text-[#191c1e]">
                    <span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="text-[10px] text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              <div className="flex items-start gap-3 pt-1">
                <input id="terms" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#006e2f] focus:ring-[#006e2f] cursor-pointer mt-0.5 flex-shrink-0" />
                <label htmlFor="terms" className="text-xs text-[#5c647a] leading-relaxed cursor-pointer">
                  J&apos;accepte les{" "}
                  <Link href="/formations/cgu" className="text-[#006e2f] font-semibold hover:underline">conditions générales</Link>{" "}
                  et la{" "}
                  <Link href="/formations/confidentialite" className="text-[#006e2f] font-semibold hover:underline">politique de confidentialité</Link>.
                </label>
              </div>

              <button type="submit" disabled={loading || !accepted}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                {loading ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Création du compte…</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">rocket_launch</span>Créer mon compte gratuitement</>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#5c647a] mt-5">
              Déjà un compte ?{" "}
              <Link href="/formations/connexion" className="text-[#006e2f] font-bold hover:underline">Se connecter</Link>
            </p>
          </div>

          <p className="text-center text-[11px] text-[#5c647a] mt-4 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            Inscription gratuite · Aucune carte requise · Résiliable à tout moment
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-96px)] bg-[#f7f9fb]" />}>
      <InscriptionInner />
    </Suspense>
  );
}
