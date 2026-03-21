"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// ─── Types ──────────────────────────────────────────────────────────────
type Role = "freelance" | "client" | "agence";

// ─── Constants ──────────────────────────────────────────────────────────
const ROLES: { id: Role; label: string; icon: string; desc: string }[] = [
  { id: "freelance", label: "Freelance", icon: "person", desc: "Je propose mes services" },
  { id: "client", label: "Client", icon: "business_center", desc: "Je cherche des talents" },
  { id: "agence", label: "Agence", icon: "corporate_fare", desc: "Je gère une équipe" },
];

const COMPETENCES = [
  "Développement Web", "Développement Mobile", "Design UI/UX",
  "Design Graphique", "Rédaction", "Traduction",
  "Marketing Digital", "SEO/SEA", "Community Management",
  "Vidéo & Motion", "Photographie", "Conseil & Stratégie",
];

const LANGUES = ["Français", "Anglais", "Arabe", "Espagnol", "Portugais", "Allemand"];

const PAYS = [
  "France", "Sénégal", "Côte d'Ivoire", "Cameroun", "Maroc",
  "Tunisie", "Algérie", "RD Congo", "Madagascar", "Mali",
  "Burkina Faso", "Niger", "Guinée", "Bénin", "Togo",
  "Gabon", "Congo", "Belgique", "Suisse", "Canada", "Haïti", "Autre",
];

const SECTEURS = [
  "Développement Web & Mobile", "Design & Créatif",
  "Marketing & Communication", "Rédaction & Traduction",
  "Vidéo & Photo", "Conseil & Stratégie", "Autre",
];

function getStepLabels(role: Role) {
  if (role === "freelance") return ["Compte", "Profil", "Compétences", "Finalisation"];
  if (role === "client") return ["Compte", "Entreprise", "Premier projet", "Finalisation"];
  return ["Compte", "Agence", "Équipe", "Finalisation"];
}

