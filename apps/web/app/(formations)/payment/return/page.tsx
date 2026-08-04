"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { PixelInjector } from "@/components/formations/PixelInjector";
import { trackEvents } from "@/lib/tracking/events";

type Status = "loading" | "success" | "failed" | "pending";

type VerifyResult = {
  enrollments?: Array<{ id: string; title: string; price: number }>;
  purchases?: Array<{ id: string; title: string; price: number }>;
  skipped?: string[];
  totalAmount?: number;
  subTotal?: number;
};

function ReturnInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("Vérification du paiement en cours…");
  const [redirectTo, setRedirectTo] = useState<string>("/apprenant/mes-formations");

  // Pixels marketing des vendeurs concernés + montant pour event Purchase
  const [purchasePixels, setPurchasePixels] = useState<Array<{ type: "FACEBOOK" | "GOOGLE" | "TIKTOK" | "SNAPCHAT" | "PINTEREST"; pixelId: string }>>([]);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0);

  useEffect(() => {
    async function run() {
      // Les séances de mentorat se confirment désormais par le même chemin que
      // tout le reste : paiement, puis réconciliation côté serveur. Cette page
      // n'a plus de branche dédiée — il n'y avait qu'elle pour la déclencher, et
      // elle dépendait d'une passerelle retirée.

      // Free order or mock — finalize directly
      if (params.get("free") === "1") {
        setStatus("success");
        setMessage("Commande gratuite confirmée");
        return;
      }


      // Flux réel : vérification par l'ID renvoyé en querystring.
      // Selon la passerelle : ?paymentId=..., ?reference=... ou ?id=...
      const paymentId =
        params.get("paymentId") ||
        params.get("reference") ||
        params.get("ref") ||
        params.get("id");
      // Sans passerelle indiquée, on tente la réconciliation par référence :
      // c'est elle qui retrouve la tentative et sa passerelle réelle. Le repli
      // pointait vers une intégration supprimée — toute vérification sans
      // paramètre échouait alors sans raison visible.
      const provider = params.get("provider") || "feexpay";
      if (!paymentId) {
        setStatus("failed");
        setMessage("Référence de paiement manquante");
        return;
      }

      try {
        // /verify fait maintenant TOUT : vérifie status provider + fulfill (crée
        // enrollments + crédite wallet + emails). Idempotent : si le webhook
        // a déjà fulfill, il skip les existants. Pas besoin d'auth car on trust
        // le provider comme source de vérité via retrievePayment.
        const verifyRes = await fetch(
          `/api/formations/payment/verify?id=${encodeURIComponent(paymentId)}&provider=${encodeURIComponent(provider)}`,
        );
        const verify = await verifyRes.json();

        if (!verify.data) {
          setStatus("failed");
          setMessage(verify.error ?? "Vérification échouée");
          return;
        }

        const paymentStatus = verify.data.status;
        const metaType = String(verify.data.metadata?.type ?? "");

        if (paymentStatus === "success") {
          // Lien de paiement INTÉGRÉ : le fulfillment (vente + webhook) a déjà été
          // fait par /verify côté serveur. On renvoie l'acheteur sur le site du
          // vendeur (au lieu de le garder sur Novakou), avec la référence.
          const paylinkRedirect = String(verify.data.metadata?.paylinkRedirectUrl ?? "");
          if (paylinkRedirect) {
            setStatus("success");
            setMessage("Paiement confirmé ! Redirection en cours…");
            const sep = paylinkRedirect.includes("?") ? "&" : "?";
            setTimeout(() => {
              window.location.href = `${paylinkRedirect}${sep}ref=${encodeURIComponent(paymentId)}&status=success`;
            }, 1200);
            return;
          }

          // Cas spécial — bundle ou abonnement : le webhook a déjà fulfill
          // (création de Subscription/ProductBundlePurchase + Enrollments).
          // /verify ne fait pas le travail pour ces types, donc on affiche
          // un message générique et on redirige vers la bonne destination.
          if (metaType === "bundle_purchase") {
            setStatus("success");
            setMessage("Achat de pack confirmé ! Vos contenus sont disponibles dans votre espace apprenant.");
            setRedirectTo("/apprenant/mes-formations");
            return;
          }
          if (metaType === "subscription_initial" || metaType === "subscription_renewal") {
            setStatus("success");
            setMessage("Abonnement confirmé ! Retrouvez vos accès dans Mes abonnements.");
            setRedirectTo("/apprenant/abonnements");
            return;
          }

          // Le verify a déjà fulfill (via fulfillCheckout)
          const result: VerifyResult = verify.data.result || {};
          const enrollmentsCount = result.enrollments?.length ?? 0;
          const purchasesCount = result.purchases?.length ?? 0;
          const skipped = result.skipped?.length ?? 0;
          setStatus("success");
          if (enrollmentsCount + purchasesCount > 0) {
            setMessage(`Achat confirmé : ${enrollmentsCount + purchasesCount} produit(s) ajouté(s) à votre espace apprenant.`);
          } else if (skipped > 0) {
            setMessage(`Paiement déjà confirmé — vos produits sont disponibles dans votre espace apprenant.`);
          } else {
            setMessage("Paiement confirmé !");
          }
          setRedirectTo(enrollmentsCount > 0 ? "/apprenant/mes-formations" : "/apprenant/mes-produits");

          // Fetch pixels + set amount pour event Purchase
          try {
            const formationIds = (result.enrollments ?? []).map((e) => e.id).filter(Boolean);
            const productIds = (result.purchases ?? []).map((p) => p.id).filter(Boolean);
            const total = Number(result.totalAmount ?? result.subTotal ?? verify.data.amount ?? 0);

            // Source de vérité Novakou — émis AVANT les pixels tiers (vote 4).
            trackEvents.purchase({
              orderId: paymentId,
              total,
              itemCount: formationIds.length + productIds.length,
              currency: "XOF",
              paymentMethod: provider,
              items: [
                ...formationIds.map((id) => ({ id, kind: "formation" as const })),
                ...productIds.map((id) => ({ id, kind: "product" as const })),
              ],
            });

            if (formationIds.length > 0 || productIds.length > 0) {
              const qs = new URLSearchParams();
              if (formationIds.length > 0) qs.set("formationIds", formationIds.join(","));
              if (productIds.length > 0) qs.set("productIds", productIds.join(","));
              const px = await fetch(`/api/formations/public/pixels?${qs.toString()}`).then((r) => r.json());
              setPurchasePixels(px.data ?? []);
            }
            setPurchaseAmount(total);
          } catch { /* pixels optionnels */ }
        } else if (paymentStatus === "pending" || paymentStatus === "initiated") {
          setStatus("pending");
          setMessage("Paiement en attente. Vous recevrez un email dès confirmation.");
        } else {
          setStatus("failed");
          setMessage(`Paiement ${paymentStatus}`);
        }
      } catch (err) {
        console.error("[payment/return]", err);
        setStatus("failed");
        setMessage("Erreur réseau lors de la vérification");
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
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Event Purchase : trigger les pixels des vendeurs avec montant */}
      {status === "success" && purchasePixels.length > 0 && (
        <PixelInjector
          pixels={purchasePixels}
          event={{
            name: "Purchase",
            value: purchaseAmount,
            currency: "XOF",
            // Même identifiant que l'API de Conversion serveur (sessionRef =
            // ref) → Meta/TikTok dédupliquent navigateur + serveur.
            eventId: params.get("ref") ?? undefined,
          }}
        />
      )}
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Loader2 size={36} className="text-zinc-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Vérification…</h1>
            <p className="text-zinc-500">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-[#006e2f]" />
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
              <ArrowRight size={18} />
            </Link>
          </>
        )}
        {status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <Clock size={48} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Paiement en attente</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Link href="/explorer" className="text-[#006e2f] font-semibold hover:underline">
              Retour à la marketplace
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={48} className="text-[#ba1a1a]" />
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Paiement échoué</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Link href="/explorer" className="inline-block px-6 py-3 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800">
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
