"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ConnexionInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const callbackUrl = params.get("callbackUrl") || "/apprenant/mes-produits";

  // Si un email vient d'un lien magic, auto-pré-rempli + auto-send OTP
  useEffect(() => {
    const preEmail = params.get("email");
    const autosend = params.get("autosend");
    if (preEmail) {
      setEmail(preEmail);
      if (autosend === "1") {
        handleSendOtp(preEmail);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus auto sur input code
  useEffect(() => {
    if (step === 2) codeInputRef.current?.focus();
  }, [step]);

  // Cooldown resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleSendOtp(targetEmail: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/buyer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Envoi échoué");
        setLoading(false);
        return;
      }
      // Affiche le code en dev (visible dans la console)
      if (json.devCode) {
        console.log("[DEV] Code OTP:", json.devCode);
      }
      setStep(2);
      setResendCooldown(30);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Code à 6 chiffres requis");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("buyer-otp", {
        email,
        otpCode: code,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      // Connexion réussie
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erreur lors de la connexion");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {/* Hero gauche (desktop) */}
      <div
        className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden items-center justify-center p-12 text-white"
        style={{ background: "linear-gradient(135deg,#003d1a 0%,#006e2f 50%,#22c55e 100%)" }}
      >
        <div aria-hidden className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 bg-white" />
        <div aria-hidden className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-10 bg-white" />
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur mb-6">
            <span className="text-[11px] font-bold tracking-widest uppercase">🛍️ Espace acheteur</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] mb-4">
            Bienvenue dans<br />
            <span className="italic">votre espace.</span>
          </h1>
          <p className="text-white/80 text-base leading-relaxed mb-10 max-w-sm">
            Retrouvez ici l&apos;ensemble de vos achats effectués sur Novakou —
            formations, ebooks, PDF, templates — accessibles depuis n&apos;importe
            quelle boutique.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-base">🔐</span>
              <span>Connexion par code email — pas de mot de passe</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-base">⚡</span>
              <span>Accès immédiat à tous vos téléchargements</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-base">♾️</span>
              <span>Accès à vie à vos formations et produits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire droite */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-lg" style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}>N</div>
              <span className="text-lg font-extrabold text-zinc-900">Novakou</span>
            </Link>

            {step === 1 ? (
              <>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 mb-2">
                  Connexion
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Entrez l&apos;adresse email utilisée lors de votre achat.<br />
                  Vous recevrez un code à 6 chiffres pour vous connecter.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 mb-2">
                  Vérifiez votre email
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Un code à 6 chiffres a été envoyé à <strong className="text-zinc-900">{email}</strong>.<br />
                  Entrez-le ci-dessous pour accéder à votre espace.
                </p>
              </>
            )}
          </div>

          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp(email);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  autoFocus
                  className="w-full px-4 py-4 rounded-xl border border-zinc-200 bg-zinc-50 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 rounded-xl text-white text-sm font-extrabold tracking-wide disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
              >
                {loading ? "Envoi…" : "Envoyer le code"}
              </button>

              <p className="text-xs text-center text-zinc-500 pt-2">
                Êtes-vous un vendeur ?{" "}
                <Link href="/connexion" className="font-bold text-[#006e2f] hover:underline">
                  Connexion vendeur
                </Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
                  Code à 6 chiffres <span className="text-red-500">*</span>
                </label>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-2xl font-black tabular-nums tracking-[0.5em] text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-4 rounded-xl text-white text-sm font-extrabold tracking-wide disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
              >
                {loading ? "Vérification…" : "Accéder à mes achats"}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setCode(""); setError(null); }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                >
                  ← Changer d&apos;email
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => handleSendOtp(email)}
                  className="text-xs font-bold text-[#006e2f] hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcheteurConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ConnexionInner />
    </Suspense>
  );
}
