"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle, BookOpen, ArrowRight, AlertTriangle } from "lucide-react";

export default function PaiementSuccesPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const locale = useLocale();

  const [verifyState, setVerifyState] = useState<"loading" | "verified" | "error">(
    sessionId ? "loading" : "verified"
  );

  useEffect(() => {
    if (!sessionId) return;

    fetch(`/api/formations/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Verification failed");
        return r.json();
      })
      .then((data) => {
        if (data.paid) {
          setVerifyState("verified");
        } else {
          setVerifyState("error");
        }
      })
      .catch(() => setVerifyState("error"));
  }, [sessionId]);

  const t = (fr: string, en: string) => (locale === "fr" ? fr : en);

  return (
    <div className="max-w-lg w-full mx-auto text-center">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
        {t("Paiement réussi !", "Payment Successful!")}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        {t(
          "Votre formation est maintenant accessible. Commencez à apprendre dès maintenant !",
          "Your course is now accessible. Start learning right now!"
        )}
      </p>

      {/* Verification warning if failed */}
      {verifyState === "error" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 dark:text-amber-400 text-sm">
            {t(
              "Nous n'avons pas pu vérifier votre paiement automatiquement. Si vous avez été débité, votre formation sera activée sous peu.",
              "We could not verify your payment automatically. If you were charged, your course will be activated shortly."
            )}
          </p>
        </div>
      )}

      {/* Confirmation box */}
      <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8 text-left">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-900 dark:text-white font-medium text-sm">
              {t("Confirmation envoyée", "Confirmation Sent")}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {t(
                "Vous recevrez un email de confirmation avec les détails de votre achat.",
                "You will receive a confirmation email with your purchase details."
              )}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 mt-4">
          <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-900 dark:text-white font-medium text-sm">
              {t("Accès immédiat", "Immediate Access")}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {t(
                "Votre formation est déjà disponible dans votre espace apprenant.",
                "Your course is already available in your learner space."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link
          href="/formations/mes-formations"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          {t("Accéder à mes formations", "Access My Courses")}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/formations/explorer"
          className="text-slate-500 dark:text-slate-400 hover:text-primary text-sm transition-colors"
        >
          {t("Explorer d'autres formations", "Explore more courses")}
        </Link>
      </div>
    </div>
  );
}
