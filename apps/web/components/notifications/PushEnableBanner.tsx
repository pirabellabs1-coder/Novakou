"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { pushPermission, subscribeToPush } from "@/lib/push/client";

/**
 * Petite bannière « Activer les notifications » (v2 Phase 4), affichée dans le
 * menu de la cloche UNIQUEMENT si le navigateur supporte le push et que
 * l'utilisateur n'a pas encore décidé (permission = "default"). Un clic
 * demande la permission et abonne l'appareil. Disparaît une fois accordé/refusé.
 */
export function PushEnableBanner() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPerm(pushPermission());
  }, []);

  if (perm !== "default") return null;

  async function enable() {
    setBusy(true);
    const ok = await subscribeToPush();
    setBusy(false);
    setPerm(ok ? "granted" : pushPermission());
  }

  return (
    <button
      onClick={enable}
      disabled={busy}
      className="flex w-full items-center gap-2.5 border-b border-zinc-100 bg-[#006e2f]/[0.04] px-4 py-2.5 text-left hover:bg-[#006e2f]/[0.08] transition-colors"
    >
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-zinc-900">Activer les notifications</span>
        <span className="block text-[10px] text-zinc-500">Sois prévenu même quand l'app est fermée.</span>
      </span>
    </button>
  );
}
