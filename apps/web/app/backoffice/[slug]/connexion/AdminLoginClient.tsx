"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email et mot de passe requis.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Identifiants incorrects."
            : result.error === "REQUIRES_2FA"
            ? "Code 2FA requis — cette option n'est pas encore disponible sur le backoffice."
            : result.error
        );
        setLoading(false);
        return;
      }

      // Verify role is ADMIN before redirecting (defense in depth)
      const check = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (check) {
        const me = await check.json().catch(() => null);
        if (me?.user?.role !== "ADMIN") {
          setError("Ce compte n'a pas les privilèges administrateur.");
          setLoading(false);
          return;
        }
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{
        background:
          "radial-gradient(1200px 600px at 10% -10%, #1a1f2e 0%, #0a0d14 60%)",
        color: "#f7f9fb",
      }}
    >
      <div className="w-full max-w-md">
        {/* Brand bar */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-[#006e2f] flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">NK</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">Novakou</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Administration</p>
          </div>
        </div>

        <div className="bg-[#0f1420] rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-amber-400 text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield_lock
              </span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Accès administrateur</h2>
              <p className="text-xs text-white/60">Zone restreinte — authentification requise</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400 text-[18px]">error</span>
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                Email administrateur
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@novakou.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm text-white placeholder-white/40 bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-white/10 text-sm text-white placeholder-white/40 bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(to right, #f59e0b, #d97706)",
                color: "#1a1206",
                boxShadow: "0 10px 30px rgba(245, 158, 11, 0.2)",
              }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Authentification…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  Accéder au panneau
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              URL secrète validée — connexion chiffrée TLS
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span className="material-symbols-outlined text-[14px]">history</span>
              Toutes les connexions sont journalisées
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-white/30 mt-6">
          Si vous n&apos;êtes pas administrateur, fermez cette page.
        </p>
      </div>
    </div>
  );
}
