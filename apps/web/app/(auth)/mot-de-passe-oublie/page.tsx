"use client";

import { useState } from "react";
import Link from "next/link";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 429) {
        setError("Trop de tentatives. Reessayez dans quelques minutes.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      setSent(true);
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
              <pattern id="grid-fpwd" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-fpwd)" />
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
            Pas de panique, ça arrive à tout le monde
          </h2>

          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Vous recevrez un lien de réinitialisation dans votre boîte mail en moins de 2 minutes. Votre compte et vos données restent intacts.
          </p>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-accent text-3xl font-bold">
                <span className="material-symbols-outlined text-accent text-3xl align-middle">lock_reset</span>
              </span>
              <span className="text-white/60 text-sm">Lien valable 15 min</span>
            </div>
            <div className="w-px h-12 bg-white/20 mx-4"></div>
            <div className="flex flex-col gap-1">
              <span className="text-accent text-3xl font-bold">
                <span className="material-symbols-outlined text-accent text-3xl align-middle">verified_user</span>
              </span>
              <span className="text-white/60 text-sm">Connexion sécurisée SSL</span>
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

          {!sent ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Mot de passe oublié
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                      mail
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien"
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
                Email envoyé !
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-1.5">
                Un lien de réinitialisation a été envoyé à
              </p>
              <p className="text-slate-900 dark:text-slate-100 font-bold text-sm mb-6">{email}</p>
              <p className="text-slate-500 dark:text-slate-500 text-xs leading-relaxed mb-8">
                Vérifiez votre boîte mail et vos dossiers spams.
                <br />
                Le lien est valable 15 minutes.
              </p>
              <button
                type="button"
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs text-primary hover:text-primary/80 font-bold underline underline-offset-2 mb-4 block mx-auto"
              >
                Renvoyer un lien
              </button>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-primary font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Retour à la connexion
              </Link>
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
