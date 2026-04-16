"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes

export default function VerifierEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Format time as MM:SS
  function formatTime(s: number) {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  // Handle digit input
  function handleDigitChange(index: number, value: string) {
    // Only accept numeric input
    const char = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError("");

    // Auto-focus next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (char && index === 5) {
      const code = newDigits.join("");
      if (code.length === 6) {
        handleVerify(code);
      }
    }
  }

  // Handle keyboard navigation
  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Handle paste
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);
    setError("");

    // Focus appropriate input
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if all 6 digits pasted
    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  }

  // Verify the code
  const handleVerify = useCallback(
    async (code?: string) => {
      const otp = code || digits.join("");
      if (otp.length !== 6) {
        setError("Veuillez entrer les 6 chiffres du code.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: otp }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Erreur de verification");
          setLoading(false);
          return;
        }

        if (data.verified) {
          setSuccess(true);

          // Auto-login: try signing in with stored credentials
          // The password is not available here, so redirect to connexion
          // with a success indicator
          router.push("/connexion?verified=1");
        }
      } catch {
        setError("Une erreur est survenue. Veuillez reessayer.");
      } finally {
        setLoading(false);
      }
    },
    [digits, email, router]
  );

  // Resend code
  async function handleResend() {
    setResendLoading(true);
    setResendMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du renvoi");
        setResendLoading(false);
        return;
      }

      setResendMessage("Un nouveau code a ete envoye a votre adresse email.");
      setDigits(["", "", "", "", "", ""]);
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Impossible de renvoyer le code. Veuillez reessayer.");
    } finally {
      setResendLoading(false);
    }
  }

  // Redirect if no email param
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Email manquant</h2>
          <p className="text-slate-600 mb-6">
            Aucune adresse email n&apos;a ete fournie pour la verification.
          </p>
          <Link
            href="/inscription"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Retour a l&apos;inscription
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-2xl font-extrabold text-primary">FreelanceHigh</h1>
          </Link>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">mail</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Verifiez votre email</h2>
          <p className="text-slate-500 text-sm">
            Un code de verification a 6 chiffres a ete envoye a
          </p>
          <p className="text-primary font-semibold text-sm mt-1">{email}</p>
        </div>

        {/* OTP Inputs */}
        <div className="flex gap-2 sm:gap-3 justify-center mb-6" onPaste={handlePaste}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[i]}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading || success}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>

        {/* Timer */}
        {secondsLeft > 0 && !success && (
          <p className="text-center text-sm text-slate-500 mb-4">
            Code valide pendant{" "}
            <span className={`font-semibold ${secondsLeft < 60 ? "text-red-500" : "text-primary"}`}>
              {formatTime(secondsLeft)}
            </span>
          </p>
        )}
        {secondsLeft === 0 && !success && (
          <p className="text-center text-sm text-red-500 font-medium mb-4">
            Le code a expire. Veuillez en demander un nouveau.
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm text-center">
            Email verifie avec succes ! Redirection...
          </div>
        )}

        {/* Resend message */}
        {resendMessage && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl px-4 py-3 mb-4 text-sm text-center">
            {resendMessage}
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={loading || success || digits.join("").length !== 6}
          className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verification en cours...
            </>
          ) : success ? (
            <>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Verifie !
            </>
          ) : (
            "Verifier"
          )}
        </button>

        {/* Resend Link */}
        {!success && (
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
            >
              {resendLoading ? "Envoi en cours..." : "Renvoyer le code"}
            </button>
          </div>
        )}

        {/* Back to inscription */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Mauvaise adresse ?{" "}
            <Link href="/inscription" className="text-primary hover:text-primary/80 font-medium">
              Modifier
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
