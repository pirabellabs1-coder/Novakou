"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { XCircle, ShoppingCart } from "lucide-react";

export default function PaiementEchecPage() {
  const locale = useLocale();

  const t = (fr: string, en: string) => (locale === "fr" ? fr : en);

  return (
    <div className="max-w-lg w-full mx-auto text-center">
      {/* Error icon */}
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
        {t("Paiement annulé", "Payment Cancelled")}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        {t(
          "Votre paiement n'a pas été effectué. Aucun montant n'a été débité de votre compte.",
          "Your payment was not completed. No amount has been charged to your account."
        )}
      </p>

      {/* Info box */}
      <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8 text-left">
        <p className="text-slate-900 dark:text-white font-medium text-sm mb-3">
          {t("Que s'est-il passé ?", "What happened?")}
        </p>
        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
          <li>- {t("Vous avez annulé la procédure de paiement", "You cancelled the payment process")}</li>
          <li>- {t("Votre carte a été refusée", "Your card was declined")}</li>
          <li>- {t("Une erreur technique s'est produite", "A technical error occurred")}</li>
        </ul>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-4">
          {t(
            "Vos formations restent dans votre panier. Vous pouvez réessayer quand vous le souhaitez.",
            "Your courses remain in your cart. You can try again whenever you want."
          )}
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link
          href="/formations/panier"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          {t("Retour au panier", "Back to Cart")}
        </Link>
        <Link
          href="/formations/explorer"
          className="text-slate-500 dark:text-slate-400 hover:text-primary text-sm transition-colors"
        >
          {t("Explorer les formations", "Explore courses")}
        </Link>
      </div>
    </div>
  );
}
