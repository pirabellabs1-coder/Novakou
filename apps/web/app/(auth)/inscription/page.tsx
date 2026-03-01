"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, User, Briefcase, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

type Role = "freelance" | "client" | "agence";

const ROLES = [
  {
    id: "freelance" as Role,
    label: "Freelance",
    icon: User,
    description: "Je propose mes services",
  },
  {
    id: "client" as Role,
    label: "Client",
    icon: Briefcase,
    description: "Je cherche des talents",
  },
  {
    id: "agence" as Role,
    label: "Agence",
    icon: Building2,
    description: "Je gère une équipe",
  },
];

export default function InscriptionPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("freelance");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirm: "",
    nomAgence: "",
    secteur: "",
    acceptCgu: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target;
    const value = target instanceof HTMLInputElement && target.type === "checkbox"
      ? target.checked
      : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: connect to Supabase Auth then redirect
    router.push(`/onboarding?role=${role}`);
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      <AuthLeftPanel />

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center px-6 py-12 sm:px-10 bg-white overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 self-start">
          <Link href="/" className="inline-flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600 fill-purple-600" />
            <span className="text-xl font-extrabold text-gray-900">FreelanceHigh</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Créer votre compte</h1>
            <p className="text-gray-500 text-sm">Choisissez votre rôle pour commencer</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {ROLES.map(({ id, label, icon: Icon, description }) => {
              const active = role === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all duration-150 text-center",
                    active
                      ? "border-purple-600 bg-purple-50 shadow-md shadow-purple-100"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30"
                  )}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    active ? "bg-purple-600" : "bg-gray-100"
                  )}>
                    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-gray-500")} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold leading-tight",
                    active ? "text-purple-700" : "text-gray-700"
                  )}>
                    {label}
                  </span>
                  <span className={cn(
                    "text-[10px] leading-tight hidden sm:block",
                    active ? "text-purple-500" : "text-gray-400"
                  )}>
                    {description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="#0077B5" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-gray-200" />
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-widest font-semibold">
              ou avec email
            </span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Prénom
                </label>
                <input
                  name="prenom"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Lissanon"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nom
                </label>
                <input
                  name="nom"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Gildas"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
                />
              </div>
            </div>

            {/* Agence extra fields */}
            {role === "agence" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nom de l&apos;agence
                  </label>
                  <input
                    name="nomAgence"
                    type="text"
                    required
                    value={form.nomAgence}
                    onChange={handleChange}
                    placeholder="Studio Digital Dakar"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Secteur d&apos;activité
                  </label>
                  <select
                    name="secteur"
                    required
                    value={form.secteur}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all appearance-none"
                  >
                    <option value="">Sélectionnez un secteur</option>
                    <option value="web">Développement Web & Mobile</option>
                    <option value="design">Design & Créatif</option>
                    <option value="marketing">Marketing & Communication</option>
                    <option value="redaction">Rédaction & Traduction</option>
                    <option value="video">Vidéo & Photo</option>
                    <option value="conseil">Conseil & Stratégie</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="nom@exemple.com"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-3.5 py-2.5 pr-11 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CGU */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="acceptCgu"
                name="acceptCgu"
                type="checkbox"
                required
                checked={form.acceptCgu}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="acceptCgu" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                J&apos;accepte les{" "}
                <Link href="/cgu" className="text-purple-600 hover:underline font-semibold">
                  Conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/confidentialite" className="text-purple-600 hover:underline font-semibold">
                  Politique de confidentialité
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all mt-2 text-sm"
            >
              {role === "agence"
                ? "Créer le compte agence"
                : role === "freelance"
                ? "Commencer en tant que Freelance"
                : "Commencer en tant que Client"}
            </button>
          </form>

          {/* Already have account */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-purple-600 hover:text-purple-700 font-bold hover:underline">
              Se connecter
            </Link>
          </p>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 mt-8 text-xs text-gray-400">
            <Link href="/cgu" className="hover:text-gray-600 transition-colors">CGU</Link>
            <span>·</span>
            <Link href="/confidentialite" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
