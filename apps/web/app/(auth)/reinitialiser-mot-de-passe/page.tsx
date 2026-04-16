"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Password strength ───────────────────────────────────────────────────
type Strength = { label: string; score: number; color: string; barColor: string };

function getStrength(pwd: string): Strength {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { label: "Faible", score, color: "text-red-500", barColor: "bg-red-500" };
  if (score === 2) return { label: "Moyen", score, color: "text-orange-500", barColor: "bg-orange-400" };
  if (score === 3) return { label: "Bon", score, color: "text-accent", barColor: "bg-accent" };
  return { label: "Fort", score, color: "text-primary", barColor: "bg-primary" };
}

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense fallback={null}>
      <ReinitialiserMotDePasseContent />
    </Suspense>
  );
}

function ReinitialiserMotDePasseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenMissing, setTokenMissing] = useState(false);

  const strength = password ? getStrength(password) : null;
  const mismatch = confirm.length > 0 && password !== confirm;
  const confirmOk = confirm.length > 0 && password === confirm;

  // Check for missing token on mount
  useEffect(() => {
    if (!token) {
      setTokenMissing(true);
    }
  }, [token]);

  // Redirect after success
  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => router.push("/connexion?reset=1"), 2500);
    return () => clearTimeout(id);
  }, [success, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mismatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 10) {
      setError("Le mot de passe doit contenir au moins 10 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Le mot de passe doit contenir au moins une majuscule.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Le mot de passe doit contenir au moins une minuscule.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Le mot de passe doit contenir au moins un chiffre.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Impossible de contacter le serveur. Verifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left Section: Visual */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, #0e7c66 0%, #1a2e2a 100%)" }}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <pattern id="grid-rpwd" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-rpwd)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-lg text-center lg:text-left">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-accent p-2 rounded-lg">
              <span className="material-symbols-outlined text-[#11211e] font-bold text-3xl">work</span>
            </div>
            <h1 className="text-white text-3xl font-extrabold tracking-tight">FreelanceHigh</h1>
          </div>

          <h2 className="text-white text-5xl font-black leading-tight mb-6">
            Choisissez un mot de passe fort et unique
          </h2>

          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Un bon mot de passe protège votre compte, vos finances et vos données professionnelles sur FreelanceHigh.
          </p>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-accent text-3xl font-bold">
                <span className="material-symbols-outlined text-accent text-3xl align-middle">shield</span>
              </span>
              <span className="text-white/60 text-sm">Données chiffrées</span>
            </div>
            <div className="w-px h-12 bg-white/20 mx-4"></div>
            <div className="flex flex-col gap-1">
              <span className="text-accent text-3xl font-bold">
                <span className="material-symbols-outlined text-accent text-3xl align-middle">lock</span>
              </span>
              <span className="text-white/60 text-sm">Connexion sécurisée</span>
            </div>
          </div>
        </div>

        {/* Decorative blob */}
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

          {tokenMissing ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-red-500 text-3xl">link_off</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Lien invalide
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                Ce lien de reinitialisation est invalide ou a expire.
                <br />
                Veuillez demander un nouveau lien.
              </p>
              <Link
                href="/mot-de-passe-oublie"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                Demander un nouveau lien
              </Link>
              <div className="mt-6">
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-primary font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Retour a la connexion
                </Link>
              </div>
            </div>
          ) : !success ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Nouveau mot de passe
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Choisissez un mot de passe sécurisé pour votre compte.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                      lock
                    </span>
                    <input
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPwd ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>

                  {/* Strength indicator */}
                  {password && strength && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.barColor : "bg-slate-200 dark:bg-neutral-dark"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-semibold ${strength.color}`}>
                        {strength.label}
                        {strength.score < 3 && (
                          <span className="text-slate-400 font-normal">
                            {" "}— ajoutez des majuscules, chiffres ou symboles
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                      lock
                    </span>
                    <input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 bg-white dark:bg-neutral-dark border rounded-xl outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        mismatch
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : confirmOk
                          ? "border-primary focus:ring-2 focus:ring-primary/30"
                          : "border-slate-200 dark:border-primary/20 focus:ring-2 focus:ring-primary focus:border-transparent"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showConfirm ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {mismatch && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5">
                      Les mots de passe ne correspondent pas.
                    </p>
                  )}
                  {confirmOk && (
                    <p className="text-xs text-primary font-semibold mt-1.5">
                      Les mots de passe correspondent.
                    </p>
                  )}
                </div>

                {/* Global error */}
                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mismatch || !password || !confirm}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Réinitialisation...
                    </>
                  ) : (
                    "Réinitialiser mon mot de passe"
                  )}
                </button>
              </form>

              <div className="mt-10 text-center">
                <Link
                  href="/connexion"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-primary font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Retour à la connexion
                </Link>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Mot de passe modifié !
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                Votre mot de passe a été mis à jour avec succès.
                <br />
                Vous allez être redirigé vers la connexion...
              </p>
              {/* Redirect progress bar */}
              <div className="w-48 h-1.5 bg-slate-200 dark:bg-neutral-dark rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-[2500ms] ease-linear"
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-3">Redirection en cours...</p>
            </div>
          )}

          {/* Footer links */}
          <div className="mt-12 flex items-center justify-center gap-4 sm:gap-6 flex-wrap opacity-60">
            <Link href="/cgu" className="text-xs hover:text-primary transition-colors">Conditions d&apos;utilisation</Link>
            <Link href="/confidentialite" className="text-xs hover:text-primary transition-colors">Politique de confidentialité</Link>
            <Link href="/contact" className="text-xs hover:text-primary transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
