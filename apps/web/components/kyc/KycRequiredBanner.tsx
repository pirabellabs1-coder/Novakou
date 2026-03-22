"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getKycStatusLabel, roleRequiresKyc } from "@/lib/auth/kyc-guard";

/**
 * Affiche un bandeau d'alerte si l'utilisateur doit completer sa verification KYC.
 * A placer dans les layouts des espaces freelance, agence et instructeur.
 * Ne s'affiche PAS pour les clients et apprenants.
 */
export function KycRequiredBanner() {
  const { data: session, update } = useSession();
  const [apiKycLevel, setApiKycLevel] = useState<number | null>(null);

  // Force JWT refresh on mount to pick up KYC level changes from admin
  useEffect(() => {
    update();
    // Also check KYC level directly from API to avoid JWT cache issues
    fetch("/api/kyc")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.currentLevel != null) {
          setApiKycLevel(data.currentLevel);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session?.user) return null;

  const role = session.user.role;
  // Use the highest KYC level between JWT and API
  const jwtKycLevel = session.user.kyc ?? 1;
  const kycLevel = apiKycLevel !== null ? Math.max(jwtKycLevel, apiKycLevel) : jwtKycLevel;

  // Ne pas afficher pour les roles exempts
  if (!roleRequiresKyc(role)) return null;

  // Deja verifie (niveau 3+)
  if (kycLevel >= 3) return null;

  const statusInfo = getKycStatusLabel(kycLevel);

  // Adapter le lien KYC selon l'espace de l'utilisateur
  const kycHref =
    role === "agence"
      ? "/agence/kyc"
      : role === "instructeur"
        ? "/formations/instructeur/kyc"
        : "/dashboard/kyc";

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
      <span className="material-symbols-outlined text-amber-400 text-xl flex-shrink-0 mt-0.5">
        warning
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-300">
          Verification d&apos;identite requise
        </p>
        <p className="text-xs text-amber-400/80 mt-1">
          Completez votre verification d&apos;identite pour pouvoir publier des services, creer des formations et recevoir des paiements.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link
            href={kycHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Verifier mon identite
          </Link>
          <span className="text-xs text-amber-500/60">
            Statut actuel : {statusInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
}
