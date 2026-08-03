"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { PixelInjector, type Pixel } from "@/components/formations/PixelInjector";
import { trackEvents } from "@/lib/tracking/events";

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

  // ÉVÉNEMENT D'ACHAT. Cette page redirigeait directement vers l'espace
  // apprenant, sans passer par la page de retour qui déclenche les pixels :
  // aucune vente Mobile Money — donc la majorité — n'était remontée à
  // Facebook, TikTok ou Google. Un vendeur payait sa publicité sans jamais
  // pouvoir mesurer ce qu'elle rapportait.
  const [achatPixels, setAchatPixels] = useState<Pixel[]>([]);
  const [achatMontant, setAchatMontant] = useState(0);

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

          const montant = Number(j?.data?.amount ?? 0);
          const formationIds: string[] = j?.data?.formationIds ?? [];
          const productIds: string[] = j?.data?.productIds ?? [];

          // Source de vérité Novakou d'abord, pixels tiers ensuite.
          if (montant > 0) {
            trackEvents.purchase({
              orderId: ref,
              total: montant,
              itemCount: formationIds.length + productIds.length,
              currency: "XOF",
              paymentMethod: provider,
              items: [
                ...formationIds.map((id) => ({ id, kind: "formation" as const })),
                ...productIds.map((id) => ({ id, kind: "product" as const })),
              ],
            });
            setAchatMontant(montant);
          }

          // Pixels des vendeurs concernés.
          if (formationIds.length > 0 || productIds.length > 0) {
            const qs = new URLSearchParams();
            if (formationIds.length) qs.set("formationIds", formationIds.join(","));
            if (productIds.length) qs.set("productIds", productIds.join(","));
            try {
              const px = await fetch(`/api/formations/public/pixels?${qs.toString()}`).then((r) => r.json());
              setAchatPixels(px.data ?? []);
            } catch { /* les pixels ne doivent jamais bloquer une livraison */ }
          }

          // Assez de temps pour que les pixels partent avant la navigation.
          // 2,5 s suffisaient à lire la confirmation, pas forcément à laisser
          // aboutir des requêtes vers trois régies sur un réseau lent.
          setTimeout(() => router.push("/apprenant/mes-produits"), 4000);
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
      {/* `eventId` = notre référence interne : Meta et TikTok dédupliquent
          ainsi si l'acheteur repasse par la page de retour. */}
      {state === "success" && achatPixels.length > 0 && (
        <PixelInjector
          pixels={achatPixels}
          event={{ name: "Purchase", value: achatMontant, currency: "XOF", eventId: ref || undefined }}
        />
      )}
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
