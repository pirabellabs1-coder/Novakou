"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";

/**
 * Page d'attente d'un encaissement DIRECT (push Mobile Money).
 *
 * L'acheteur ne quitte pas Novakou : il reçoit la demande de confirmation sur
 * son téléphone, et cette page interroge le statut jusqu'à la réponse.
 *
 * Le statut vient du serveur, qui le demande lui-même au fournisseur — jamais
 * du navigateur : sinon n'importe qui pourrait se déclarer « payé ».
 */

const POLL_MS = 4000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 min : au-delà, l'opérateur a expiré

function AttenteInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ref = params.get("ref") ?? "";
  const provider = params.get("provider") ?? "";
  const pid = params.get("pid") ?? "";

  const [state, setState] = useState<"pending" | "success" | "failed" | "timeout">("pending");
  const [delivered, setDelivered] = useState(true);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!ref || !provider || !pid) { setState("failed"); return; }
    let stopped = false;

    async function poll() {
      if (stopped) return;
      if (Date.now() - startedAt.current > TIMEOUT_MS) { setState("timeout"); return; }
      try {
        const res = await fetch(
          `/api/formations/payment/collect-status?ref=${encodeURIComponent(ref)}` +
            `&provider=${encodeURIComponent(provider)}&pid=${encodeURIComponent(pid)}`,
        );
        const j = await res.json();
        const s = j?.data?.status;
        if (s === "success") {
          setDelivered(j?.data?.delivered !== false);
          setState("success");
          // Laisse le temps de lire la confirmation avant de basculer.
          setTimeout(() => router.push("/apprenant/mes-produits"), 2500);
          return;
        }
        if (s === "failed") { setState("failed"); return; }
      } catch {
        // Erreur réseau : on retente, le paiement peut être en cours.
      }
      setTimeout(poll, POLL_MS);
    }

    poll();
    return () => { stopped = true; };
  }, [ref, provider, pid, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb] px-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md w-full p-9 text-center">
        {state === "pending" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#f0faf3] flex items-center justify-center mx-auto">
              <Smartphone size={28} className="text-[#006e2f]" />
            </div>
            <h1 className="text-[21px] font-extrabold text-[#191c1e] mt-5">
              Confirmez sur votre téléphone
            </h1>
            <p className="text-[15px] text-[#5c647a] mt-2 leading-relaxed">
              Une demande de paiement vient d&apos;être envoyée sur votre numéro.
              Saisissez votre code pour valider — cette page se met à jour toute seule.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-[13px] font-semibold text-[#98a1b3]">
              <Loader2 size={15} className="animate-spin" />
              En attente de confirmation…
            </div>
            <p className="text-[11px] text-[#98a1b3] mt-6">
              Ne fermez pas cette page.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#f0faf3] flex items-center justify-center mx-auto">
              <CheckCircle2 size={30} className="text-[#006e2f]" />
            </div>
            <h1 className="text-[21px] font-extrabold text-[#191c1e] mt-5">Paiement confirmé</h1>
            <p className="text-[15px] text-[#5c647a] mt-2">
              {delivered
                ? "Merci ! Votre achat est disponible dans votre espace."
                : "Merci ! Votre paiement est bien reçu. La mise à disposition de votre achat est en cours — vous recevrez un e-mail dès qu'il sera prêt."}
            </p>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
              <XCircle size={30} className="text-rose-600" />
            </div>
            <h1 className="text-[21px] font-extrabold text-[#191c1e] mt-5">Paiement non abouti</h1>
            <p className="text-[15px] text-[#5c647a] mt-2">
              La demande a été refusée ou annulée. Aucun montant n&apos;a été débité.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-6 px-5 py-3 rounded-xl text-white text-[14px] font-extrabold"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              Réessayer
            </button>
          </>
        )}

        {state === "timeout" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
              <Loader2 size={28} className="text-amber-600" />
            </div>
            <h1 className="text-[21px] font-extrabold text-[#191c1e] mt-5">Toujours en attente</h1>
            <p className="text-[15px] text-[#5c647a] mt-2">
              Nous n&apos;avons pas reçu de confirmation. Si vous avez validé le paiement,
              il sera pris en compte automatiquement et vous recevrez un e-mail.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AttentePage() {
  return (
    <Suspense fallback={null}>
      <AttenteInner />
    </Suspense>
  );
}
