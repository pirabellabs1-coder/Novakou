"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const COMMISSION_PCT = 40;

const steps = [
  {
    num: "01", icon: "add_link",
    title: "Choisissez une formation",
    desc: "Parcourez le catalogue Novakou et sélectionnez les formations que vous souhaitez promouvoir. Chaque formation génère un lien unique traçable.",
  },
  {
    num: "02", icon: "share",
    title: "Partagez votre lien",
    desc: "Copiez votre lien affilié et partagez-le sur vos réseaux sociaux, WhatsApp, YouTube, blog ou par email. Chaque clic est tracé en temps réel.",
  },
  {
    num: "03", icon: "payments",
    title: `${COMMISSION_PCT}% crédité automatiquement`,
    desc: `Dès qu'un acheteur finalise une commande via votre lien, ${COMMISSION_PCT}% du prix est automatiquement crédité sur votre solde affilié. Zéro démarche manuelle.`,
  },
];

const faqs = [
  {
    q: "Combien puis-je gagner ?",
    a: `${COMMISSION_PCT}% du prix de chaque formation ou produit vendu via votre lien. Pour une formation à 45 000 FCFA, vous gagnez 18 000 FCFA par vente.`,
  },
  {
    q: "Quand est-ce que je suis payé ?",
    a: "Les commissions confirmées (après 14 jours de délai de rétractation) sont versées le dernier jour ouvré de chaque mois via Mobile Money ou virement.",
  },
  {
    q: "Y a-t-il un engagement ou un abonnement ?",
    a: "Non. Le programme d'affiliation est entièrement gratuit et sans engagement. Vous pouvez arrêter à tout moment.",
  },
  {
    q: "Comment le prélèvement fonctionne-t-il ?",
    a: `Lorsqu'un acheteur clique sur votre lien affilié et finalise un achat, la plateforme détecte automatiquement votre contribution. ${COMMISSION_PCT}% du montant est immédiatement prélevé sur la vente et crédité sur votre solde affilié.`,
  },
  {
    q: "Puis-je promouvoir toutes les formations ?",
    a: "Oui, toutes les formations et produits publiés sur Novakou sont éligibles à l'affiliation.",
  },
];

