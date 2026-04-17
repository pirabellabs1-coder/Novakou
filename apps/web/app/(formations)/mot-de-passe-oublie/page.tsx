"use client";

import Link from "next/link";
import { useState } from "react";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(j.error || "Erreur lors de l'envoi");
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{ background: "#006e2f" }}
          >
            <span className="text-white font-extrabold text-sm">NK</span>
          </div>
          <span className="font-bold text-[#191c1e] text-lg">Novakou</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span
                  className="material-symbols-outlined text-green-600 text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mark_email_read
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">Email envoyé !</h2>
              <p className="text-sm text-[#5c647a] leading-relaxed mb-5">
                Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un email avec un lien pour réinitialiser votre mot de passe dans les prochaines minutes.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left mb-5">
                <p className="text-xs text-amber-800">
                  <strong>💡 Astuce :</strong> Vérifiez également vos spams. Le lien expire dans <strong>1 heure</strong>.
                </p>
              </div>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-1.5 text-sm text-[#006e2f] font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-[#191c1e] mb-1.5">Mot de passe oublié ?</h2>
                <p className="text-sm text-[#5c647a]">
                  Entrez votre email et nous vous enverrons un lien pour le réinitialiser.
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Adresse email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Envoi…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Envoyer le lien de réinitialisation
                  </>
                )}
              </button>

              <div className="mt-5 text-center">
                <Link
                  href="/connexion"
                  className="text-sm text-[#5c647a] hover:text-[#006e2f] font-semibold inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-[#5c647a] mt-4 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[13px]">lock</span>
          Vos données sont protégées. SSL 256-bit.
        </p>
      </div>
    </div>
  );
}
