"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getDashboardForFormationsRole, type FormationsRole } from "@/lib/formations/role-routing";

/**
 * RoleGuard — ensures user has the expected formationsRole.
 * If not logged in → redirect to /formations/connexion
 * If wrong role    → redirect to their correct dashboard
 */
export function RoleGuard({
  requiredRole,
  children,
}: {
  requiredRole: FormationsRole;
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/formations/connexion?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const user = session?.user as { role?: string; formationsRole?: string } | undefined;
    const userRole = user?.role;
    const userFormationsRole = user?.formationsRole as FormationsRole;

    // Admin has access everywhere
    if (userRole === "ADMIN" || userRole === "admin") return;

    // If user's role doesn't match the required role for this space → redirect to their correct space
    if (userFormationsRole !== requiredRole) {
      const correctDashboard = getDashboardForFormationsRole(userFormationsRole, userRole);
      router.replace(correctDashboard);
    }
  }, [status, session, requiredRole, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[40px] text-[#006e2f] animate-spin">progress_activity</span>
          <p className="text-sm text-[#5c647a] mt-3">Chargement…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as { role?: string; formationsRole?: string } | undefined;
  const userRole = user?.role;
  const userFormationsRole = user?.formationsRole as FormationsRole;

  // Don't show content if wrong role (while redirect happens)
  if (userRole !== "ADMIN" && userRole !== "admin" && userFormationsRole !== requiredRole) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[40px] text-[#006e2f] animate-spin">progress_activity</span>
          <p className="text-sm text-[#5c647a] mt-3">Redirection vers votre espace…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
