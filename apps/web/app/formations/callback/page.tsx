"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Callback page after OAuth login for formations.
 * Reads the selected role from URL params and updates the user's formationsRole,
 * then redirects to the appropriate dashboard.
 */
export default function FormationsCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const role = searchParams.get("role") || "apprenant";

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/formations/connexion");
      return;
    }

    // Update the formations role on the server
    async function updateRoleAndRedirect() {
      try {
        await fetch("/api/auth/update-formations-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formationsRole: role }),
        });
      } catch (err) {
        console.error("[CALLBACK] Error updating formations role:", err);
      }

      // Clean up localStorage and cookie
      if (typeof window !== "undefined") {
        localStorage.removeItem("pendingFormationsRole");
        document.cookie = "pendingFormationsRole=;path=/;max-age=0";
      }

      // Redirect based on role
      if (role === "instructeur") {
        router.push("/formations/instructeur/dashboard");
      } else {
        router.push("/formations/mes-formations");
      }
      router.refresh();
    }

    updateRoleAndRedirect();
  }, [session, status, role, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">
            progress_activity
          </span>
        </div>
        <p className="text-slate-500 text-sm">Configuration de votre espace...</p>
      </div>
    </div>
  );
}