export default function DevenirAffilierPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Check if already affiliate
  const { data: affiliateData, isLoading: checkLoading } = useQuery({
    queryKey: ["affiliate-status"],
    queryFn: () => fetch("/api/formations/apprenant/affiliate").then((r) => r.json()),
    staleTime: 60_000,
  });

  const isAlreadyAffiliate = affiliateData?.isAffiliate === true;
  const affiliateCode = affiliateData?.profile?.affiliateCode;

  const joinMutation = useMutation({
    mutationFn: () =>
      fetch("/api/formations/apprenant/affiliate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
        .then(async (r) => {
          const json = await r.json();
          if (!r.ok) throw new Error(json.error ?? "Erreur serveur");
          return json;
        }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-status"] });
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const joined = isAlreadyAffiliate || joinMutation.isSuccess;
  const userName = session?.user?.name ?? "Apprenant";

  if (checkLoading) {
    return (
      <div className="p-5 md:p-8 max-w-3xl mx-auto flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#006e2f] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#5c647a]">Vérification de votre statut…</p>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="p-5 md:p-8 max-w-lg mx-auto text-center mt-12">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="material-symbols-outlined text-[36px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#191c1e] mb-3">Bienvenue dans le programme !</h1>
        <p className="text-sm text-[#5c647a] mb-6 leading-relaxed">
          Bonjour {userName}, votre espace affilié est prêt. Commencez par ajouter des formations à promouvoir et générez vos premiers liens.
        </p>
        <div className="bg-[#006e2f]/5 border border-[#006e2f]/20 rounded-2xl p-5 mb-6 text-left">
          <p className="text-xs font-bold text-[#006e2f] mb-3 uppercase tracking-wide">Votre programme en bref</p>
          {[
            { icon: "percent",              label: "Commission sur chaque vente",    value: `${COMMISSION_PCT}%` },
            { icon: "calendar_today",       label: "Versements",                     value: "Mensuel" },
            { icon: "link",                 label: "Formations disponibles",          value: "Toutes" },
            { icon: "account_balance_wallet", label: "Retrait min.",                 value: "5 000 FCFA" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#006e2f]/10 last:border-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-[#006e2f]">{row.icon}</span>
                <span className="text-xs text-[#5c647a]">{row.label}</span>
              </div>
              <span className="text-xs font-bold text-[#191c1e]">{row.value}</span>
            </div>
          ))}
        </div>
        {affiliateCode && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-6">
            <p className="text-[10px] text-[#5c647a] mb-1">Votre code affilié</p>
            <p className="font-mono font-bold text-[#006e2f] text-lg">{affiliateCode}</p>
          </div>
        )}
        <Link href="/formations/affilie/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          Accéder à mon espace affilié
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#006e2f] to-[#14532d] rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full bg-white/20 text-white mb-4">
            <span className="material-symbols-outlined text-[12px]">star</span>
            Programme d&apos;affiliation Novakou
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">
            Gagnez {COMMISSION_PCT}% sur chaque<br />vente réalisée via vos liens
          </h1>
          <p className="text-sm text-white/80 mb-6 max-w-md leading-relaxed">
            Partagez les formations Novakou. Quand quelqu&apos;un achète via votre lien,
            <strong className="text-white"> {COMMISSION_PCT}% du prix est automatiquement crédité</strong> sur votre solde — sans démarche manuelle.
          </p>
          <div className="flex items-center gap-6 text-white/80 text-xs">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">check_circle</span>Gratuit</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">check_circle</span>Sans engagement</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">check_circle</span>Paiement mensuel</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { value: `${COMMISSION_PCT}%`, label: "Commission fixe par vente" },
          { value: "17 pays",            label: "Marchés accessibles" },
          { value: "5 000+",             label: "Formations disponibles" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold text-[#006e2f] mb-1">{s.value}</p>
            <p className="text-[10px] text-[#5c647a]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mb-8">
        <h2 className="text-lg font-extrabold text-[#191c1e] mb-1">Comment ça fonctionne</h2>
        <p className="text-sm text-[#5c647a] mb-5">3 étapes simples pour commencer à gagner</p>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.num} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold text-[#006e2f]">{step.num}</span>
                  <h3 className="text-sm font-bold text-[#191c1e]">{step.title}</h3>
                </div>
                <p className="text-xs text-[#5c647a] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission explanation */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[22px] text-amber-600 flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Comment le prélèvement automatique fonctionne</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Lorsqu&apos;un acheteur clique sur votre lien affilié et finalise un achat, la plateforme identifie automatiquement votre contribution.
              <strong> {COMMISSION_PCT}% du montant est immédiatement prélevé sur la vente et crédité sur votre solde affilié.</strong>{" "}
              Le vendeur reçoit les {100 - COMMISSION_PCT}% restants. Vous n&apos;avez rien à faire — tout est automatique.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">Questions fréquentes</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-sm font-semibold text-[#191c1e]">{faq.q}</span>
                <span className={`material-symbols-outlined text-[20px] text-[#5c647a] transition-transform ${openFaq === i ? "rotate-180" : ""}`}>expand_more</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-[#5c647a] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Registration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Rejoindre le programme</h2>
        <p className="text-xs text-[#5c647a] mb-5">Gratuit · Immédiat · Aucun engagement</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <div onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              agreed ? "bg-[#006e2f] border-[#006e2f]" : "border-gray-300 group-hover:border-[#006e2f]"
            }`}>
            {agreed && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
          </div>
          <span className="text-xs text-[#5c647a] leading-relaxed">
            J&apos;accepte les{" "}
            <Link href="/formations/cgu-affiliation" className="text-[#006e2f] hover:underline font-semibold">
              conditions du programme d&apos;affiliation
            </Link>{" "}
            et je comprends que {COMMISSION_PCT}% de chaque vente via mes liens sera automatiquement crédité sur mon solde affilié.
          </span>
        </label>

        <button
          onClick={() => agreed && !joinMutation.isPending && joinMutation.mutate()}
          disabled={!agreed || joinMutation.isPending}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all ${
            agreed && !joinMutation.isPending ? "hover:opacity-90 cursor-pointer" : "opacity-40 cursor-not-allowed"
          }`}
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
          {joinMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Inscription en cours…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">link</span>
              Devenir affilié Novakou
            </>
          )}
        </button>
      </div>
    </div>
  );
}
