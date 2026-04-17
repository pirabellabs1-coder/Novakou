"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "success" | "failed" | "pending";

function ReturnInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("Vérification du paiement en cours…");
  const [redirectTo, setRedirectTo] = useState<string>("/formations/apprenant/mes-formations");

  useEffect(() => {
    async function run() {
      // ── Mentor booking payment finalization (mock or real) ──────────────
      const bookingId = params.get("bookingId");
      if (bookingId) {
        try {
          const res = await fetch(`/api/formations/mentor-bookings/${bookingId}/confirm-payment`, { method: "POST" });
          const json = await res.json();
          if (json.data) {
            setStatus("success");
            setMessage("Séance payée — en attente de confirmation du mentor. Les fonds sont bloqués en escrow.");
            setRedirectTo("/formations/apprenant/sessions");
          } else {
            setStatus("failed");
            setMessage(json.error ?? "Échec de la confirmation du paiement");
          }
        } catch {
          setStatus("failed");
          setMessage("Erreur réseau lors de la confirmation");
        }
        return;
      }

      // Free order or mock — finalize directly
      if (params.get("free") === "1") {
        setStatus("success");
        setMessage("Commande gratuite confirmée");
        return;
      }

      if (params.get("mock") === "1") {
        // Dev mode — simulate completed payment by calling checkout API
        const fids = params.get("fids")?.split(",").filter(Boolean) ?? [];
        const pids = params.get("pids")?.split(",").filter(Boolean) ?? [];
        const code = params.get("code") || undefined;
        try {
          const res = await fetch("/api/formations/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              formationIds: fids,
              productIds: pids,
              discountCode: code,
              paymentMethod: "mock",
              clearCart: true,
            }),
          });
          const json = await res.json();
          if (json.data?.success) {
            setStatus("success");
            setMessage(`Achat confirmé : ${[...json.data.enrollments, ...json.data.purchases].length} produit(s)`);
            setRedirectTo(json.data.enrollments?.length > 0
              ? "/formations/apprenant/mes-formations"
              : "/formations/apprenant/produits");
          } else {
            setStatus("failed");
            setMessage(json.error ?? "Échec de la commande");
          }
        } catch {
          setStatus("failed");
          setMessage("Erreur réseau");
        }
        return;
      }

      // Real Moneroo flow: verify by ID returned in querystring
      const monerooId = params.get("paymentId") || params.get("id");
      if (!monerooId) {
        setStatus("failed");
        setMessage("Référence de paiement manquante");
        return;
      }

      try {
        const verify = await fetch(`/api/formations/payment/verify?id=${monerooId}`).then((r) => r.json());
        if (!verify.data) {
          setStatus("failed");
          setMessage(verify.error ?? "Vérification échouée");
          return;
        }
        if (verify.data.status === "success") {
          // Finalize via checkout API using metadata
          const meta = verify.data.metadata || {};
          const fids: string[] = (meta.formationIds || "").split(",").filter(Boolean);
          const pids: string[] = (meta.productIds || "").split(",").filter(Boolean);
          const code = meta.discountCode || undefined;
          const res = await fetch("/api/formations/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formationIds: fids, productIds: pids, discountCode: code, paymentMethod: "moneroo" }),
          });
          const json = await res.json();
          if (json.data?.success) {
            setStatus("success");
            setMessage(`Achat confirmé : ${[...json.data.enrollments, ...json.data.purchases].length} produit(s)`);
            setRedirectTo(json.data.enrollments?.length > 0
              ? "/formations/apprenant/mes-formations"
              : "/formations/apprenant/produits");
          } else {
            setStatus("failed");
            setMessage(json.error ?? "Erreur lors de la finalisation");
          }
        } else if (verify.data.status === "pending" || verify.data.status === "initiated") {
          setStatus("pending");
          setMessage("Paiement en attente. Vous recevrez un email dès confirmation.");
        } else {
          setStatus("failed");
          setMessage(`Paiement ${verify.data.status}`);
        }
      } catch {
        setStatus("failed");
        setMessage("Erreur lors de la vérification");
      }
    }
    run();
  }, [params]);

  // Auto-redirect on success after 3 seconds
  useEffect(() => {
    if (status === "success") {
      const t = setTimeout(() => router.push(redirectTo), 3000);
      return () => clearTimeout(t);
    }
  }, [status, redirectTo, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="material-symbols-outlined text-[36px] text-zinc-400 animate-spin">progress_activity</span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Vérification…</h1>
            <p className="text-zinc-500">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#006e2f] text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Paiement réussi !</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <p className="text-xs text-zinc-400 mb-6 tabular-nums">Redirection automatique dans 3 sec…</p>
            <Link
              href={redirectTo}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              Accéder à mes contenus
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </>
        )}
        {status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-amber-500 text-[48px]">schedule</span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Paiement en attente</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Link href="/formations/explorer" className="text-[#006e2f] font-semibold hover:underline">
              Retour à la marketplace
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[48px]">error</span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Paiement échoué</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Link href="/formations/explorer" className="inline-block px-6 py-3 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800">
              Réessayer
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ReturnInner />
    </Suspense>
  );
}
