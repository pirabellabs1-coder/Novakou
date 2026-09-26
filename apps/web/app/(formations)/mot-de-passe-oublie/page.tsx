"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard, AuthHead, AuthSuccess } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

const PANNEAU = {
  headline: ["Un lien,", "et c’est réglé."],
  subtext: "Indiquez votre adresse e-mail : nous vous envoyons un lien sécurisé pour choisir un nouveau mot de passe.",
  benefits: [
    "Lien valable une heure, à usage unique",
    "Aucune donnée de vente n’est touchée",
    "Vos formations et produits restent en ligne",
  ],
};

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
    <AuthShell portail="vendeur" panneau={PANNEAU} cleBascule={sent ? "envoye" : "formulaire"}>
      <AuthCard>
        {sent ? (
          <AuthSuccess icone={MailCheck} titre="E-mail envoyé">
            <p>
              Si un compte existe avec l’adresse <strong>{email}</strong>, vous recevrez un lien pour
              réinitialiser votre mot de passe dans les prochaines minutes.
            </p>
            <div className="nkauth-alert nkauth-alert--info note">
              <div>
                Vérifiez aussi vos courriers indésirables. Le lien expire dans <strong>1 heure</strong>.
              </div>
            </div>
            <Link href="/connexion" className="nkauth-link nkauth-link--muted" style={{ marginTop: 8 }}>
              <ArrowLeft aria-hidden="true" />
              Retour à la connexion
            </Link>
          </AuthSuccess>
        ) : (
          <>
            <AuthHead
              id="oubli-titre"
              icone={KeyRound}
              titre="Mot de passe oublié ?"
              sousTitre="Entrez votre adresse e-mail et nous vous enverrons un lien pour le réinitialiser."
            />

            {error && (
              <AuthAlert type="error" id="oubli-erreur">
                {error}
              </AuthAlert>
            )}

            <form onSubmit={handleSubmit} className="nkauth-form" aria-labelledby="oubli-titre">
              <AuthField
                id="oubli-email"
                name="email"
                label="Adresse e-mail"
                icone={Mail}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                aria-invalid={!!error}
                describedBy={error ? "oubli-erreur" : undefined}
                delai={260}
              />

              <AuthButton type="submit" disabled={!email} chargement={loading} texteChargement="Envoi…" delai={320}>
                Envoyer le lien de réinitialisation
              </AuthButton>
            </form>

            <p className="nkauth-foot" data-reveal="fade" style={{ "--d": 400 } as React.CSSProperties}>
              <Link href="/connexion" className="nkauth-link nkauth-link--muted">
                <ArrowLeft aria-hidden="true" />
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}
