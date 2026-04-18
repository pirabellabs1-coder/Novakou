"use client";

import Link from "next/link";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function VerifierEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/vendeur/dashboard";
  const password = searchParams.get("p") ?? ""; // optional — enables auto-login after verify

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function handleDigitChange(idx: number, value: string) {
    // Only digits, single char
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError(null);

    // Auto-advance
    if (digit && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }

    // Auto-submit when 6 digits entered
    if (digit && idx === 5 && next.every((d) => d)) {
      submitCode(next.join(""));
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      const next = text.split("");
      setCode(next);
      submitCode(text);
    }
  }

  async function submitCode(codeStr: string) {
    if (codeStr.length !== 6) {
      setError("Le code doit contenir 6 chiffres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeStr }),
      });
      const json = await res.json();

      if (!res.ok || !json.verified) {
        setError(json.error || "Code incorrect. Vérifiez votre boîte email.");
        setLoading(false);
        // Reset code inputs for retry
        setCode(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
        return;
      }

      // Email verified — auto sign-in if password provided
      if (password) {
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (signInResult?.error) {
          // Verified but auto-login failed → redirect to login
          router.push(`/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}&verified=1`);
          return;
        }
        // Vendeur multi-shop : forcer le chooser si 2+ boutiques
        let target = callbackUrl;
        if (target.startsWith("/vendeur")) {
          try {
            const r = await fetch("/api/formations/vendeur/shops/active");
            const j = await r.json();
            if ((j?.data?.shops?.length ?? 0) >= 2 && j?.data?.needsChooser !== false) {
              target = "/vendeur/choisir-boutique";
            }
          } catch {
            /* fall back */
          }
        }
        router.push(target);
        router.refresh();
      } else {
        // No password → just redirect to login with success flag
        router.push(`/connexion?email=${encodeURIComponent(email)}&verified=1`);
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResent(true);
        setCooldown(60);
        setTimeout(() => setResent(false), 3000);
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Erreur lors de l'envoi du code.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          <h2 className="text-lg font-extrabold text-[#191c1e] mt-3">Lien invalide</h2>
          <p className="text-sm text-[#5c647a] mt-2 mb-5">Ce lien a expiré ou est invalide.</p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-5 py-10 bg-[#f7f9fb]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: "#006e2f" }}>
            <span className="text-white font-extrabold text-sm">NK</span>
          </div>
          <span className="font-bold text-[#191c1e] text-lg">Novakou</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #006e2f15, #22c55e15)" }}>
            <span className="material-symbols-outlined text-[28px] text-[#006e2f]">mark_email_read</span>
          </div>

          {/* Heading */}
          <h1 className="text-xl font-extrabold text-[#191c1e] text-center tracking-tight">
            Vérifiez votre adresse email
          </h1>
          <p className="text-sm text-[#5c647a] text-center mt-2 leading-relaxed">
            Nous avons envoyé un code à 6 chiffres à<br />
            <span className="font-bold text-[#191c1e]">{email}</span>
          </p>

          {/* OTP inputs */}
          <form onSubmit={(e) => { e.preventDefault(); submitCode(code.join("")); }} className="mt-8">
            <div className="flex gap-2 justify-center">
              {code.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={loading}
                  className="w-12 h-14 text-center text-2xl font-extrabold text-[#191c1e] bg-[#f7f9fb] border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#006e2f] focus:bg-white disabled:opacity-50 transition-colors"
                />
              ))}
            </div>

            {error && (
              <p className="mt-4 text-center text-sm text-red-600 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </p>
            )}

            {loading && (
              <p className="mt-4 text-center text-sm text-[#5c647a] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Vérification…
              </p>
            )}
          </form>

          {/* Resend */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            {resent ? (
              <p className="text-sm text-[#006e2f] font-semibold flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Nouveau code envoyé !
              </p>
            ) : (
              <>
                <p className="text-xs text-[#5c647a]">Pas reçu le code ?</p>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="mt-2 text-sm font-bold text-[#006e2f] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : resending ? "Envoi…" : "Renvoyer un nouveau code"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom help */}
        <div className="mt-5 text-center space-y-2">
          <p className="text-xs text-[#5c647a]">
            Vérifiez aussi votre dossier <strong>spam / indésirables</strong>.
          </p>
          <Link href="/connexion" className="text-xs text-[#5c647a] hover:text-[#006e2f] transition-colors">
            Mauvais email ? <span className="font-semibold">Recommencer l&apos;inscription</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifierEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-96px)] bg-[#f7f9fb] flex items-center justify-center">
        <span className="material-symbols-outlined text-[40px] text-[#006e2f] animate-spin">progress_activity</span>
      </div>
    }>
      <VerifierEmailInner />
    </Suspense>
  );
}
