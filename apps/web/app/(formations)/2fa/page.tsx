"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CircleAlert, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard, AuthHead, AuthSuccess } from "@/components/auth/AuthCard";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { OtpInput } from "@/components/auth/OtpInput";

const PANNEAU = {
  headline: ["Une étape de plus,", "pour votre sécurité."],
  subtext: "Votre compte est protégé par une double authentification : saisissez le code de votre application.",
  benefits: [
    "Code à 6 chiffres, renouvelé toutes les 30 secondes",
    "Compatible Google Authenticator, Authy, 1Password",
    "Récupération par e-mail si vous perdez votre téléphone",
  ],
};

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
    return <div className="min-h-[100dvh] bg-[#f7f9fb]" />;
  }
  if (status === "unauthenticated") {
    return (
      <AuthShell portail="vendeur" panneau={PANNEAU}>
        <AuthCard>
          <AuthSuccess icone={CircleAlert} titre="Session expirée">
            <p>Veuillez vous reconnecter.</p>
            <Link href="/connexion" className="btn-glass btn-glass--primary" style={{ marginTop: 12 }}>
              <span className="lbl">Se connecter</span>
              <span className="btn-ico" aria-hidden="true">
                <LogIn />
              </span>
            </Link>
          </AuthSuccess>
        </AuthCard>
      </AuthShell>
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
    <AuthShell
      portail="vendeur"
      panneau={PANNEAU}
      cleBascule={modeRecup}
      sansCroise
      trust="Votre compte est protégé par une double authentification"
    >
      <AuthCard>
        <AuthHead
          id="tfa-titre"
          icone={ShieldCheck}
          centre
          titre="Authentification à deux facteurs"
          sousTitre={
            <>
              Bonjour <strong>{name}</strong>, entrez le code à 6 chiffres de votre application
              d’authentification pour accéder à votre espace.
              {email && (
                <>
                  <br />
                  <span className="font-mono text-[12px]">{email}</span>
                </>
              )}
            </>
          }
        />

        {error && (
          <AuthAlert type="error" id="tfa-erreur">
            {error}
          </AuthAlert>
        )}

        <form onSubmit={handleSubmit} className="nkauth-form" aria-labelledby="tfa-titre">
          <OtpInput
            id="tfa-code"
            label="Code de vérification"
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            erreur={error}
            describedBy={error ? "tfa-erreur" : undefined}
            autoFocus
            aide="Ouvrez Google Authenticator, Authy ou 1Password pour obtenir le code."
            delai={260}
          />

          <AuthButton
            type="submit"
            disabled={loading || code.length !== 6}
            chargement={loading}
            texteChargement="Vérification…"
            delai={320}
          >
            Accéder à mon espace
          </AuthButton>

          <p className="nkauth-foot" style={{ marginTop: 4 }} data-reveal="fade">
            <button type="button" onClick={handleCancel} className="nkauth-link nkauth-link--muted bg-transparent border-0 p-0 cursor-pointer font-[inherit]">
              <LogOut aria-hidden="true" />
              Annuler et me déconnecter
            </button>
          </p>
        </form>

        {/* ── Téléphone perdu : récupération par e-mail ─────────────── */}
        <div className="mt-6 border-t border-[#E6ECE8] pt-5" data-reveal="fade" style={{ "--d": 420 } as React.CSSProperties}>
          {modeRecup === "cache" && (
            <p className="text-center">
              <button
                type="button"
                onClick={() => setModeRecup("envoi")}
                className="nkauth-link bg-transparent border-0 p-0 cursor-pointer font-[inherit] text-[13px]"
              >
                Vous n’avez plus accès à votre application d’authentification&nbsp;?
              </button>
            </p>
          )}

          {modeRecup === "envoi" && (
            <div className="flex flex-col items-center gap-3 text-center" data-swap>
              <p className="nkauth-hint">
                Nous enverrons un code de récupération à <span className="font-mono">{email}</span>. Il
                désactivera votre double authentification : vous vous reconnecterez avec votre mot de
                passe, puis pourrez la réactiver depuis vos paramètres.
              </p>
              {recupMessage && (
                <p className="nkauth-error" role="alert">
                  {recupMessage}
                </p>
              )}
              <AuthButton
                type="button"
                variante="ghost"
                onClick={demanderCodeRecup}
                disabled={recupLoading}
                chargement={recupLoading}
                texteChargement="Envoi…"
                fleche={false}
              >
                M’envoyer le code par e-mail
              </AuthButton>
            </div>
          )}

          {modeRecup === "code" && (
            <div className="flex flex-col gap-4" data-swap>
              <p className="nkauth-hint text-center">
                Code envoyé à <span className="font-mono">{email}</span> — valable 10 minutes.
              </p>
              <OtpInput
                id="tfa-code-recup"
                label="Code reçu par e-mail"
                value={codeRecup}
                onChange={(v) => {
                  setCodeRecup(v);
                  if (recupMessage) setRecupMessage(null);
                }}
                erreur={recupMessage}
                describedBy={recupMessage ? "tfa-recup-erreur" : undefined}
              />
              {recupMessage && (
                <p id="tfa-recup-erreur" className="nkauth-error" role="alert">
                  {recupMessage}
                </p>
              )}
              <AuthButton
                type="button"
                onClick={confirmerRecup}
                disabled={recupLoading || codeRecup.length !== 6}
                chargement={recupLoading}
                texteChargement="Vérification…"
              >
                Désactiver ma double authentification
              </AuthButton>
              <p className="text-center">
                <button
                  type="button"
                  onClick={demanderCodeRecup}
                  disabled={recupLoading}
                  className="nkauth-link nkauth-link--muted bg-transparent border-0 p-0 cursor-pointer font-[inherit] text-[12px] disabled:opacity-50"
                >
                  Renvoyer un code
                </button>
              </p>
            </div>
          )}

          {modeRecup === "fait" && (
            <AuthAlert type="success" titre="Double authentification désactivée">
              Reconnectez-vous avec votre mot de passe…
            </AuthAlert>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  );
}

export default function TwoFaPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f7f9fb]" />}>
      <TwoFaInner />
    </Suspense>
  );
}
