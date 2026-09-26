"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { ArrowLeft, LogOut, Mail, MailCheck, ShoppingBag } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard, AuthHead } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { OtpInput } from "@/components/auth/OtpInput";
import { usePremierRendu } from "@/components/auth/motion";

const PANNEAU = {
  headline: ["Tous vos achats,", "un seul endroit."],
  subtext: "Connexion sans mot de passe : un code à 6 chiffres envoyé à l’adresse e-mail de votre achat.",
  benefits: [
    "Accès immédiat à vos formations et téléchargements",
    "Vos achats de toutes les boutiques Novakou réunis",
    "Code sécurisé, valable 10 minutes",
  ],
  trust: "Connexion chiffrée SSL 256 bits · Code valable 10 minutes",
};

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
  // Entrée CSS au chargement seulement ; ensuite, les bascules d'étape
  // passent par anime.js (cleBascule) pour ne pas animer deux fois.
  const premier = usePremierRendu();

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
    <AuthShell portail="acheteur" panneau={PANNEAU} cleBascule={step} trust={PANNEAU.trust}>
      <AuthCard>
        {step === 1 && (
          <>
            {wrongPortal && (
              <AuthAlert type="info" titre="Mauvaise page de connexion">
                Cet e-mail correspond à un compte acheteur. La connexion vendeur ne peut pas vous
                diriger vers votre espace d’achats — utilisez plutôt cette page.
                {session && (
                  <>
                    <br />
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/acheteur/connexion" })}
                      className="lnk"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      Se déconnecter pour continuer
                    </button>
                  </>
                )}
              </AuthAlert>
            )}

            <AuthHead
              id="acheteur-titre"
              icone={ShoppingBag}
              titre="Accédez à vos achats"
              sousTitre="Entrez l’adresse e-mail utilisée lors de votre achat : nous vous envoyons un code de connexion."
              swap
            />

            {error && (
              <AuthAlert type="error" id="acheteur-erreur">
                {error}
              </AuthAlert>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp(email);
              }}
              className="nkauth-form"
              aria-labelledby="acheteur-titre"
            >
              <div data-swap>
                <AuthField
                  id="acheteur-email"
                  name="email"
                  label="Adresse e-mail"
                  icone={Mail}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  autoFocus
                  autoComplete="email"
                  aria-invalid={!!error}
                  describedBy={error ? "acheteur-erreur" : undefined}
                  delai={premier ? 260 : undefined}
                />
              </div>

              <div data-swap>
                <AuthButton
                  type="submit"
                  disabled={loading || !email}
                  chargement={loading}
                  texteChargement="Envoi du code…"
                  delai={premier ? 320 : undefined}
                >
                  Recevoir mon code
                </AuthButton>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <AuthHead
              id="acheteur-titre"
              icone={MailCheck}
              titre="Vérifiez votre e-mail"
              sousTitre={
                <>
                  Un code à 6 chiffres a été envoyé à <strong className="text-[#0E1512]">{email}</strong>.
                </>
              }
              swap
            />

            {error && (
              <AuthAlert type="error" id="acheteur-erreur">
                {error}
              </AuthAlert>
            )}

            <form onSubmit={handleVerify} className="nkauth-form" aria-labelledby="acheteur-titre">
              <div data-swap>
                <OtpInput
                  id="acheteur-code"
                  label="Code à 6 chiffres"
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    if (error) setError(null);
                  }}
                  erreur={error}
                  describedBy={error ? "acheteur-erreur" : undefined}
                  inputRef={codeInputRef}
                />
              </div>

              <div data-swap>
                <AuthButton
                  type="submit"
                  disabled={loading || code.length !== 6}
                  chargement={loading}
                  texteChargement="Connexion…"
                >
                  Accéder à mon espace
                </AuthButton>
              </div>
            </form>

            <div className="mt-5 flex items-center justify-between gap-3 text-[13px]" data-swap>
              <button
                type="button"
                onClick={() => { setStep(1); setCode(""); setError(null); }}
                className="nkauth-link nkauth-link--muted bg-transparent border-0 p-0 cursor-pointer font-[inherit]"
              >
                <ArrowLeft aria-hidden="true" />
                Changer d’e-mail
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleSendOtp(email)}
                className="nkauth-link bg-transparent border-0 p-0 cursor-pointer font-[inherit] tabular-nums disabled:opacity-50 disabled:no-underline disabled:cursor-default"
                aria-live="polite"
              >
                {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
              </button>
            </div>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}

export default function AcheteurConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f7f9fb]" />}>
      <ConnexionInner />
    </Suspense>
  );
}
