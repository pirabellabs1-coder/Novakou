"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  freelance: "/dashboard",
  client: "/client",
  agence: "/agence",
};

export default function ConnexionPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"freelance" | "client">("freelance");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("Trop de tentatives")) {
          setError("Trop de tentatives. Reessayez dans 15 minutes.");
        } else if (result.error.includes("desactive")) {
          setError("Votre compte est desactive. Contactez le support.");
        } else {
          setError("Email ou mot de passe incorrect.");
        }
        setLoading(false);
        return;
      }

      // Succes — rediriger vers le bon espace
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const userRole = session?.user?.role || role;
      const redirectUrl = ROLE_REDIRECTS[userRole] || "/dashboard";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left Section: Visual Inspiration */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, #0e7c66 0%, #1a2e2a 100%)" }}
      >
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <pattern height="10" id="grid" patternUnits="userSpaceOnUse" width="10">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
              </pattern>
            </defs>
            <rect fill="url(#grid)" height="100" width="100"></rect>
          </svg>
        </div>

        <div className="relative z-10 max-w-lg text-center lg:text-left">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-accent p-2 rounded-lg">
              <span className="material-symbols-outlined text-[#11211e] font-bold text-3xl">work</span>
            </div>
            <h1 className="text-white text-3xl font-extrabold tracking-tight">FreelanceHigh</h1>
          </div>

          <h2 className="text-white text-5xl font-black leading-tight mb-6">
            Rejoignez la revolution du freelancing en Afrique
          </h2>

          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Connectez-vous a la plus grande plateforme de talents en Afrique. Trouvez des opportunites mondiales ou engagez les meilleurs experts locaux.
          </p>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-accent text-3xl font-bold">50k+</span>
              <span className="text-white/60 text-sm">Freelances actifs</span>
            </div>
            <div className="w-px h-12 bg-white/20 mx-4"></div>
            <div className="flex flex-col gap-1">
              <span className="text-accent text-3xl font-bold">12k+</span>
              <span className="text-white/60 text-sm">Projets termines</span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Section: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">work</span>
            <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold">FreelanceHigh</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Bienvenue</h2>
            <p className="text-slate-600 dark:text-slate-400">Veuillez entrer vos coordonnees pour continuer.</p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 mb-8 rounded-xl bg-primary/10 dark:bg-neutral-dark border border-primary/20">
            <button
              type="button"
              onClick={() => setRole("freelance")}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                role === "freelance"
                  ? "bg-primary text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-primary"
              }`}
            >
              Je suis un Freelance
            </button>
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                role === "client"
                  ? "bg-primary text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-primary"
              }`}
            >
              Je suis un Client
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nom@exemple.com"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Mot de passe</label>
                <Link href="/mot-de-passe-oublie" className="text-xs font-bold text-primary hover:text-primary/80">Oublie ?</Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Vous n&apos;avez pas encore de compte ?{" "}
              <Link href="/inscription" className="text-primary font-bold hover:underline ml-1">
                Inscrivez-vous gratuitement
              </Link>
            </p>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 opacity-60">
            <Link href="/cgu" className="text-xs hover:text-primary transition-colors">Conditions d&apos;utilisation</Link>
            <Link href="/confidentialite" className="text-xs hover:text-primary transition-colors">Politique de confidentialite</Link>
            <Link href="/contact" className="text-xs hover:text-primary transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
