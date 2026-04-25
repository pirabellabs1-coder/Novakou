"use client";

/**
 * Stub — ImpersonationBanner.
 * Shows a banner when admin is impersonating a user.
 * Kept minimal for layout.tsx import.
 */

import { useAuthStore } from "@/store/auth";

export function ImpersonationBanner() {
  const impersonating = useAuthStore((s) => s.impersonatedUser);
  if (!impersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 text-center py-1.5 text-xs font-bold tracking-wider uppercase">
      Impersonation active : {impersonating.name ?? impersonating.email} &middot;{" "}
      <button
        onClick={() => useAuthStore.getState().stopImpersonation()}
        className="underline hover:no-underline"
      >
        Arrêter
      </button>
    </div>
  );
}
