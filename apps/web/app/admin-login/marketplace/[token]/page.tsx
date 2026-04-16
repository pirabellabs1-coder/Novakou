"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function AdminMarketplaceLoginPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch("/api/admin/verify-access-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, space: "marketplace" }),
        });
        if (res.ok) {
          setVerified(true);
        } else {
          router.replace("/404");
        }
      } catch {
        router.replace("/404");
      } finally {
        setChecking(false);
      }
    }
    verify();
  }, [token, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function completeLogin() {
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    if (session?.user?.role !== "admin") {
      await fetch("/api/auth/signout", { method: "POST" });
      setError("Acces refuse. Administrateurs uniquement.");
      setLoading(false);
      setVerifying2FA(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
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
          setShow2FA(true);
          setLoading(false);
          return;
        }
        if (result.error.includes("Trop de tentatives")) {
          setError("Trop de tentatives. Reessayez dans 15 minutes.");
        } else if (result.error.includes("desactive")) {
          setError("Compte desactive.");
        } else {
          setError("Identifiants incorrects.");
        }
        setLoading(false);
        return;
      }

      await completeLogin();
    } catch {
      setError("Erreur de connexion.");
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

      const loginResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        twoFactorToken: data.twoFactorToken,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Erreur apres 2FA.");
        setVerifying2FA(false);
        return;
      }

      await completeLogin();
    } catch {
      setError("Erreur de verification.");
      setVerifying2FA(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!verified) return null;

  if (show2FA) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-red-600/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl text-red-500">verified_user</span>
              </div>
              <h2 className="text-xl font-bold text-white">Verification 2FA</h2>
              <p className="text-slate-400 text-sm mt-1">Code authenticator requis</p>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm">{error}</div>
            )}
            <div className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => { setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                autoFocus
              />
              <button onClick={handleVerify2FA} disabled={verifying2FA || twoFACode.length !== 6} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50">
                {verifying2FA ? "Verification..." : "Verifier"}
              </button>
              <button onClick={() => { setShow2FA(false); setTwoFACode(""); setError(""); }} className="w-full py-2 text-sm text-slate-500 hover:text-red-400 transition-colors">Retour</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-red-600/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl text-red-500">store</span>
            </div>
            <h1 className="text-xl font-bold text-white">Admin Marketplace</h1>
            <p className="text-slate-500 text-xs mt-1">FreelanceHigh — Acces restreint</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="admin@freelancehigh.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <input
                  name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={form.password} onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400">
                  <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connexion...</>
              ) : "Acceder au Marketplace"}
            </button>
          </form>
        </div>
        <p className="text-slate-700 text-[10px] text-center mt-4">Toute tentative non autorisee est enregistree.</p>
      </div>
    </div>
  );
}
