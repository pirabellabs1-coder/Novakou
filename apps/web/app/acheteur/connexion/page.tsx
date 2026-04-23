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
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erreur lors de la connexion");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {/* Top bar minimale */}
      <header className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
            >
              N
            </div>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">Novakou</span>
          </Link>
          <Link
            href="/connexion"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5"
          >
            Connexion vendeur
            <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
          </Link>
        </div>
      </header>

      {/* Contenu centré */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {step === 1 && (
            <>
              {/* Header compact */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006e2f] text-[11px] font-bold tracking-widest uppercase mb-5">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shopping_bag
                  </span>
                  Accès à vos achats
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
                  Accédez à vos achats
                </h1>
                <p className="text-[15px] text-slate-500 leading-relaxed">
                  Entrez l&apos;adresse email utilisée lors de votre achat.<br />
                  Nous vous enverrons un code à 6 chiffres.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp(email);
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 focus:border-[#006e2f] focus:bg-white transition-colors"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                    mail
                  </span>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-[16px] mt-0.5">error</span>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-4 rounded-2xl text-white text-[14px] font-bold tracking-wide disabled:opacity-40 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
                >
                  {loading ? "Envoi…" : "Recevoir mon code"}
                </button>
              </form>

              {/* Trust markers discrets */}
              <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="material-symbols-outlined text-[#006e2f] text-[20px] mb-1">lock</span>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Sans mot<br />de passe</p>
                  </div>
                  <div>
                    <span className="material-symbols-outlined text-[#006e2f] text-[20px] mb-1">bolt</span>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Code<br />10 minutes</p>
                  </div>
                  <div>
                    <span className="material-symbols-outlined text-[#006e2f] text-[20px] mb-1">verified_user</span>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Accès<br />sécurisé</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 mb-5">
                  <span className="material-symbols-outlined text-[#006e2f] text-[28px]">mark_email_read</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
                  Vérifiez votre email
                </h1>
                <p className="text-[15px] text-slate-500 leading-relaxed">
                  Un code à 6 chiffres a été envoyé à<br />
                  <strong className="text-slate-900">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
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
                  className="w-full px-4 py-5 rounded-2xl border border-slate-200 bg-slate-50 text-center text-[32px] font-black tabular-nums tracking-[0.5em] text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/20 focus:border-[#006e2f] focus:bg-white transition-colors"
                />

                {error && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-[16px] mt-0.5">error</span>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-4 rounded-2xl text-white text-[14px] font-bold tracking-wide disabled:opacity-40 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#006e2f,#22c55e)" }}
                >
                  {loading ? "Vérification…" : "Accéder à mon espace"}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => { setStep(1); setCode(""); setError(null); }}
                  className="font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
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
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between text-[11px] text-slate-400">
          <p>© 2026 Novakou — Édité par Pirabel Labs</p>
          <div className="flex items-center gap-4">
            <Link href="/cgu" className="hover:text-slate-600">CGU</Link>
            <Link href="/confidentialite" className="hover:text-slate-600">Confidentialité</Link>
            <Link href="/contact" className="hover:text-slate-600">Support</Link>
          </div>
        </div>
      </footer>
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
