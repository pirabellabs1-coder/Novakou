"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, CircleAlert, CircleCheck, KeyRound, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard, AuthHead, AuthSuccess } from "@/components/auth/AuthCard";
import { PasswordField } from "@/components/auth/AuthField";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";

const PANNEAU = {
  headline: ["Un nouveau", "mot de passe."],
  subtext: "Choisissez un mot de passe solide : il protège vos ventes, vos retraits et vos clients.",
  benefits: [
    "10 caractères minimum, majuscule, minuscule et chiffre",
    "Vos sessions actives restent ouvertes",
    "Retour immédiat à votre espace après validation",
  ],
};

const CRITERES = [
  { key: "length", label: "Au moins 10 caractères" },
  { key: "upper", label: "Une lettre majuscule (A-Z)" },
  { key: "lower", label: "Une lettre minuscule (a-z)" },
  { key: "number", label: "Un chiffre (0-9)" },
] as const;

function ResetInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const allPassed = Object.values(passwordChecks).every(Boolean);
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien de réinitialisation invalide ou expiré.");
      return;
    }
    if (!allPassed) {
      setError("Veuillez respecter tous les critères du mot de passe.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/confirm-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(j.error || "Erreur lors de la réinitialisation");
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/connexion");
      }, 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell portail="vendeur" panneau={PANNEAU}>
        <AuthCard>
          <AuthSuccess icone={CircleAlert} titre="Lien invalide">
            <p>Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.</p>
            <Link href="/mot-de-passe-oublie" className="btn-glass btn-glass--primary" style={{ marginTop: 12 }}>
              <span className="lbl">Demander un nouveau lien</span>
              <span className="btn-ico" aria-hidden="true">
                <KeyRound />
              </span>
            </Link>
          </AuthSuccess>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell portail="vendeur" panneau={PANNEAU} cleBascule={success ? "ok" : "formulaire"}>
      <AuthCard>
        {success ? (
          <AuthSuccess icone={CircleCheck} titre="Mot de passe mis à jour">
            <p>Vous allez être redirigé vers la page de connexion…</p>
          </AuthSuccess>
        ) : (
          <>
            <AuthHead
              id="reset-titre"
              icone={Lock}
              titre="Nouveau mot de passe"
              sousTitre="Choisissez un mot de passe fort et sécurisé."
            />

            {error && (
              <AuthAlert type="error" id="reset-erreur">
                {error}
              </AuthAlert>
            )}

            <form onSubmit={handleSubmit} className="nkauth-form" aria-labelledby="reset-titre">
              <PasswordField
                id="reset-password"
                name="password"
                label="Nouveau mot de passe"
                icone={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 10 caractères"
                required
                autoComplete="new-password"
                aria-invalid={!!error && !allPassed}
                describedBy={error ? "reset-erreur reset-criteres" : "reset-criteres"}
                delai={260}
              />

              {/* Critères, cochés en direct — alignés sur l'API */}
              <ul id="reset-criteres" className="nkauth-rules" aria-label="Critères du mot de passe" data-reveal style={{ "--d": 300 } as React.CSSProperties}>
                {CRITERES.map((c) => {
                  const ok = passwordChecks[c.key];
                  return (
                    <li key={c.key} className={ok ? "ok" : undefined}>
                      <span className="tick" aria-hidden="true">
                        <Check strokeWidth={4} />
                      </span>
                      <span>
                        {c.label}
                        <span className="sr-only">{ok ? " — respecté" : " — à respecter"}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <PasswordField
                id="reset-confirm"
                name="confirm"
                label="Confirmer le mot de passe"
                icone={KeyRound}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                required
                autoComplete="new-password"
                erreur={mismatch ? "Les mots de passe ne correspondent pas." : null}
                delai={340}
              />

              <AuthButton
                type="submit"
                disabled={loading || !allPassed || password !== confirm}
                chargement={loading}
                texteChargement="Mise à jour…"
                delai={400}
              >
                Mettre à jour le mot de passe
              </AuthButton>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#f7f9fb]" />}>
      <ResetInner />
    </Suspense>
  );
}
