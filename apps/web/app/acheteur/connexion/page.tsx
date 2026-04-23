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

  useEffect(() => {
    const preEmail = params.get("email");
    const autosend = params.get("autosend");
    if (preEmail) {
      setEmail(preEmail);
      if (autosend === "1") handleSendOtp(preEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 2) codeInputRef.current?.focus();
  }, [step]);

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
      if (json.devCode) console.log("[DEV] Code OTP:", json.devCode);
      setStep(2);
      setResendCooldown(30);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
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
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erreur lors de la connexion");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex">
      {/* ── Left hero panel ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-10 w-32 h-32 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-white font-extrabold text-sm tracking-tight">NK</span>
          </div>
          <span className="text-white font-bold text-lg">Novakou</span>
        </div>

        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-4 uppercase tracking-wider">Espace acheteur</p>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-8">
            Retrouvez l&apos;ensemble<br />
            de vos achats<br />
            en un seul endroit
          </h1>
          <div className="space-y-4">
            {[
              { icon: "lock", text: "Connexion sans mot de passe par code sécurisé" },
              { icon: "bolt", text: "Accès immédiat à vos formations et téléchargements" },
              { icon: "storefront", text: "Vos achats de toutes les boutiques Novakou réunis" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <p className="text-white/85 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[18px]">shield</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold">100 % sécurisé</p>
              <p className="text-white/70 text-[11px]">Connexion chiffrée SSL 256-bit · Code valable 10 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-[9px] flex items-center justify-center" style={{ background: "#006e2f" }}>
              <span className="text-white font-extrabold text-xs">NK</span>
            </div>
            <span className="font-bold text-[#191c1e] text-base">Novakou</span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            {step === 1 && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-extrabold text-[#191c1e] mb-1.5">Accédez à vos achats 🛍️</h2>
                  <p className="text-sm text-[#5c647a]">Entrez l&apos;adresse email utilisée lors de votre achat</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOtp(email);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-[#191c1e] mb-1.5">Adresse email</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#5c647a]">mail</span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                        autoFocus
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#191c1e] placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 focus:border-[#006e2f]"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
                      <p className="text-xs text-red-700 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-[#006e2f]/20"
                    style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    {loading ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Recevoir mon code
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#5c647a]">
                  Vous êtes vendeur ?{" "}
                  <Link href="/connexion" className="text-[#006e2f] font-bold hover:underline">
                    Connexion vendeur
                  </Link>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-7">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 mb-4">
                    <span className="material-symbols-outlined text-[#006e2f] text-[24px]">mark_email_read</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#191c1e] mb-1.5">Vérifiez votre email</h2>
                  <p className="text-sm text-[#5c647a]">
                    Un code à 6 chiffres a été envoyé à <strong className="text-[#191c1e]">{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#191c1e] mb-1.5">Code à 6 chiffres</label>
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
                      className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white text-center text-2xl font-black tabular-nums tracking-[0.5em] text-[#191c1e] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 focus:border-[#006e2f]"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-500 text-[16px] mt-0.5">error</span>
                      <p className="text-xs text-red-700 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg shadow-[#006e2f]/20"
                    style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    {loading ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">login</span>
                        Accéder à mon espace
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setCode(""); setError(null); }}
                    className="font-semibold text-[#5c647a] hover:text-[#191c1e] inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Changer d&apos;email
                  </button>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={() => handleSendOtp(email)}
                    className="font-bold text-[#006e2f] hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#5c647a]">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Connexion sécurisée SSL 256-bit
          </div>
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
