"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type PublicStats = {
  totalUsers: number;
  totalInstructors: number;
  totalLearners: number;
  totalFormations: number;
  totalProducts: number;
  totalProductsCount: number;
  totalSales: number;
  totalCountries: number;
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

const COMMISSION_PCT = 40;
const COOKIE_DAYS = 30;

const steps = [
  {
    icon: "share",
    step: "01",
    title: "Partagez votre lien",
    desc: "Copiez votre lien d'affiliation unique et partagez-le sur vos réseaux sociaux, blog, newsletter ou auprès de votre communauté.",
    color: "#006e2f",
    bg: "#e8f5e9",
  },
  {
    icon: "person_add",
    step: "02",
    title: "Quelqu'un s'inscrit",
    desc: `Un visiteur clique sur votre lien et s'inscrit sur Novakou Formations. Le cookie est valable ${COOKIE_DAYS} jours après son premier clic.`,
    color: "#1565c0",
    bg: "#e3f2fd",
  },
  {
    icon: "emoji_events",
    step: "03",
    title: `Vous gagnez ${COMMISSION_PCT}%`,
    desc: `Dès qu'un achat est réalisé par quelqu'un que vous avez référé, vous recevez automatiquement ${COMMISSION_PCT}% du montant HT de la vente.`,
    color: "#6a1b9a",
    bg: "#f3e5f5",
  },
];

const faqs = [
  {
    q: "Quand est-ce que je suis payé ?",
    a: "Les commissions sont versées le 1er de chaque mois pour toutes les ventes validées du mois précédent (après la période de remboursement de 30 jours).",
  },
  {
    q: "Quelles sont les méthodes de paiement ?",
    a: "Nous versons les commissions via Orange Money, Wave, MTN MoMo, virement bancaire SEPA et PayPal selon votre pays de résidence.",
  },
  {
    q: "Y a-t-il un montant minimum de retrait ?",
    a: "Oui, le minimum est de 10 000 FCFA (≈ 15 €). En dessous, votre solde est reporté au mois suivant.",
  },
  {
    q: "Puis-je être affilié et vendeur en même temps ?",
    a: "Absolument ! Les deux programmes sont indépendants. Vous pouvez vendre vos propres formations ET recommander celles d'autres vendeurs.",
  },
];

