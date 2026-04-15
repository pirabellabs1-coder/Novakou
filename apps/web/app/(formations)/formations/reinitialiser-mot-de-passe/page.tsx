"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const allPassed = Object.values(passwordChecks).every(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien de réinitialisation invalide ou expiré.");
      return;
    }
    if (!allPassed) {
      setError("Veuillez respecter tous les critères du mot de passe.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(j.error || "Erreur lors de la réinitialisation");
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/formations/connexion");
      }, 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          <h2 className="text-lg font-extrabold text-[#191c1e] mt-3">Lien invalide</h2>
          <p className="text-sm text-[#5c647a] mt-2 mb-5">
            Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.
          </p>
          <Link
            href="/formations/mot-de-passe-oublie"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: "#006e2f" }}>
            <span className="text-white font-extrabold text-sm">FH</span>
          </div>
          <span className="font-bold text-[#191c1e] text-lg">FreelanceHigh</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span
                  className="material-symbols-outlined text-green-600 text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Mot de passe mis à jour !</h2>
              <p className="text-sm text-[#5c647a]">
                Vous allez être redirigé vers la page de connexion…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-[#191c1e] mb-1.5">Nouveau mot de passe</h2>
                <p className="text-sm text-[#5c647a]">Choisissez un mot de passe fort et sécurisé.</p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Nouveau mot de passe</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 10 caractères"
                      required
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c647a]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Confirmer</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                    />
                  </div>
                </div>
              </div>

              {/* Password strength */}
              {password && (
                <div className="mt-4 bg-[#f7f9fb] rounded-xl p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#191c1e] mb-1.5">Critères du mot de passe :</p>
                  {[
                    { key: "length", label: "Au moins 10 caractères" },
                    { key: "upper", label: "Une lettre majuscule (A-Z)" },
                    { key: "lower", label: "Une lettre minuscule (a-z)" },
                    { key: "number", label: "Un chiffre (0-9)" },
                  ].map((c) => (
                    <div key={c.key} className="flex items-center gap-1.5">
                      <span
                        className="material-symbols-outlined text-[13px]"
                        style={{
                          color: passwordChecks[c.key as keyof typeof passwordChecks] ? "#006e2f" : "#d1d5db",
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        {passwordChecks[c.key as keyof typeof passwordChecks] ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span
                        className={`text-[11px] ${
                          passwordChecks[c.key as keyof typeof passwordChecks] ? "text-[#006e2f] font-semibold" : "text-[#5c647a]"
                        }`}
                      >
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !allPassed || password !== confirm}
                className="w-full mt-5 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Mise à jour…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                    Mettre à jour le mot de passe
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-96px)] bg-[#f7f9fb]" />}>
      <ResetInner />
    </Suspense>
  );
}
