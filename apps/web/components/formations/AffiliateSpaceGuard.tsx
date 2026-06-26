"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getDashboardForFormationsRole, type FormationsRole } from "@/lib/formations/role-routing";

/**
 * Garde de l'espace affilié (/affilie/*).
 *
 * Contrairement à RoleGuard (qui exige formationsRole === "affilie"), l'affiliation
 * est une capacité SECONDAIRE : un apprenant — ou tout autre rôle — peut rejoindre
 * le programme et doit alors pouvoir accéder à son espace affilié. On autorise donc :
 *   - les admins,
 *   - les utilisateurs dont le formationsRole est "affilie",
 *   - tout utilisateur possédant un profil affilié (vérifié via l'API).
 * Sinon → redirection vers le tableau de bord correspondant à son rôle.
 */
export function AffiliateSpaceGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/connexion?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const user = session?.user as { role?: string; formationsRole?: string } | undefined;
    const role = user?.role;
    const fr = (user?.formationsRole as FormationsRole) ?? null;

    // Accès immédiat : admin ou affilié à titre principal.
    if (role === "ADMIN" || role === "admin" || fr === "affilie") {
      setState("allowed");
      return;
    }

    // Sinon : autorisé seulement si l'utilisateur possède un profil affilié.
    let cancelled = false;
    fetch("/api/formations/apprenant/affiliate")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j?.isAffiliate === true) {
          setState("allowed");
        } else {
          router.replace(getDashboardForFormationsRole(fr, role));
        }
      })
      .catch(() => {
        if (!cancelled) router.replace(getDashboardForFormationsRole(fr, role));
      });
    return () => { cancelled = true; };
  }, [status, session, router]);

  if (state !== "allowed") {
    return (
      <div className="min-h-screen bg-[#0a1510] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[40px] text-[#22c55e] animate-spin">progress_activity</span>
          <p className="text-sm text-[#5c9e7a] mt-3">Vérification de votre accès affilié…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
