"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { getDashboardForFormationsRole } from "@/lib/formations/role-routing";

/* ─────────────────────────── Contenu statique ─────────────────────────── */

const REASSURANCES = [
  "Retrouvez vos formations, vos ventes et vos statistiques",
  "Encaissez par Mobile Money et carte bancaire",
  "Suivez vos résultats en temps réel, où que vous soyez",
  "Vos données sont chiffrées et protégées",
] as const;

const STATS = [
  { value: "100 %", label: "Paiements sécurisés" },
  { value: "24 h/24", label: "Ventes automatisées" },
  { value: "3", label: "Réseaux Mobile Money" },
] as const;

const INPUT_BASE =
  "w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-11 text-sm text-[#191c1e] placeholder-[#9aa3b5] transition-all duration-300 focus:border-[#006e2f] focus:outline-none focus:ring-4 focus:ring-[#006e2f]/10";

/* ─────────────────────────── Composants internes ─────────────────────────── */

function BrandMark({ variant }: { variant: "hero" | "card" }) {
  if (variant === "hero") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 backdrop-blur-sm">
          <span className="text-sm font-extrabold tracking-tight text-white">NK</span>
        </div>
        <span className="text-lg font-bold text-white">Novakou</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_8px_16px_-6px_rgba(0,110,47,0.45)]"
        style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
      >
        <span className="text-xs font-extrabold text-white">NK</span>
      </div>
      <span className="text-lg font-bold text-[#191c1e]">Novakou</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

