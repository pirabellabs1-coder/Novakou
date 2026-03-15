import { NextResponse } from "next/server";

// Niveaux KYC requis par action
export const KYC_REQUIREMENTS = {
  publishService: 3,
  createFormation: 3,
  withdrawFunds: 3,
  sendOffer: 2,
  placeOrder: 2,
  createAgency: 3,
  eliteBadge: 4,
} as const;

// Roles qui necessitent une verification KYC
export const ROLES_REQUIRING_KYC = ["freelance", "agence"] as const;

// Roles exempts de verification KYC
export const ROLES_EXEMPT_FROM_KYC = ["client"] as const;

interface KycCheckResult {
  allowed: boolean;
  response?: NextResponse;
}

/**
 * Verifie si l'utilisateur a le niveau KYC requis pour une action.
 * Retourne allowed=true si OK, ou une reponse 403 prete a renvoyer.
 */
export function checkKycLevel(
  userKyc: number | undefined,
  requiredLevel: number,
  actionLabel: string,
  redirectTo = "/dashboard/kyc"
): KycCheckResult {
  const currentLevel = userKyc ?? 1;

  if (currentLevel >= requiredLevel) {
    return { allowed: true };
  }

  return {
    allowed: false,
    response: NextResponse.json(
      {
        error: `Verification d'identite requise pour ${actionLabel}. Completez votre KYC (niveau ${requiredLevel} minimum).`,
        code: "KYC_REQUIRED",
        requiredLevel,
        currentLevel,
        redirectTo,
      },
      { status: 403 }
    ),
  };
}

/**
 * Verifie si un role utilisateur necessite une verification KYC.
 */
export function roleRequiresKyc(role: string): boolean {
  return (ROLES_REQUIRING_KYC as readonly string[]).includes(role);
}

/**
 * Retourne le label de verification KYC pour le dashboard.
 */
export function getKycStatusLabel(level: number): {
  status: "not_verified" | "partial" | "verified" | "elite";
  label: string;
  color: string;
  bg: string;
  icon: string;
} {
  if (level >= 4) return { status: "elite", label: "Elite", color: "text-purple-400", bg: "bg-purple-400/10", icon: "diamond" };
  if (level >= 3) return { status: "verified", label: "Verifie", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: "verified" };
  if (level >= 2) return { status: "partial", label: "Partiellement verifie", color: "text-amber-400", bg: "bg-amber-400/10", icon: "warning" };
  return { status: "not_verified", label: "Non verifie", color: "text-slate-400", bg: "bg-slate-400/10", icon: "shield" };
}
