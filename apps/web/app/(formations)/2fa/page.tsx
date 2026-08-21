"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AlertCircle, LogIn, ShieldCheck, Loader2, LogOut } from "lucide-react";

function TwoFaInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Récupération en libre-service : téléphone perdu, application effacée ──
  // Sans cette issue, un utilisateur qui n'a plus son authenticator est
  // enfermé dehors définitivement (aucun code de secours n'est remis à
  // l'activation). Il prouve qu'il possède sa boîte mail, le 2FA est coupé,
  // il se reconnecte au mot de passe et le réactive depuis ses paramètres.
  const [modeRecup, setModeRecup] = useState<"cache" | "envoi" | "code" | "fait">("cache");
  const [codeRecup, setCodeRecup] = useState("");
  const [recupLoading, setRecupLoading] = useState(false);
  const [recupMessage, setRecupMessage] = useState<string | null>(null);

  // Si pas de session : rediriger vers /connexion (ne devrait pas arriver normalement
  // car le middleware bloque /2fa aux non-connectés).
  if (status === "loading") {
    return <div className="min-h-[calc(100vh-96px)] bg-[#f7f9fb]" />;
  }
  if (status === "unauthenticated") {
    return (
      <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-[#191c1e] mt-3">Session expirée</h2>
          <p className="text-sm text-[#5c647a] mt-2 mb-5">Veuillez vous reconnecter.</p>
          <Link
            href="/connexion"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <LogIn size={16} />
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

  async function demanderCodeRecup() {
    if (!email) return;
    setRecupLoading(true);
    setRecupMessage(null);
    try {
      const r = await fetch("/api/auth/2fa-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) {
        setRecupMessage(j.error ?? "Impossible d'envoyer le code.");
      } else {
        setModeRecup("code");
        setRecupMessage(null);
      }
    } catch {
      setRecupMessage("Erreur réseau. Réessayez.");
    } finally {
      setRecupLoading(false);
    }
  }

  async function confirmerRecup() {
    setRecupLoading(true);
    setRecupMessage(null);
    try {
      const r = await fetch("/api/auth/2fa-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeRecup }),
      });
      const j = await r.json();
      if (!r.ok) {
        setRecupMessage(j.error ?? "Code incorrect ou expiré.");
        setRecupLoading(false);
        return;
      }
      setModeRecup("fait");
      // La session porte encore tfaPending : seule une reconnexion propre
      // (mot de passe seul, le 2FA étant coupé) donne accès au tableau de bord.
      setTimeout(() => signOut({ callbackUrl: "/connexion" }), 2500);
    } catch {
      setRecupMessage("Erreur réseau. Réessayez.");
      setRecupLoading(false);
    }
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
              <ShieldCheck size={32} className="text-[#006e2f]" />
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
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
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
                  <Loader2 size={18} className="animate-spin" />
                  Vérification…
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
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
                <LogOut size={14} />
                Annuler et me déconnecter
              </button>
            </div>
          </form>

          {/* ── Téléphone perdu : récupération par e-mail ─────────────── */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            {modeRecup === "cache" && (
              <button
                type="button"
                onClick={() => setModeRecup("envoi")}
                className="w-full text-center text-xs font-semibold text-[#006e2f] hover:underline"
              >
                Vous n&apos;avez plus accès à votre application d&apos;authentification ?
              </button>
            )}

            {modeRecup === "envoi" && (
              <div className="text-center">
                <p className="text-xs text-[#5c647a] mb-3">
                  Nous enverrons un code de récupération à <span className="font-mono">{email}</span>.
                  Il désactivera votre double authentification : vous vous reconnecterez avec votre
                  mot de passe, puis pourrez la réactiver depuis vos paramètres.
                </p>
                {recupMessage && <p className="text-xs text-red-600 font-semibold mb-2">{recupMessage}</p>}
                <button
                  type="button"
                  onClick={demanderCodeRecup}
                  disabled={recupLoading}
                  className="px-4 py-2.5 rounded-xl border-2 border-[#006e2f] text-[#006e2f] text-xs font-bold disabled:opacity-50"
                >
                  {recupLoading ? "Envoi…" : "M'envoyer le code par e-mail"}
                </button>
              </div>
            )}

            {modeRecup === "code" && (
              <div className="text-center">
                <p className="text-xs text-[#5c647a] mb-3">
                  Code envoyé à <span className="font-mono">{email}</span> — valable 10 minutes.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeRecup}
                  onChange={(e) => setCodeRecup(e.target.value.replace(/\D/g, ""))}
                  placeholder="Code reçu par e-mail"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-center text-lg font-extrabold tracking-[0.4em] text-[#191c1e] placeholder-gray-300 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-[#006e2f] bg-white"
                />
                {recupMessage && <p className="text-xs text-red-600 font-semibold mt-2">{recupMessage}</p>}
                <button
                  type="button"
                  onClick={confirmerRecup}
                  disabled={recupLoading || codeRecup.length !== 6}
                  className="mt-3 w-full py-3 rounded-xl text-white text-xs font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  {recupLoading ? "Vérification…" : "Désactiver ma double authentification"}
                </button>
                <button
                  type="button"
                  onClick={demanderCodeRecup}
                  disabled={recupLoading}
                  className="mt-2 text-[11px] text-[#5c647a] hover:underline"
                >
                  Renvoyer un code
                </button>
              </div>
            )}

            {modeRecup === "fait" && (
              <div className="text-center bg-[#f0faf3] border border-[#c9ecd6] rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-[#006e2f]">
                  Double authentification désactivée. Reconnectez-vous avec votre mot de passe…
                </p>
              </div>
            )}
          </div>
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
