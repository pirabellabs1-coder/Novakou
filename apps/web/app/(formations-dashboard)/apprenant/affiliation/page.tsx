// Refonte design "Stitch" — apprenant affiliation — vert Novakou — 2026-06-13
"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StCard,
  StPageHeader,
  StButton,
  StSectionTitle,
  ST,
} from "@/components/stitch";
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
      <div className="min-h-screen flex items-center justify-center py-24" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: ST.green, borderTopColor: "transparent" }} />
          <p className="text-sm font-semibold" style={{ color: ST.textSecondary }}>Vérification de votre statut…</p>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
          <StPageHeader
            title="Bienvenue dans le programme !"
            subtitle={`Bonjour ${userName}, votre espace affilié est prêt. Commencez par ajouter des formations à promouvoir.`}
            actions={
              <StButton href="/affilie/dashboard" iconRight={ArrowRight} icon={BadgeCheck}>
                Mon espace affilié
              </StButton>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <StCard>
              <StSectionTitle>Votre programme en bref</StSectionTitle>
              <div className="space-y-1">
                {[
                  { icon: Percent, label: "Commission sur chaque vente", value: `${COMMISSION_PCT}%` },
                  { icon: Calendar, label: "Versements", value: "Mensuel" },
                  { icon: Link2, label: "Formations disponibles", value: "Toutes" },
                  { icon: Wallet, label: "Retrait min.", value: "5 000 FCFA" },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${ST.divider}` }}>
                      <div className="flex items-center gap-2">
                        <Icon size={16} style={{ color: ST.green }} />
                        <span className="text-[12.5px] font-semibold" style={{ color: ST.textSecondary }}>{row.label}</span>
                      </div>
                      <span className="text-[12.5px] font-extrabold" style={{ color: ST.text }}>{row.value}</span>
                    </div>
                  );
                })}
              </div>
            </StCard>

            {affiliateCode && (
              <StCard style={{ border: `1.5px solid ${ST.greenBright}`, background: "#f0faf3" }}>
                <StSectionTitle>Votre code affilié</StSectionTitle>
                <p className="text-[30px] font-extrabold tabular-nums" style={{ color: ST.green }}>{affiliateCode}</p>
                <p className="text-[12px] font-semibold mt-2" style={{ color: ST.textSecondary }}>
                  Partagez ce code ou utilisez votre lien personnel pour tracker vos ventes.
                </p>
              </StCard>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title={`Gagnez ${COMMISSION_PCT}% sur chaque vente`}
          subtitle="Partagez les formations Novakou. Commission créditée automatiquement, sans démarche manuelle."
        />

        <div className="flex flex-wrap items-center gap-4 mb-5 text-[12px] font-bold" style={{ color: ST.textSecondary }}>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: ST.green }} />Gratuit</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: ST.green }} />Sans engagement</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: ST.green }} />Paiement mensuel</span>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          {[
            { value: `${COMMISSION_PCT}%`, label: "Commission fixe par vente" },
            { value: "17 pays", label: "Marchés accessibles" },
            { value: "5 000+", label: "Formations disponibles" },
          ].map((s, i) => (
            <StCard key={i} className="text-center">
              <p className="text-[28px] font-extrabold mb-1 tabular-nums" style={{ color: ST.green }}>{s.value}</p>
              <p className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>{s.label}</p>
            </StCard>
          ))}
        </section>

        {/* Steps */}
        <section className="mb-6">
          <StSectionTitle>Comment ça fonctionne</StSectionTitle>
          <p className="text-[12.5px] font-semibold mb-4 -mt-2" style={{ color: ST.textSecondary }}>3 étapes simples pour commencer à gagner</p>
          <div className="space-y-3.5">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <StCard key={step.num}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-[13px] flex items-center justify-center flex-shrink-0" style={{ background: ST.greenSoft }}>
                      <Icon size={24} style={{ color: ST.green }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold" style={{ color: ST.green }}>{step.num}</span>
                        <h3 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>{step.title}</h3>
                      </div>
                      <p className="text-[12px] font-semibold leading-relaxed" style={{ color: ST.textSecondary }}>{step.desc}</p>
                    </div>
                  </div>
                </StCard>
              );
            })}
          </div>
        </section>

        {/* Info */}
        <div className="rounded-[18px] p-5 mb-6" style={{ border: "1px solid #f3e2bd", background: "#fdf8ec" }}>
          <div className="flex items-start gap-3">
            <Info size={20} style={{ color: ST.amberText }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13.5px] font-extrabold mb-1" style={{ color: "#633806" }}>Comment le prélèvement automatique fonctionne</p>
              <p className="text-[12px] font-semibold leading-relaxed" style={{ color: ST.amberText }}>
                Lorsqu&apos;un acheteur clique sur votre lien affilié et finalise un achat, la plateforme identifie automatiquement votre contribution.
                <strong> {COMMISSION_PCT}% du montant est immédiatement prélevé sur la vente et crédité sur votre solde affilié.</strong>{" "}
                Le vendeur reçoit les {100 - COMMISSION_PCT}% restants. Vous n&apos;avez rien à faire.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="mb-6">
          <StSectionTitle>Questions fréquentes</StSectionTitle>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <StCard key={i} noPadding className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#f7faf8]"
                >
                  <span className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    style={{ color: ST.textMuted }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[12.5px] font-semibold leading-relaxed" style={{ color: ST.textSecondary }}>{faq.a}</p>
                  </div>
                )}
              </StCard>
            ))}
          </div>
        </section>

        {/* Registration */}
        <StCard style={{ border: `1.5px solid ${ST.greenBright}`, background: "#f0faf3" }} className="max-w-2xl">
          <StSectionTitle>Rejoindre le programme</StSectionTitle>
          <p className="text-[12px] font-semibold mb-4 -mt-2" style={{ color: ST.textSecondary }}>Gratuit · Immédiat · Aucun engagement</p>
          {error && (
            <div className="rounded-[12px] p-3 mb-4" style={{ background: ST.roseSoft, border: `1px solid ${ST.roseText}33` }}>
              <p className="text-[12px] font-bold" style={{ color: ST.roseText }}>{error}</p>
            </div>
          )}

          <label className="flex items-start gap-3 mb-6 cursor-pointer group">
            <div
              onClick={() => setAgreed(!agreed)}
              className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={agreed ? { background: ST.greenBright, borderColor: ST.greenBright } : { borderColor: "#cbd5cf" }}
            >
              {agreed && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <span className="text-[12px] font-semibold leading-relaxed" style={{ color: ST.textSecondary }}>
              J&apos;accepte les{" "}
              <Link href="/cgu-affiliation" className="font-extrabold hover:underline" style={{ color: ST.green }}>
                conditions du programme d&apos;affiliation
              </Link>{" "}
              et je comprends que {COMMISSION_PCT}% de chaque vente via mes liens sera automatiquement crédité sur mon solde affilié.
            </span>
          </label>

          <StButton
            size="lg"
            onClick={() => agreed && !joinMutation.isPending && joinMutation.mutate()}
            disabled={!agreed || joinMutation.isPending}
            icon={joinMutation.isPending ? Sparkles : Link2}
            className="w-full"
          >
            {joinMutation.isPending ? "Inscription en cours…" : "Devenir affilié Novakou"}
          </StButton>
        </StCard>
      </main>
    </div>
  );
}
