// Refonte style KAZA — apprenant affiliation — 2026-06-07
"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KazaHero,
  KazaButton,
  KazaBadge,
  KazaCard,
  KazaSection,
} from "@/components/kaza";
import {
  Link2,
  Share2,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Percent,
  Calendar,
  ChevronDown,
  Info,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

const COMMISSION_PCT = 40;

const steps = [
  {
    num: "01",
    icon: Link2,
    title: "Choisissez une formation",
    desc: "Parcourez le catalogue Novakou et sélectionnez les formations à promouvoir. Chaque formation génère un lien unique traçable.",
  },
  {
    num: "02",
    icon: Share2,
    title: "Partagez votre lien",
    desc: "Copiez votre lien affilié et partagez-le sur vos réseaux sociaux, WhatsApp, YouTube, blog ou par email. Chaque clic est tracé en temps réel.",
  },
  {
    num: "03",
    icon: Wallet,
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: affiliateData, isLoading: checkLoading } = useQuery({
    queryKey: ["affiliate-status"],
    queryFn: () => fetch("/api/formations/apprenant/affiliate").then((r) => r.json()),
    staleTime: 60_000,
  });

  const isAlreadyAffiliate = affiliateData?.isAffiliate === true;
  const affiliateCode = affiliateData?.profile?.affiliateCode;

  const joinMutation = useMutation({
    mutationFn: () =>
      fetch("/api/formations/apprenant/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(async (r) => {
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
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Vérification de votre statut…</p>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
        <KazaHero
          badge="Affilié"
          badgeColor="green"
          icon={BadgeCheck}
          title="Bienvenue dans le programme !"
          subtitle={`Bonjour ${userName}, votre espace affilié est prêt. Commencez par ajouter des formations à promouvoir.`}
          actions={
            <KazaButton variant="primary" href="/affilie/dashboard" iconRight={ArrowRight}>
              Mon espace affilié
            </KazaButton>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <KazaCard title="Votre programme en bref">
            <div className="space-y-3">
              {[
                { icon: Percent, label: "Commission sur chaque vente", value: `${COMMISSION_PCT}%` },
                { icon: Calendar, label: "Versements", value: "Mensuel" },
                { icon: Link2, label: "Formations disponibles", value: "Toutes" },
                { icon: Wallet, label: "Retrait min.", value: "5 000 FCFA" },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs text-slate-600">{row.label}</span>
                    </div>
                    <span className="text-xs font-bold text-[#0b2540]">{row.value}</span>
                  </div>
                );
              })}
            </div>
          </KazaCard>

          {affiliateCode && (
            <KazaCard title="Votre code affilié" variant="highlighted">
              <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">{affiliateCode}</p>
              <p className="text-xs text-slate-500 mt-2">
                Partagez ce code ou utilisez votre lien personnel pour tracker vos ventes.
              </p>
            </KazaCard>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Sparkles}
        title={`Gagnez ${COMMISSION_PCT}% sur chaque vente`}
        subtitle="Partagez les formations Novakou. Commission créditée automatiquement, sans démarche manuelle."
      >
        <div className="flex flex-wrap items-center gap-4 text-white/90 text-xs">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Gratuit</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Sans engagement</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Paiement mensuel</span>
        </div>
      </KazaHero>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { value: `${COMMISSION_PCT}%`, label: "Commission fixe par vente" },
          { value: "17 pays", label: "Marchés accessibles" },
          { value: "5 000+", label: "Formations disponibles" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-3xl font-extrabold text-emerald-600 mb-1">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Steps */}
      <KazaSection label="Tutoriel" title="Comment ça fonctionne" description="3 étapes simples pour commencer à gagner">
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <KazaCard key={step.num}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold text-emerald-600">{step.num}</span>
                      <h3 className="text-sm font-bold text-[#0b2540]">{step.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </KazaCard>
            );
          })}
        </div>
      </KazaSection>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Comment le prélèvement automatique fonctionne</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Lorsqu&apos;un acheteur clique sur votre lien affilié et finalise un achat, la plateforme identifie automatiquement votre contribution.
              <strong> {COMMISSION_PCT}% du montant est immédiatement prélevé sur la vente et crédité sur votre solde affilié.</strong>{" "}
              Le vendeur reçoit les {100 - COMMISSION_PCT}% restants. Vous n&apos;avez rien à faire.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <KazaSection label="FAQ" title="Questions fréquentes">
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm font-semibold text-[#0b2540]">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </KazaSection>

      {/* Registration */}
      <KazaCard title="Rejoindre le programme" subtitle="Gratuit · Immédiat · Aucun engagement" variant="highlighted">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
            <p className="text-xs text-rose-700 font-semibold">{error}</p>
          </div>
        )}

        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              agreed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover:border-emerald-500"
            }`}
          >
            {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className="text-xs text-slate-600 leading-relaxed">
            J&apos;accepte les{" "}
            <Link href="/cgu-affiliation" className="text-emerald-600 hover:underline font-semibold">
              conditions du programme d&apos;affiliation
            </Link>{" "}
            et je comprends que {COMMISSION_PCT}% de chaque vente via mes liens sera automatiquement crédité sur mon solde affilié.
          </span>
        </label>

        <KazaButton
          variant="primary"
          size="lg"
          onClick={() => agreed && !joinMutation.isPending && joinMutation.mutate()}
          disabled={!agreed || joinMutation.isPending}
          icon={Link2}
          className="w-full"
        >
          {joinMutation.isPending ? "Inscription en cours…" : "Devenir affilié Novakou"}
        </KazaButton>
      </KazaCard>
    </div>
  );
}