/** Panneau héro immersif — masqué sous lg, jumeau visuel de la page d'inscription. */
function HeroPanel() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-1/2 xl:w-[55%] xl:p-16"
      style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
    >
      {/* Décor — motifs en CSS pur */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div className="absolute -right-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-[#22c55e]/30 blur-3xl" />
        <div className="absolute -bottom-36 -left-32 h-96 w-96 rounded-full bg-[#00240f]/60 blur-3xl" />
        <div className="absolute right-16 top-28 h-44 w-44 rounded-full border border-white/10" />
        <div className="absolute right-28 top-40 h-44 w-44 rounded-full border border-white/[0.07]" />
      </div>

      <div className="relative z-10">
        <BrandMark variant="hero" />
      </div>

      <div className="relative z-10 max-w-xl py-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ade80]" />
          <span className="text-xs font-semibold tracking-wide text-white/90">
            Espace créateur Novakou
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-extrabold leading-[1.12] tracking-tight text-white xl:text-[2.75rem]">
          Bon retour
          <br />
          parmi{" "}
          <span className="bg-gradient-to-r from-[#86efac] to-[#4ade80] bg-clip-text text-transparent">
            nous
          </span>
        </h1>
        <p className="mb-8 max-w-md text-[15px] leading-relaxed text-white/75">
          Connectez-vous pour retrouver vos produits, vos ventes et votre communauté.
        </p>

        <ul className="space-y-3.5">
          {REASSURANCES.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <CheckCircle2 size={19} className="mt-0.5 flex-shrink-0 text-[#86efac]" />
              <span className="text-sm leading-relaxed text-white/85">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-colors duration-300 hover:bg-white/15"
          >
            <p className="text-xl font-extrabold text-white xl:text-2xl">{stat.value}</p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-white/70">{stat.label}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

function ConnexionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get("callbackUrl");
  const registered = searchParams.get("registered") === "1";
  const { data: existingSession, status } = useSession();

  const [showPassword, setShowPassword] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
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

      // Vendeur multi-shop : si 2+ boutiques sans cookie actif, forcer le chooser
      if (target.startsWith("/vendeur") && !callbackUrlParam) {
        try {
          const res = await fetch("/api/formations/vendeur/shops/active");
          const json = await res.json();
          const shops = json?.data?.shops ?? [];
          if (shops.length >= 2 && json?.data?.needsChooser !== false) {
            target = "/vendeur/choisir-boutique";
          }
        } catch {
          /* fall back to dashboard */
        }
      }

      router.push(target);
      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
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

  return (
    <div className="flex min-h-[calc(100vh-96px)]">
      <HeroPanel />

      {/* ── Volet formulaire ────────────────────────────────────────── */}
      <main className="flex w-full items-center justify-center bg-[#f7f9fb] px-5 py-10 lg:w-1/2 xl:w-[45%]">
        <div className="w-full max-w-md">
          {/* Logo mobile (héro masqué sous lg) */}
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark variant="card" />
          </div>

          <div className="rounded-[28px] border border-[#e7ecf2] bg-white p-7 shadow-[0_24px_60px_-28px_rgba(0,61,26,0.18)] sm:p-9">
            <div className="mb-7">
              <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-[#191c1e]">
                Connexion
              </h2>
              <p className="text-sm text-[#5c647a]">Accédez à votre espace créateur Novakou.</p>
            </div>

            {/* Bandeau succès après inscription (?registered=1) */}
            {registered && !error && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3"
              >
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-[#16a34a]" />
                <div>
                  <p className="text-sm font-semibold text-[#166534]">Compte créé&nbsp;!</p>
                  <p className="text-xs text-[#166534]/80">
                    Connectez-vous avec vos identifiants pour continuer.
                  </p>
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div
                id="login-error"
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-[13px] font-semibold text-[#191c1e]"
                >
                  Adresse e-mail
                </label>
                <div className="group relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa3b5] transition-colors duration-300 group-focus-within:text-[#006e2f]"
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    className={`${INPUT_BASE} pr-4`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-[13px] font-semibold text-[#191c1e]"
                  >
                    Mot de passe
                  </label>
                  <Link
                    href="/mot-de-passe-oublie"
                    className="text-xs font-semibold text-[#006e2f] transition-colors duration-300 hover:text-[#005a26] hover:underline"
                  >
                    Mot de passe oublié&nbsp;?
                  </Link>
                </div>
                <div className="group relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa3b5] transition-colors duration-300 group-focus-within:text-[#006e2f]"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                    className={`${INPUT_BASE} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#9aa3b5] transition-colors duration-300 hover:bg-[#f1f5f9] hover:text-[#191c1e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006e2f]/40"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(0,110,47,0.55)] transition-all duration-300 hover:shadow-[0_14px_28px_-10px_rgba(0,110,47,0.65)] hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006e2f] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #006e2f 0%, #16a34a 55%, #22c55e 100%)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="my-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-[#e7ecf2]" />
              <span className="text-xs font-medium text-[#5c647a]">ou</span>
              <span className="h-px flex-1 bg-[#e7ecf2]" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-white py-3 text-sm font-semibold text-[#191c1e] transition-all duration-300 hover:border-[#cbd5e1] hover:bg-[#f8fafc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006e2f]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              Continuer avec Google
            </button>

            <p className="mt-7 text-center text-sm text-[#5c647a]">
              Pas encore de compte&nbsp;?{" "}
              <Link
                href="/inscription"
                className="font-bold text-[#006e2f] transition-colors duration-300 hover:text-[#005a26] hover:underline"
              >
                S’inscrire gratuitement
              </Link>
            </p>
          </div>

          {/* ── Accès acheteurs (achat sans compte vendeur) ── */}
          <div className="mt-6 rounded-2xl border border-[#e7ecf2] bg-white p-5 transition-shadow duration-300 hover:shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#bbf7d0] bg-[#f0fdf4]">
                <ShoppingBag size={18} className="text-[#006e2f]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#191c1e]">
                  Vous avez déjà effectué un achat sur Novakou&nbsp;?
                </p>
                <p className="mb-2 mt-0.5 text-xs leading-relaxed text-[#5c647a]">
                  Accédez à vos formations et produits sans créer de compte vendeur.
                </p>
                <Link
                  href="/acheteur/connexion"
                  className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#006e2f] transition-colors duration-300 hover:text-[#005a26]"
                >
                  Accéder à mes achats
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-[#5c647a]">
            <Lock size={13} aria-hidden="true" />
            Connexion chiffrée · SSL 256 bits
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-96px)] bg-[#f7f9fb]" />}>
      <ConnexionInner />
    </Suspense>
  );
}