// ─── Password strength ─────────────────────────────────────────────────
function getPasswordStrength(pw: string) {
  if (!pw) return { level: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { level: 1, label: "Faible", color: "bg-red-500" };
  if (s === 2) return { level: 2, label: "Moyen", color: "bg-yellow-500" };
  if (s === 3) return { level: 3, label: "Bon", color: "bg-primary" };
  return { level: 4, label: "Excellent", color: "bg-green-500" };
}

// ─── Step indicator ─────────────────────────────────────────────────────
function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step
                  ? "bg-primary text-white"
                  : i === step
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : "bg-neutral-dark text-slate-500 border border-primary/20"
              }`}
            >
              {i < step ? (
                <span className="material-symbols-outlined text-sm">check</span>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] font-semibold hidden sm:block whitespace-nowrap ${
                i <= step ? "text-primary" : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-2 -mt-5 sm:-mt-3 min-w-[20px] ${
                i < step ? "bg-primary" : "bg-primary/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Left panel ─────────────────────────────────────────────────────────
const LEFT_CONTENT = [
  {
    headline: "Commencez votre aventure freelance dès aujourd'hui",
    subtitle: "Rejoignez les freelances qui transforment leur carriere sur notre plateforme internationale.",
    items: [
      { icon: "verified", text: "Profil vérifié en moins de 24h" },
      { icon: "payments", text: "Paiements sécurisés par escrow" },
      { icon: "public", text: "Accès à +100 pays et territoires" },
    ],
  },
  {
    headline: "Créez un profil qui vous démarque",
    subtitle: "Les profils complets reçoivent 3x plus de commandes. Prenez quelques minutes pour vous présenter.",
    items: [
      { icon: "trending_up", text: "85% des profils complets sont contactés" },
      { icon: "visibility", text: "Apparaissez en haut des recherches" },
      { icon: "star", text: "Gagnez la confiance dès le premier regard" },
    ],
  },
  {
    headline: "Mettez en avant vos talents",
    subtitle: "Sélectionnez vos compétences clés pour apparaître dans les bonnes recherches et recevoir les bonnes missions.",
    items: [
      { icon: "search", text: "Trouvez les bons talents plus vite" },
      { icon: "auto_awesome", text: "Recommandations personnalisées" },
      { icon: "speed", text: "Matching intelligent" },
    ],
  },
  {
    headline: "Vous êtes prêt à décoller !",
    subtitle: "Votre profil est configuré. Découvrez tout ce que FreelanceHigh peut vous offrir.",
    items: [
      { icon: "rocket_launch", text: "Lancez-vous dès maintenant" },
      { icon: "shield", text: "Environnement sécurisé et vérifié" },
      { icon: "diversity_3", text: "Communaute internationale de talents" },
    ],
  },
];

function LeftPanel({ step }: { step: number }) {
  const c = LEFT_CONTENT[step] ?? LEFT_CONTENT[0];

  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
      style={{ background: "linear-gradient(135deg, #0e7c66 0%, #1a2e2a 100%)" }}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <pattern height="10" id="grid-insc" patternUnits="userSpaceOnUse" width="10">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect fill="url(#grid-insc)" height="100" width="100" />
        </svg>
      </div>

      <div className="relative z-10 max-w-lg text-center lg:text-left">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-accent p-2 rounded-lg">
            <span className="material-symbols-outlined text-[#11211e] font-bold text-3xl">work</span>
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight">FreelanceHigh</h1>
        </div>

        <h2 className="text-white text-4xl lg:text-5xl font-black leading-tight mb-6">
          {c.headline}
        </h2>

        <p className="text-white/80 text-lg mb-10 leading-relaxed">{c.subtitle}</p>

        <div className="space-y-4">
          {c.items.map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-accent text-sm">{item.icon}</span>
              </div>
              <span className="text-white/80 text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
    </div>
  );
}

// ─── Input classes ──────────────────────────────────────────────────────
const INPUT =
  "w-full px-4 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400";
const INPUT_ICON =
  "w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400";
const LABEL = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";

// ─── Main component ─────────────────────────────────────────────────────
export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // All form data
  const [d, setD] = useState({
    // Step 0
    prenom: "", nom: "", email: "", password: "", confirmPassword: "",
    nomAgence: "", secteur: "", acceptCgu: false,
    // Step 1 — Profile
    titre: "", bio: "", pays: "", ville: "",
    entreprise: "", secteurEntreprise: "", siteWeb: "", tailleEquipe: "",
    description: "", siret: "",
    // Step 2 — Skills
    competences: [] as string[],
    tarifHoraire: "",
    langues: ["Français"] as string[],
    categoriesInteret: [] as string[],
    budgetTypique: "",
    typeProjet: "",
    specialites: [] as string[],
    membresEmails: "",
  });

  function set(key: string, val: unknown) {
    setD((p) => ({ ...p, [key]: val }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const t = e.target;
    const v = t instanceof HTMLInputElement && t.type === "checkbox" ? t.checked : t.value;
    set(t.name, v);
  }

  function toggleArr(key: "competences" | "langues" | "categoriesInteret" | "specialites", item: string) {
    setD((p) => {
      const arr = p[key];
      return { ...p, [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] };
    });
  }

  function canProceed(): boolean {
    if (step === 0) {
      if (!d.prenom || !d.nom || !d.email || !d.password || !d.confirmPassword || !d.acceptCgu) return false;
      if (d.password.length < 8) return false;
      if (d.password !== d.confirmPassword) return false;
      if (role === "agence" && (!d.nomAgence || !d.secteur)) return false;
      return true;
    }
    return true;
  }

  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // OTP state
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes
  const [otpResending, setOtpResending] = useState(false);
  const otpRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];

  // OTP timer countdown
  useEffect(() => {
    if (!showOtp) return;
    const interval = setInterval(() => {
      setOtpTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showOtp]);

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) otpRefs[index + 1]?.current?.focus();
    // Auto-submit when all 6 digits filled
    if (newCode.every((d) => d) && newCode.join("").length === 6) {
      verifyOtp(newCode.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs[index - 1]?.current?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs[index + 1]?.current?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...otpCode];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setOtpCode(newCode);
    if (pasted.length === 6) verifyOtp(pasted);
  }

  async function verifyOtp(code: string) {
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: d.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "Code invalide");
        setOtpCode(["", "", "", "", "", ""]);
        otpRefs[0]?.current?.focus();
        setOtpLoading(false);
        return;
      }
      // OTP verified — proceed to onboarding step 1
      setShowOtp(false);
      setStep(1);
      setOtpLoading(false);
    } catch {
      setOtpError("Erreur de connexion. Veuillez réessayer.");
      setOtpLoading(false);
    }
  }

  async function resendOtp() {
    setOtpResending(true);
    setOtpError("");
    try {
      await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: d.email }),
      });
      setOtpTimer(600);
      setOtpCode(["", "", "", "", "", ""]);
      otpRefs[0]?.current?.focus();
    } catch {
      setOtpError("Impossible de renvoyer le code.");
    }
    setOtpResending(false);
  }

  async function next() {
    // Step 0: Register + send OTP
    if (step === 0) {
      if (!role) {
        setRegisterError("Veuillez choisir votre rôle (Freelance, Client ou Agence)");
        return;
      }
      setRegisterLoading(true);
      setRegisterError("");
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: d.email,
            password: d.password,
            name: `${d.prenom} ${d.nom}`.trim(),
            role,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setRegisterError(data.error || "Erreur lors de l'inscription");
          setRegisterLoading(false);
          return;
        }
        // Show OTP inline screen
        setShowOtp(true);
        setOtpTimer(600);
        setRegisterLoading(false);
        setTimeout(() => otpRefs[0]?.current?.focus(), 100);
      } catch {
        setRegisterError("Une erreur est survenue. Veuillez réessayer.");
        setRegisterLoading(false);
      }
      return;
    }

    // Steps 1-2: just advance
    if (step < 3) { setStep(step + 1); return; }

    // Step 3 (final): sign in, save onboarding profile data, and redirect
    setRegisterLoading(true);
    try {
      const signInResult = await signIn("credentials", {
        email: d.email,
        password: d.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/connexion?registered=1");
        return;
      }

      // Save onboarding profile data (country, bio, title, skills, etc.)
      try {
        const profileData: Record<string, unknown> = {};
        if (d.pays) profileData.country = d.pays;
        if (d.ville) profileData.city = d.ville;
        if (d.bio) profileData.bio = d.bio;
        if (d.titre) profileData.title = d.titre;
        if (d.tarifHoraire) profileData.hourlyRate = parseFloat(d.tarifHoraire) || 0;
        if (d.competences.length > 0) profileData.skills = d.competences;
        if (d.langues.length > 0) profileData.languages = d.langues.map((l: string) => ({ name: l, level: "courant" }));

        if (Object.keys(profileData).length > 0) {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileData),
          });
        }
      } catch (profileErr) {
        // Non-blocking: profile data can be completed later
        console.error("[INSCRIPTION] Erreur sauvegarde profil onboarding:", profileErr);
      }

      router.refresh();
      const dest = role === "client" ? "/client" : role === "agence" ? "/agence" : "/dashboard";
      router.push(dest);
    } catch {
      setRegisterError("Une erreur est survenue. Veuillez réessayer.");
      setRegisterLoading(false);
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  const labels = getStepLabels(role || "freelance");
  const pw = getPasswordStrength(d.password);

  // ─── Step 0: Account ──────────────────────────────────────────────────
  function renderStep0() {
    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Créer votre compte</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Choisissez votre rôle pour commencer.</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {ROLES.map(({ id, label, icon, desc }) => {
            const active = role === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={`relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                  active
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-slate-200 dark:border-primary/20 hover:border-primary/50"
                }`}
              >
                {active && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">check</span>
                  </span>
                )}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? "bg-primary" : "bg-slate-100 dark:bg-neutral-dark"}`}>
                  <span className={`material-symbols-outlined text-sm ${active ? "text-white" : "text-slate-500"}`}>{icon}</span>
                </div>
                <span className={`text-sm font-bold leading-tight ${active ? "text-primary" : "text-slate-700 dark:text-slate-300"}`}>{label}</span>
                <span className={`text-[10px] leading-tight hidden sm:block ${active ? "text-primary/70" : "text-slate-400"}`}>{desc}</span>
              </button>
            );
          })}
        </div>

        {/* Social login */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: role === "client" ? "/client" : "/dashboard" })}
            className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-primary/20 rounded-xl hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-semibold">Google</span>
          </button>
          <button
            type="button"
            onClick={() => signIn("linkedin", { callbackUrl: role === "client" ? "/client" : "/dashboard" })}
            className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-primary/20 rounded-xl hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            <span className="text-sm font-semibold">LinkedIn</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center mb-6">
          <div className="flex-grow border-t border-slate-200 dark:border-primary/10" />
          <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-widest font-bold">Ou avec email</span>
          <div className="flex-grow border-t border-slate-200 dark:border-primary/10" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Prénom</label>
              <input name="prenom" type="text" autoComplete="given-name" required value={d.prenom} onChange={handleChange} placeholder="Jean" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Nom</label>
              <input name="nom" type="text" autoComplete="family-name" required value={d.nom} onChange={handleChange} placeholder="Dupont" className={INPUT} />
            </div>
          </div>

          {/* Agence extra fields */}
          {role === "agence" && (
            <>
              <div>
                <label className={LABEL}>Nom de l&apos;agence</label>
                <input name="nomAgence" type="text" required value={d.nomAgence} onChange={handleChange} placeholder="Mon Agence" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Secteur d&apos;activité</label>
                <select name="secteur" required value={d.secteur} onChange={handleChange} className={INPUT + " appearance-none"}>
                  <option value="">Sélectionnez un secteur</option>
                  {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className={LABEL}>Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
              <input name="email" type="email" autoComplete="email" required value={d.email} onChange={handleChange} placeholder="nom@exemple.com" className={INPUT_ICON} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={LABEL}>Mot de passe</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={d.password}
                onChange={handleChange}
                placeholder="Minimum 8 caractères"
                className="w-full pl-10 pr-12 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {/* Password strength */}
            {d.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-neutral-dark overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`flex-1 rounded-full transition-all ${i <= pw.level ? pw.color : "bg-transparent"}`} />
                  ))}
                </div>
                <span className={`text-xs font-semibold ${pw.level <= 1 ? "text-red-400" : pw.level === 2 ? "text-yellow-400" : "text-green-400"}`}>
                  {pw.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className={LABEL}>Confirmer le mot de passe</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={d.confirmPassword}
                onChange={handleChange}
                placeholder="Retapez votre mot de passe"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
            {d.confirmPassword && d.password !== d.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          {/* CGU */}
          <div className="flex items-start gap-3 pt-1">
            <input
              id="acceptCgu"
              name="acceptCgu"
              type="checkbox"
              required
              checked={!!d.acceptCgu}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-[#0e7c66]"
            />
            <label htmlFor="acceptCgu" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer">
              J&apos;accepte les{" "}
              <Link href="/cgu" className="text-primary hover:underline font-semibold">Conditions d&apos;utilisation</Link>{" "}
              et la{" "}
              <Link href="/confidentialite" className="text-primary hover:underline font-semibold">Politique de confidentialité</Link>
            </label>
          </div>
        </div>
      </>
    );
  }

  // ─── Step 1: Profile ──────────────────────────────────────────────────
  function renderStep1() {
    if (role === "freelance") {
      return (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Votre profil freelance</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Présentez-vous aux clients potentiels.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Titre professionnel</label>
              <input name="titre" type="text" value={d.titre} onChange={handleChange} placeholder="Développeur Full-Stack React / Node.js" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Bio courte</label>
              <textarea name="bio" rows={3} value={d.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Décrivez votre expertise en quelques phrases..." className={INPUT + " resize-none"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Pays</label>
                <select name="pays" value={d.pays} onChange={handleChange} className={INPUT + " appearance-none"}>
                  <option value="">Sélectionnez</option>
                  {PAYS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Ville</label>
                <input name="ville" type="text" value={d.ville} onChange={handleChange} placeholder="Dakar" className={INPUT} />
              </div>
            </div>
          </div>
        </>
      );
    }

    if (role === "client") {
      return (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Votre entreprise</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Aidez les freelances à mieux comprendre vos besoins.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Nom de l&apos;entreprise</label>
              <input name="entreprise" type="text" value={d.entreprise} onChange={handleChange} placeholder="Ma Startup SAS" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Secteur d&apos;activité</label>
              <select name="secteurEntreprise" value={d.secteurEntreprise} onChange={handleChange} className={INPUT + " appearance-none"}>
                <option value="">Sélectionnez</option>
                {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Site web <span className="text-slate-400 font-normal">(optionnel)</span></label>
              <input name="siteWeb" type="url" value={d.siteWeb} onChange={handleChange} placeholder="https://www.example.com" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Taille de l&apos;équipe</label>
              <select name="tailleEquipe" value={d.tailleEquipe} onChange={handleChange} className={INPUT + " appearance-none"}>
                <option value="">Sélectionnez</option>
                <option value="1">Indépendant</option>
                <option value="2-10">2 - 10 personnes</option>
                <option value="11-50">11 - 50 personnes</option>
                <option value="51-200">51 - 200 personnes</option>
                <option value="200+">200+ personnes</option>
              </select>
            </div>
          </div>
        </>
      );
    }

    // Agence
    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Informations de l&apos;agence</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Complétez le profil de votre agence.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Description de l&apos;agence</label>
            <textarea name="description" rows={3} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Présentez votre agence, votre vision..." className={INPUT + " resize-none"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Pays</label>
              <select name="pays" value={d.pays} onChange={handleChange} className={INPUT + " appearance-none"}>
                <option value="">Sélectionnez</option>
                {PAYS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>SIRET <span className="text-slate-400 font-normal">(optionnel)</span></label>
              <input name="siret" type="text" value={d.siret} onChange={handleChange} placeholder="123 456 789 00001" className={INPUT} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Step 2: Skills / Project / Team ──────────────────────────────────
  function renderStep2() {
    if (role === "freelance") {
      return (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Vos compétences</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Sélectionnez vos domaines d&apos;expertise.</p>
          </div>
          <div className="space-y-5">
            {/* Competences grid */}
            <div>
              <label className={LABEL}>Compétences principales</label>
              <div className="flex flex-wrap gap-2">
                {COMPETENCES.map((c) => {
                  const active = d.competences.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArr("competences", c)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-transparent text-slate-400 border-primary/20 hover:border-primary/50 hover:text-slate-300"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tarif horaire */}
            <div>
              <label className={LABEL}>Tarif horaire indicatif (€)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">euro</span>
                <input name="tarifHoraire" type="number" min="5" max="500" value={d.tarifHoraire} onChange={handleChange} placeholder="35" className={INPUT_ICON} />
              </div>
            </div>

            {/* Langues */}
            <div>
              <label className={LABEL}>Langues parlées</label>
              <div className="flex flex-wrap gap-2">
                {LANGUES.map((l) => {
                  const active = d.langues.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleArr("langues", l)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        active
                          ? "bg-accent text-[#11211e] border-accent"
                          : "bg-transparent text-slate-400 border-primary/20 hover:border-accent/50 hover:text-slate-300"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      );
    }

    if (role === "client") {
      return (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Votre premier projet</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Décrivez ce que vous recherchez pour recevoir de meilleures recommandations.</p>
          </div>
          <div className="space-y-4">
            {/* Catégories d'intérêt */}
            <div>
              <label className={LABEL}>Catégories qui vous intéressent</label>
              <div className="flex flex-wrap gap-2">
                {COMPETENCES.map((c) => {
                  const active = d.categoriesInteret.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArr("categoriesInteret", c)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-transparent text-slate-400 border-primary/20 hover:border-primary/50 hover:text-slate-300"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className={LABEL}>Budget typique par projet</label>
              <select name="budgetTypique" value={d.budgetTypique} onChange={handleChange} className={INPUT + " appearance-none"}>
                <option value="">Sélectionnez</option>
                <option value="< 500€">Moins de 500 €</option>
                <option value="500-2000€">500 € - 2 000 €</option>
                <option value="2000-10000€">2 000 € - 10 000 €</option>
                <option value="> 10000€">Plus de 10 000 €</option>
              </select>
            </div>

            {/* Type de projet */}
            <div>
              <label className={LABEL}>Type de projet habituel</label>
              <select name="typeProjet" value={d.typeProjet} onChange={handleChange} className={INPUT + " appearance-none"}>
                <option value="">Sélectionnez</option>
                <option value="ponctuel">Mission ponctuelle</option>
                <option value="long-terme">Collaboration long terme</option>
                <option value="recurrent">Récurrent / Abonnement</option>
              </select>
            </div>
          </div>
        </>
      );
    }

    // Agence
    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Votre équipe</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Définissez les spécialités de votre agence et invitez vos premiers membres.</p>
        </div>
        <div className="space-y-5">
          {/* Spécialités */}
          <div>
            <label className={LABEL}>Spécialités de l&apos;agence</label>
            <div className="flex flex-wrap gap-2">
              {COMPETENCES.map((c) => {
                const active = d.specialites.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleArr("specialites", c)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-transparent text-slate-400 border-primary/20 hover:border-primary/50 hover:text-slate-300"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inviter des membres */}
          <div>
            <label className={LABEL}>Inviter des membres <span className="text-slate-400 font-normal">(optionnel)</span></label>
            <textarea
              name="membresEmails"
              rows={3}
              value={d.membresEmails}
              onChange={(e) => set("membresEmails", e.target.value)}
              placeholder={"email1@exemple.com\nemail2@exemple.com"}
              className={INPUT + " resize-none"}
            />
            <p className="text-xs text-slate-500 mt-1.5">Un email par ligne. Ils recevront une invitation.</p>
          </div>
        </div>
      </>
    );
  }

  // ─── Step 3: Finalisation ─────────────────────────────────────────────
  function renderStep3() {
    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Presque terminé !</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Voici un récapitulatif de votre profil.</p>
        </div>

        {/* Profile summary card */}
        <div className="rounded-2xl border border-primary/20 bg-neutral-dark/40 p-6 space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                {role === "freelance" ? "person" : role === "client" ? "business_center" : "corporate_fare"}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{d.prenom} {d.nom}</p>
              <p className="text-slate-400 text-sm">
                {role === "freelance" && (d.titre || "Freelance")}
                {role === "client" && (d.entreprise || "Client")}
                {role === "agence" && (d.nomAgence || "Agence")}
              </p>
            </div>
          </div>

          <div className="h-px bg-primary/10" />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Email</p>
              <p className="text-slate-200 font-medium">{d.email}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Rôle</p>
              <p className="text-slate-200 font-medium capitalize">{role}</p>
            </div>
            {d.pays && (
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Pays</p>
                <p className="text-slate-200 font-medium">{d.pays}</p>
              </div>
            )}
            {role === "freelance" && d.competences.length > 0 && (
              <div className="col-span-2">
                <p className="text-slate-500 text-xs mb-1">Compétences</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.competences.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-semibold">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {role === "client" && d.categoriesInteret.length > 0 && (
              <div className="col-span-2">
                <p className="text-slate-500 text-xs mb-1">Intérêts</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.categoriesInteret.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-semibold">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {role === "agence" && d.specialites.length > 0 && (
              <div className="col-span-2">
                <p className="text-slate-500 text-xs mb-1">Spécialités</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.specialites.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-semibold">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next actions */}
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-accent">lightbulb</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-1">Que faire ensuite ?</p>
              <ul className="text-slate-400 text-xs space-y-1">
                {role === "freelance" && (
                  <>
                    <li>• Créez votre premier service pour commencer à vendre</li>
                    <li>• Complétez votre portfolio pour gagner en visibilité</li>
                    <li>• Postulez à des offres clients</li>
                  </>
                )}
                {role === "client" && (
                  <>
                    <li>• Explorez le marketplace pour trouver des talents</li>
                    <li>• Publiez votre premier projet</li>
                    <li>• Ajoutez une méthode de paiement</li>
                  </>
                )}
                {role === "agence" && (
                  <>
                    <li>• Publiez vos premiers services sous la marque agence</li>
                    <li>• Invitez vos collaborateurs</li>
                    <li>• Configurez votre page agence publique</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      <LeftPanel step={step} />

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-start items-center p-6 sm:p-10 md:p-16 bg-background-light dark:bg-background-dark overflow-y-auto min-h-screen">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">work</span>
            <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold">FreelanceHigh</h1>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} labels={labels} />

          {/* Registration error */}
          {registerError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {registerError}
            </div>
          )}

          {/* Step content */}
          {step === 0 && !showOtp && renderStep0()}

          {/* OTP verification screen (inline after step 0) */}
          {step === 0 && showOtp && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">mail</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Vérifiez votre email</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Un code de vérification a été envoyé à <strong className="text-primary">{d.email}</strong>
                </p>
              </div>

              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white dark:bg-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                      otpError ? "border-red-500" : digit ? "border-primary" : "border-slate-200 dark:border-primary/20"
                    } text-slate-900 dark:text-white`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-sm text-red-500 font-medium">{otpError}</p>
              )}

              {otpLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Vérification en cours...
                </div>
              )}

              <div className="text-center text-sm text-slate-500">
                {otpTimer > 0 ? (
                  <p>Le code expire dans <strong className="text-primary">{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}</strong></p>
                ) : (
                  <p className="text-red-500">Le code a expiré</p>
                )}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={otpResending}
                  className="text-sm text-primary hover:text-primary/80 font-semibold disabled:opacity-50"
                >
                  {otpResending ? "Envoi en cours..." : "Renvoyer le code"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setShowOtp(false); setOtpCode(["", "", "", "", "", ""]); setOtpError(""); }}
                className="w-full text-center text-xs text-slate-500 hover:text-primary transition-colors"
              >
                Modifier l&apos;adresse email
              </button>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation buttons — hidden during OTP */}
          {!showOtp && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="flex-1 py-3.5 border border-primary/30 text-slate-300 font-bold rounded-xl hover:bg-primary/10 transition-all text-sm"
                >
                  Retour
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={(step === 0 && !canProceed()) || registerLoading}
                className={`${step > 0 ? "flex-[2]" : "w-full"} py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
              >
                {registerLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    {step === 0 ? "Inscription en cours..." : "Chargement..."}
                  </>
                ) : step === 0 ? "S'inscrire" : step < 3 ? "Continuer" : (
                  <>
                    {role === "freelance" && "Accéder à mon dashboard"}
                    {role === "client" && "Explorer le marketplace"}
                    {role === "agence" && "Accéder à l'espace agence"}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Skip link for steps 1-2 */}
          {step > 0 && step < 3 && !showOtp && (
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setStep(3)} className="text-xs text-slate-500 hover:text-primary transition-colors font-semibold">
                Passer cette étape
              </button>
            </div>
          )}

          {/* Already have account (step 0) */}
          {step === 0 && !showOtp && (
            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Déjà un compte ?{" "}
                <Link href="/connexion" className="text-primary font-bold hover:underline">Se connecter</Link>
              </p>
            </div>
          )}

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-center gap-6 opacity-60">
            <Link href="/cgu" className="text-xs hover:text-primary transition-colors">CGU</Link>
            <Link href="/confidentialite" className="text-xs hover:text-primary transition-colors">Confidentialité</Link>
            <Link href="/contact" className="text-xs hover:text-primary transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
