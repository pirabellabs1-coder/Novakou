"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

export default function FormationsConnexionPage() {
  const t = useTranslations("formations_nav");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 2FA challenge state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("REQUIRES_2FA")) {
          setShow2FA(true);
          setLoading(false);
          return;
        }
        if (result.error.includes("Trop de tentatives")) {
          setError("Trop de tentatives. Réessayez dans 15 minutes.");
        } else if (result.error.includes("desactive")) {
          setError("Votre compte est désactivé. Contactez le support.");
        } else {
          setError("Email ou mot de passe incorrect.");
        }
        setLoading(false);
        return;
      }

      // Don't reset loading on success — keep spinner until redirect completes
      await redirectAfterLogin();
    } catch {
      setError("Erreur de connexion");
      setLoading(false);
    }
  }

  async function redirectAfterLogin() {
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const userRole = session?.user?.role;

    if (userRole === "admin") {
      router.push("/formations/admin/dashboard");
    } else if (session?.user?.formationsRole === "instructeur") {
      router.push("/formations/instructeur/dashboard");
    } else {
      router.push("/formations/mes-formations");
    }
    router.refresh();
  }

  async function handleVerify2FA() {
    if (twoFACode.length !== 6) {
      setError("Entrez un code à 6 chiffres.");
      return;
    }

    setVerifying2FA(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: twoFACode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Code incorrect");
        setVerifying2FA(false);
        return;
      }

      // Complete the sign-in using the 2FA token returned by the verify endpoint
      const signInResult = await signIn("credentials", {
        email,
        password,
        twoFactorToken: data.twoFactorToken,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Erreur lors de la connexion après vérification 2FA.");
        setVerifying2FA(false);
        return;
      }

      await redirectAfterLogin();
    } catch {
      setError("Erreur de vérification. Veuillez réessayer.");
      setVerifying2FA(false);
    }
  }

  // 2FA challenge UI
  if (show2FA) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">verified_user</span>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Vérification 2FA</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Ouvrez votre application authenticator et entrez le code à 6 chiffres.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-900 dark:text-white">Code de vérification</label>
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
                className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                autoFocus
              />
            </div>

            <button
              onClick={handleVerify2FA}
              disabled={verifying2FA || twoFACode.length !== 6}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {verifying2FA ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Vérification...
                </span>
              ) : (
                "Vérifier"
              )}
            </button>

            <button
              onClick={() => {
                setShow2FA(false);
                setTwoFACode("");
                setError("");
              }}
              className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary">school</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t("login_title")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t("login_subtitle")}</p>
        </div>

        {/* OAuth */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/formations/mes-formations" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all text-sm font-semibold bg-white dark:bg-slate-900 dark:bg-slate-800"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t("login_google")}
          </button>
          <button
            type="button"
            onClick={() => signIn("linkedin", { callbackUrl: "/formations/mes-formations" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all text-sm font-semibold bg-white dark:bg-slate-900 dark:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            {t("login_linkedin")}
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background-light dark:bg-background-dark px-4 text-slate-500">{t("login_or")}</span></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-900 dark:text-white">{t("login_email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="nom@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white">{t("login_password")}</label>
              <Link href="/formations/mot-de-passe-oublie" className="text-xs text-primary hover:underline">
                {t("login_forgot")}
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ...
              </span>
            ) : (
              t("login_submit")
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-slate-500">
          {t("login_no_account")}{" "}
          <Link href="/formations/inscription" className="text-primary font-bold hover:underline">
            {t("login_register_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
