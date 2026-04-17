"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getDashboardForFormationsRole } from "@/lib/formations/role-routing";

function ConnexionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlParam = searchParams.get("callbackUrl");

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Email et mot de passe requis."); return; }
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "REQUIRES_2FA") {
          const cb = callbackUrlParam ?? "/apprenant/dashboard";
          router.push(`/2fa?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(cb)}`);
          return;
        }
        setError(
          result.error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect."
            : result.error
        );
        setLoading(false);
        return;
      }

      // After login — fetch fresh session to get formationsRole, then redirect to correct dashboard
      const freshSession = await getSession();
      const user = freshSession?.user as { role?: string; formationsRole?: string } | undefined;
      const target = callbackUrlParam ?? getDashboardForFormationsRole(
        user?.formationsRole as "apprenant" | "instructeur" | "mentor" | "affilie" | undefined,
        user?.role
      );
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
    await signIn("google", { callbackUrl: callbackUrlParam ?? "/apprenant/dashboard" });
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
          <p className="text-white/70 text-sm font-medium mb-4 uppercase tracking-wider">Plateforme de formations en ligne</p>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-8">
            Rejoignez des créateurs<br />
            qui vendent<br />
            en ligne
          </h1>
          <div className="space-y-4">
            {[
              { icon: "play_circle", text: "Vendez formations, ebooks et services numériques" },
              { icon: "autorenew", text: "Processus 100% automatisé — encaissez pendant que vous dormez" },
              { icon: "phone_android", text: "Paiement Mobile Money (Orange, Wave, MTN) dès le départ" },
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
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className="material-symbols-outlined text-amber-300 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            ))}
          </div>
          <p className="text-white/90 text-sm italic leading-relaxed mb-3">
            &quot;J&apos;ai généré 480 000 FCFA en 3 semaines avec ma première formation. Novakou a tout changé pour moi.&quot;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AD</div>
            <div>
              <p className="text-white text-xs font-semibold">Aminata Diallo</p>
              <p className="text-white/60 text-[10px]">Formatrice · Dakar, Sénégal</p>
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
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-[#191c1e] mb-1.5">Bon retour parmi nous 👋</h2>
              <p className="text-sm text-[#5c647a]">Connectez-vous à votre espace Novakou</p>
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </button>

            <div className="relative flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-[#5c647a] font-medium flex-shrink-0">ou continuez avec votre email</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">Adresse email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#191c1e]">Mot de passe</label>
                  <Link href="/mot-de-passe-oublie" className="text-xs text-[#006e2f] font-semibold hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5c647a]">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all bg-white"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c647a] hover:text-[#191c1e]" aria-label="Afficher le mot de passe">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {loading ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Connexion…</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">login</span>Se connecter</>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-[#5c647a] mt-6">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-[#006e2f] font-bold hover:underline">
                Créer un compte gratuitement
              </Link>
            </p>
          </div>

          <p className="text-center text-[11px] text-[#5c647a] mt-4 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            Connexion sécurisée SSL 256-bit
          </p>
        </div>
      </div>
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
