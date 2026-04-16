"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  freelance: "/dashboard",
  client: "/client",
  agence: "/agence",
};

const AUTH_ERRORS: Record<string, string> = {
  AccessDenied: "Acces refuse. Veuillez reessayer ou utiliser une autre methode de connexion.",
  OAuthSignin: "Erreur lors de la connexion avec le fournisseur externe.",
  OAuthCallback: "Erreur lors du retour du fournisseur externe.",
  OAuthAccountNotLinked: "Cet email est deja associe a un autre compte. Connectez-vous avec votre methode habituelle.",
  Callback: "Erreur de connexion. Veuillez reessayer.",
  Default: "Une erreur est survenue lors de la connexion.",
};

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"freelance" | "client" | "agence">("freelance");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Afficher les erreurs OAuth provenant de l'URL (ex: ?error=AccessDenied)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(AUTH_ERRORS[urlError] || AUTH_ERRORS.Default);
    }
  }, [searchParams]);

  // 2FA challenge state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // Prevention double soumission
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("REQUIRES_2FA")) {
          // Mot de passe correct mais 2FA requise
          setShow2FA(true);
          setLoading(false);
          return;
        }
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

      // Succes — rediriger vers le bon espace (ou vers l'URL custom si ?redirect= est present)
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const userRole = session?.user?.role || role;
      const customRedirect = searchParams.get("redirect");
      const redirectUrl = customRedirect || ROLE_REDIRECTS[userRole] || ROLE_REDIRECTS[role] || "/connexion";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.");
      setLoading(false);
    }
  }

  async function handleVerify2FA() {
    if (twoFACode.length !== 6) {
      setError("Entrez un code a 6 chiffres.");
      return;
    }

    setVerifying2FA(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: twoFACode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code incorrect");
        setVerifying2FA(false);
        return;
      }

      // 2FA verifiee — maintenant on se connecte avec le token HMAC signe par le serveur
      const loginResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        twoFactorToken: data.twoFactorToken,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Erreur lors de la connexion apres 2FA.");
        setVerifying2FA(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const userRole = session?.user?.role || role;
      const redirectUrl = ROLE_REDIRECTS[userRole] || ROLE_REDIRECTS[role] || "/connexion";
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Erreur de verification. Veuillez reessayer.");
      setVerifying2FA(false);
    }
  }

  // Social login handlers — set role cookie + redirect par role
  function handleGoogleSignIn() {
    document.cookie = `pendingRole=${role};path=/;max-age=600;samesite=lax`;
    signIn("google", { callbackUrl: ROLE_REDIRECTS[role] });
  }

  function handleLinkedInSignIn() {
    document.cookie = `pendingRole=${role};path=/;max-age=600;samesite=lax`;
    signIn("linkedin", { callbackUrl: ROLE_REDIRECTS[role] });
  }

  // ── 2FA Challenge UI ──
  if (show2FA) {
    return (
      <div className="flex flex-col lg:flex-row w-full min-h-screen">
        {/* Left Section */}
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
              Verification en deux etapes
            </h2>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Votre compte est protege par l&apos;authentification a deux facteurs. Entrez le code de votre application authenticator.
            </p>
          </div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        </div>

        {/* Right Section: 2FA Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-background-light dark:bg-background-dark">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">work</span>
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold">FreelanceHigh</h1>
            </div>

            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Verification 2FA</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Ouvrez votre application authenticator et entrez le code a 6 chiffres.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Code de verification</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setTwoFACode(v);
                    setError("");
                  }}
                  placeholder="000000"
                  className="w-full text-center text-2xl sm:text-3xl tracking-[0.3em] sm:tracking-[0.5em] font-mono py-4 min-h-[44px] bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerify2FA}
                disabled={verifying2FA || twoFACode.length !== 6}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {verifying2FA ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Verification en cours...
                  </>
                ) : (
                  "Verifier"
                )}
              </button>

              <button
                onClick={() => {
                  setShow2FA(false);
                  setTwoFACode("");
                  setError("");
                }}
                className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
              >
                Retour a la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal Login UI ──
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
            Elevez votre carriere freelance au plus haut niveau
          </h2>

          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Connectez-vous a la plateforme qui met en relation les meilleurs talents avec des opportunites mondiales. Freelances, clients et agences reunis.
          </p>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-accent text-sm">verified</span>
              </div>
              <span className="text-white/80 text-sm">Paiements securises</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-accent text-sm">public</span>
              </div>
              <span className="text-white/80 text-sm">+100 pays</span>
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
            <p className="text-slate-600 dark:text-slate-400">Veuillez entrer vos coordonnées pour continuer.</p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 mb-8 rounded-xl bg-primary/10 dark:bg-neutral-dark border border-primary/20">
            <button
              type="button"
              onClick={() => setRole("freelance")}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-sm min-h-[44px] transition-all ${
                role === "freelance"
                  ? "bg-primary text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-primary"
              }`}
            >
              Freelance
            </button>
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-sm min-h-[44px] transition-all ${
                role === "client"
                  ? "bg-primary text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-primary"
              }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => setRole("agence")}
              className={`flex-1 py-3 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-sm min-h-[44px] transition-all ${
                role === "agence"
                  ? "bg-primary text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 font-medium hover:text-primary"
              }`}
            >
              Agence
            </button>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 px-4 min-h-[44px] py-3 border border-slate-200 dark:border-primary/20 rounded-xl hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-semibold">Google</span>
            </button>
            <button
              type="button"
              onClick={handleLinkedInSignIn}
              className="flex items-center justify-center gap-3 px-4 min-h-[44px] py-3 border border-slate-200 dark:border-primary/20 rounded-xl hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="#0077b5" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span className="text-sm font-semibold">LinkedIn</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-slate-200 dark:border-primary/10" />
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-widest font-bold">Ou</span>
            <div className="flex-grow border-t border-slate-200 dark:border-primary/10" />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
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
                  className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100"
                  suppressHydrationWarning
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
                  className="w-full pl-10 pr-12 py-3 min-h-[44px] bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100"
                  suppressHydrationWarning
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

          <div className="mt-12 flex items-center justify-center gap-4 sm:gap-6 flex-wrap opacity-60">
            <Link href="/cgu" className="text-xs hover:text-primary transition-colors">Conditions d&apos;utilisation</Link>
            <Link href="/confidentialite" className="text-xs hover:text-primary transition-colors">Politique de confidentialite</Link>
            <Link href="/contact" className="text-xs hover:text-primary transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionContent />
    </Suspense>
  );
}