export default function AffiliationPage() {
  const [referrals, setReferrals] = useState(10);
  const [avgPrice, setAvgPrice] = useState(45000);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Real public stats
  const { data: statsResponse } = useQuery<{ data: PublicStats }>({
    queryKey: ["public-stats"],
    queryFn: () => fetch("/api/formations/public/stats").then((r) => r.json()),
    staleTime: 60_000,
  });
  const publicStats = statsResponse?.data;

  const estimatedFcfa = referrals * avgPrice * (COMMISSION_PCT / 100);
  const estimatedEur = Math.round((estimatedFcfa / 655.957) * 10) / 10;

  function copyLink() {
    navigator.clipboard.writeText("https://formations.freelancehigh.com/ref/MONCODE123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const stats = [
    {
      icon: "groups",
      label: "Affiliés actifs",
      value: publicStats ? (publicStats.totalUsers > 0 ? String(publicStats.totalUsers) : "Soyez le premier") : "…",
      color: "#006e2f",
      bg: "#e8f5e9",
    },
    {
      icon: "payments",
      label: "Commissions versées",
      value: publicStats && publicStats.totalSales > 0
        ? `${formatFCFA(publicStats.totalSales * 10000)} FCFA`
        : "Démarrage",
      sub: publicStats && publicStats.totalSales > 0 ? `${publicStats.totalSales} ventes` : "0 vente",
      color: "#1565c0",
      bg: "#e3f2fd",
    },
    { icon: "percent", label: "Commission", value: `${COMMISSION_PCT}%`, sub: "sur chaque vente", color: "#6a1b9a", bg: "#f3e5f5" },
    { icon: "timer", label: "Durée cookie", value: `${COOKIE_DAYS} jours`, sub: "par clic", color: "#e65100", bg: "#fff3e0" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#006e2f] via-[#005a26] to-[#003d1b] py-20 px-4">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%), radial-gradient(circle at 80% 50%, #86efac 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <span className="material-symbols-outlined text-[16px]">emoji_events</span>
            Programme d&apos;affiliation
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            Gagnez en recommandant
            <br />
            <span className="text-[#86efac]">Novakou Formations</span>
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Partagez votre lien unique. Touchez{" "}
            <span className="text-[#86efac] font-bold">{COMMISSION_PCT}% de commission</span> sur chaque vente générée. Payé chaque mois via Mobile Money.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/formations/inscription?role=affilie"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#006e2f] font-bold px-7 py-3.5 rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Démarrer maintenant — c&apos;est gratuit
            </Link>
            <a
              href="#comment-ca-marche"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">info</span>
              Comment ça marche ?
            </a>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-4 rounded-2xl bg-[#f7f9fb]">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.bg }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color: stat.color }}>
                  {stat.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#191c1e] text-sm leading-tight">{stat.value}</p>
                {stat.sub && <p className="text-xs text-[#5c647a]">{stat.sub}</p>}
                <p className="text-xs text-[#5c647a]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-16 px-4 bg-[#f7f9fb]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mb-3">
              Comment ça marche ?
            </h2>
            <p className="text-[#5c647a] text-base max-w-xl mx-auto">
              Commencez à gagner en 3 étapes simples.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.step} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 text-center relative">
                <div
                  className="absolute top-5 right-5 text-xs font-extrabold opacity-10 text-[40px] leading-none"
                  style={{ color: step.color }}
                >
                  {step.step}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: step.bg }}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ color: step.color }}>
                    {step.icon}
                  </span>
                </div>
                <h3 className="font-bold text-[#191c1e] text-base mb-2">{step.title}</h3>
                <p className="text-sm text-[#5c647a] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mb-3">
              Calculez vos gains potentiels
            </h2>
            <p className="text-[#5c647a] text-base">
              Ajustez les paramètres pour estimer vos revenus mensuels.
            </p>
          </div>

          <div className="bg-[#f7f9fb] rounded-3xl p-8 border border-gray-100">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-[#191c1e]">
                  Nombre de ventes générées / mois
                </label>
                <span className="text-sm font-bold text-[#006e2f] bg-green-50 px-3 py-1 rounded-full">
                  {referrals} ventes
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={referrals}
                onChange={(e) => setReferrals(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#006e2f" }}
              />
              <div className="flex justify-between text-xs text-[#5c647a] mt-1">
                <span>1</span>
                <span>100</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-[#191c1e]">
                  Prix moyen des produits vendus
                </label>
                <span className="text-sm font-bold text-[#006e2f] bg-green-50 px-3 py-1 rounded-full">
                  {avgPrice.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={200000}
                step={5000}
                value={avgPrice}
                onChange={(e) => setAvgPrice(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#006e2f" }}
              />
              <div className="flex justify-between text-xs text-[#5c647a] mt-1">
                <span>5 000 FCFA</span>
                <span>200 000 FCFA</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#006e2f] to-[#005a26] rounded-2xl p-6 text-center">
              <p className="text-white/70 text-sm mb-2">Vos gains estimés / mois</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                {Math.round(estimatedFcfa).toLocaleString("fr-FR")} FCFA
              </p>
              <p className="text-[#86efac] text-base font-semibold">≈ {estimatedEur} €</p>
              <p className="text-white/50 text-xs mt-3">
                {referrals} ventes × {avgPrice.toLocaleString("fr-FR")} FCFA × {COMMISSION_PCT}% de commission
              </p>
            </div>

            <p className="text-xs text-[#5c647a] text-center mt-4">
              * Estimation indicative. Les gains réels dépendent des achats validés après la période de remboursement.
            </p>
          </div>
        </div>
      </section>

      {/* Get your link CTA */}
      <section className="py-16 px-4 bg-[#f7f9fb]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-[#191c1e] mb-3">
            Prêt à commencer ?
          </h2>
          <p className="text-[#5c647a] text-base mb-8">
            Créez votre compte gratuitement et obtenez votre lien d&apos;affiliation unique en moins de 2 minutes.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 text-left">
            <p className="text-xs text-[#5c647a] font-medium mb-2">Votre lien d&apos;affiliation (exemple)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm tabular-nums text-[#191c1e] bg-[#f7f9fb] px-3 py-2 rounded-xl truncate">
                https://formations.freelancehigh.com/ref/MONCODE123
              </code>
              <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                  copied ? "bg-green-100 text-green-700" : "bg-[#006e2f] text-white hover:bg-[#005a26]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>

          <Link
            href="/formations/inscription?role=affilie"
            className="inline-flex items-center gap-2 bg-[#006e2f] text-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg hover:bg-[#005a26] hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
            Créer mon compte affilié
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[#191c1e] text-center mb-10">
            Questions fréquentes
          </h2>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#f7f9fb] rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-[#191c1e] text-sm">{faq.q}</span>
                  <span
                    className="material-symbols-outlined text-[20px] text-[#5c647a] flex-shrink-0 ml-4 transition-transform"
                    style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-[#5c647a] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
