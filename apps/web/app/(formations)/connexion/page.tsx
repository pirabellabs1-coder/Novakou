"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { getDashboardForFormationsRole } from "@/lib/formations/role-routing";
import { redirigerVersOrigineAuth } from "@/lib/auth/oauth-origin";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard, AuthHead } from "@/components/auth/AuthCard";
import { AuthField, PasswordField } from "@/components/auth/AuthField";
import { AuthButton, GoogleIcon } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

/* ─────────────────────────── Contenu du panneau ─────────────────────────── */

const PANNEAU = {
  headline: ["Bon retour", "parmi nous."],
  subtext: "Connectez-vous pour retrouver vos formations, vos ventes et votre communauté.",
  benefits: [
    "Vos ventes et vos statistiques en temps réel",
    "Encaissement Mobile Money et carte bancaire",
    "Vos données chiffrées et protégées",
  ],
};

/* ─────────────────────────── Page ─────────────────────────── */

function ConnexionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered") === "1";
  const { data: existingSession, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const user = existingSession?.user as {
      role?: string;
      formationsRole?: string;
      tfaPending?: boolean;
    } | undefined;
    if (user?.tfaPending) {
      router.replace(`/2fa?callbackUrl=${encodeURIComponent(callbackUrlParam ?? "/")}`);
      return;
    }
    const target = callbackUrlParam ?? getDashboardForFormationsRole(
      user?.formationsRole as "apprenant" | "instructeur" | "mentor" | "affilie" | undefined,
      user?.role,
      { excludeApprenant: true }
    );
    router.replace(target.startsWith("/apprenant") ? "/acheteur/connexion?wrongPortal=1" : target);
  }, [callbackUrlParam, existingSession, router, status]);

  /** Après une erreur, le focus revient sur le champ à corriger. */
  function focaliser(id: "login-email" | "login-password") {
    document.getElementById(id)?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      focaliser(email ? "login-password" : "login-email");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // Legacy path kept for backward compat if authorize() still throws it.
        // The new flow uses JWT tfaPending + middleware redirect (no email query needed).
        if (result.error === "REQUIRES_2FA") {
          const cb = callbackUrlParam ?? "/";
          router.push(`/2fa?callbackUrl=${encodeURIComponent(cb)}`);
          return;
        }
        if (result.error === "EMAIL_NOT_VERIFIED") {
          // Email pas encore vérifié — renvoyer un code et rediriger vers OTP
          await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim().toLowerCase() }),
          }).catch(() => {});
          // After OTP verification we want to land on the correct role
          // dashboard, not always the apprenant one. "/" lets the middleware
          // resolve the right destination once the session is ready.
          const cb = callbackUrlParam ?? "/";
          const params = new URLSearchParams({
            email: email.trim().toLowerCase(),
            callbackUrl: cb,
            p: password,
          });
          router.push(`/verifier-email?${params.toString()}`);
          return;
        }
        setError(
          result.error === "CredentialsSignin"
            ? "E-mail ou mot de passe incorrect."
            : result.error
        );
        setLoading(false);
        focaliser("login-password");
        return;
      }

      // After login — fetch fresh session to get formationsRole, then redirect to correct dashboard
      const freshSession = await getSession();
      const user = freshSession?.user as {
        role?: string;
        formationsRole?: string;
        tfaPending?: boolean;
      } | undefined;

      // 2FA en attente ? On route sur /2fa directement (le middleware le ferait
      // aussi, mais on évite l'aller-retour).
      if (user?.tfaPending) {
        const cb = callbackUrlParam ?? getDashboardForFormationsRole(
          user?.formationsRole as "apprenant" | "instructeur" | "mentor" | "affilie" | undefined,
          user?.role
        );
        router.push(`/2fa?callbackUrl=${encodeURIComponent(cb)}`);
        return;
      }

      // Seller portal: NEVER drop a user into /apprenant — even if their
      // formationsRole is missing or set to "apprenant". The buyer space is
      // reachable ONLY through /acheteur/connexion. excludeApprenant=true
      // routes pure buyers to /acheteur/connexion?wrongPortal=1.
      let target = callbackUrlParam ?? getDashboardForFormationsRole(
        user?.formationsRole as "apprenant" | "instructeur" | "mentor" | "affilie" | undefined,
        user?.role,
        { excludeApprenant: true }
      );

      // Hard guarantee : la connexion vendeur (/connexion) ne doit JAMAIS
      // déposer l'utilisateur dans /apprenant. Si pour une raison quelconque
      // (callbackUrlParam, nouveau compte sans rôle, etc.) la cible calculée
      // pointe vers l'espace acheteur, on bascule sur /acheteur/connexion
      // avec un indice "wrongPortal" — l'utilisateur sera invité à se
      // reconnecter depuis la page acheteur.
      if (target.startsWith("/apprenant")) {
        target = "/acheteur/connexion?wrongPortal=1";
      }

      // Vendeur multi-boutique : on n'impose PLUS le chooser à la connexion.
      // Le tableau de bord atterrit sur la VUE GLOBALE (« Toutes les boutiques »,
      // cumulé) ; la personne choisit ensuite une boutique via le sélecteur.

      router.push(target);
      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (redirigerVersOrigineAuth()) return;
    setLoading(true);
    setError(null);
    // Set pending formationsRole cookie before OAuth redirect
    document.cookie = "pendingFormationsRole=; path=/; max-age=0";
    // Tell middleware: this OAuth flow originated from the SELLER portal.
    // Middleware's "/" handler reads this cookie and refuses to drop the
    // user into /apprenant/* (the buyer space is reachable only through
    // /acheteur/connexion). 5-minute TTL is plenty for the OAuth round-trip.
    document.cookie = "nk_login_intent=seller; path=/; max-age=300; samesite=lax";
    // Don't hardcode /apprenant/dashboard here — that landed every Google-
    // signed-in vendor / mentor / affilié in the buyer space. Sending them
    // to "/" instead lets the middleware's home-page handler route them to
    // the correct role dashboard once the session is set.
    await signIn("google", { callbackUrl: callbackUrlParam ?? "/" });
  }

  // Arrivée depuis un autre hôte (cf. lib/auth/oauth-origin) : on relance
  // Google sans redemander un clic.
  useEffect(() => {
    if (searchParams.get("oauth") !== "google" || status !== "unauthenticated") return;
    void handleGoogle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, status]);

  return (
    <AuthShell portail="vendeur" panneau={PANNEAU}>
      <AuthCard>
        <AuthHead id="login-titre" titre="Connexion" sousTitre="Accédez à votre espace vendeur Novakou." />

        {/* Bandeau succès après inscription (?registered=1) */}
        {registered && !error && (
          <AuthAlert type="success" titre="Compte créé">
            Connectez-vous avec vos identifiants pour continuer.
          </AuthAlert>
        )}

        {error && (
          <AuthAlert type="error" id="login-error">
            {error}
          </AuthAlert>
        )}

        <form onSubmit={handleSubmit} className="nkauth-form" aria-labelledby="login-titre">
          <AuthField
            id="login-email"
            name="email"
            label="Adresse e-mail"
            icone={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!error}
            describedBy={error ? "login-error" : undefined}
            delai={260}
          />

          <PasswordField
            id="login-password"
            name="password"
            label="Mot de passe"
            icone={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-invalid={!!error}
            describedBy={error ? "login-error" : undefined}
            delai={320}
            aside={
              <Link href="/mot-de-passe-oublie" className="nkauth-link">
                Mot de passe oublié&nbsp;?
              </Link>
            }
          />

          <AuthButton type="submit" chargement={loading} texteChargement="Connexion en cours…" delai={380}>
            Se connecter
          </AuthButton>
        </form>

        <div className="nkauth-sep" aria-hidden="true">
          ou
        </div>

        <AuthButton
          type="button"
          variante="light"
          onClick={handleGoogle}
          disabled={loading}
          icone={<GoogleIcon />}
          delai={440}
        >
          Continuer avec Google
        </AuthButton>

        <p className="nkauth-foot" data-reveal="fade" style={{ "--d": 500 } as React.CSSProperties}>
          Pas encore de compte&nbsp;?{" "}
          <Link href="/inscription" className="nkauth-link">
            S’inscrire gratuitement
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f7f9fb]" />}>
      <ConnexionInner />
    </Suspense>
  );
}
