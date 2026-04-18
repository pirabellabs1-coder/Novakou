"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

function TwoFaInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si pas de session : rediriger vers /connexion (ne devrait pas arriver normalement
  // car le middleware bloque /2fa aux non-connectés).
  if (status === "loading") {
    return <div className="min-h-[calc(100vh-96px)] bg-[#f7f9fb]" />;
  }
  if (status === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          <h2 className="text-lg font-extrabold text-[#191c1e] mt-3">Session expirée</h2>
          <p className="text-sm text-[#5c647a] mt-2 mb-5">Veuillez vous reconnecter.</p>
          <Link
            href="/connexion"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Code incorrect. Vérifiez votre application.");
        setLoading(false);
        return;
      }
      // Le JWT callback va effacer tfaPending quand on update() avec tfaVerified.
      await update({ tfaVerified: true });
      // Petit refresh de session + navigation vers la destination initiale.
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  async function handleCancel() {
    // L'utilisateur veut repartir → on vide sa session (elle est tfaPending).
    await signOut({ callbackUrl: "/connexion" });
  }

  const email = session?.user?.email ?? "";
  const name = (session?.user?.name ?? "").split(" ")[0] || "vous";

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
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#006e2f]/10 flex items-center justify-center mx-auto mb-4">
              <span
                className="material-symbols-outlined text-[#006e2f] text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield_lock
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#191c1e]">Authentification à deux facteurs</h2>
            <p className="text-sm text-[#5c647a] mt-1.5">
              Salut <span className="font-semibold">{name}</span>, entrez le code à 6 chiffres de votre
              application authenticator pour accéder à votre espace.
            </p>
            {email && (
              <p className="text-[11px] text-[#5c647a] mt-2 font-mono">{email}</p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#191c1e] mb-2 text-center">
                Code de vérification
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                autoFocus
                autoComplete="one-time-code"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-center text-2xl font-extrabold tracking-[0.5em] text-[#191c1e] placeholder-gray-300 focus:outline-none focus:border-[#006e2f] transition-all bg-white"
              />
              <p className="text-[11px] text-[#5c647a] text-center mt-2">
                Ouvrez Google Authenticator, Authy ou 1Password pour obtenir le code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Vérification…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  Accéder à mon espace
                </>
              )}
            </button>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-[#5c647a] hover:text-red-600 font-semibold inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                Annuler et me déconnecter
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#5c647a] mt-4">
          Votre compte est protégé par une double authentification.
        </p>
      </div>
    </div>
  );
}

export default function TwoFaPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-96px)] bg-[#f7f9fb]" />}>
      <TwoFaInner />
    </Suspense>
  );
}
