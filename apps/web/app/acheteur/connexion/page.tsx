"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Info,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MailCheck,
  Send,
  ShieldCheck,
  Store,
  Zap,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ConnexionInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Hint set by /connexion (seller portal) when a non-seller account tried to
  // log in there. We display a banner inviting the user to continue here, and
  // — if they already have a session — sign them out first so the OTP flow
  // can start cleanly.
  const wrongPortal = params.get("wrongPortal") === "1";

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  // Cette page est volontairement un raccourci qui amène TOUJOURS dans
  // l'espace apprenant — peu importe le rôle marketplace de l'utilisateur,
  // ses achats vivent dans /apprenant/*. On laisse passer un callbackUrl
  // seulement s'il pointe déjà vers une sous-route /apprenant/* (ex. magic
  // link email vers /apprenant/formation/[id]) ; sinon on retombe sur
  // "Mes produits".
  const rawCallback = params.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/apprenant/")
      ? rawCallback
      : "/apprenant/mes-produits";

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
              { icon: Lock, text: "Connexion sans mot de passe par code sécurisé" },
              { icon: Zap, text: "Accès immédiat à vos formations et téléchargements" },
              { icon: Store, text: "Vos achats de toutes les boutiques Novakou réunis" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  {(()=>{const _I=item.icon;return _I?<_I size={18} className="text-white" />:null;})()}
                </div>
                <p className="text-white/85 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-white" />
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
                {wrongPortal && (
                  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900 mb-1">Mauvaise page de connexion</p>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Cet email correspond à un compte acheteur. La connexion vendeur ne peut pas vous diriger vers votre espace d&apos;achats — utilisez plutôt cette page.
                        </p>
                        {session && (
                          <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: "/acheteur/connexion" })}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline hover:no-underline"
                          >
                            <LogOut size={14} />
                            Se déconnecter pour continuer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c647a]" />
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
                      <AlertCircle size={16} className="text-red-500 mt-0.5" />
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
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
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
                    <MailCheck size={24} className="text-[#006e2f]" />
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
                      <AlertCircle size={16} className="text-red-500 mt-0.5" />
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
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <LogIn size={18} />
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
                    <ArrowLeft size={16} />
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
            <Lock size={14} />
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
