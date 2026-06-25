"use client";

import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Globe,
  Info,
  MessageCircle,
  Percent,
  Rocket,
  Share2,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
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
    icon: Share2,
    step: "01",
    title: "Partagez votre lien",
    desc: "Copiez votre lien d'affiliation unique et partagez-le sur vos réseaux sociaux, blog, newsletter ou auprès de votre communauté.",
    color: "#006e2f",
    bg: "#e8f5e9",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "Quelqu'un s'inscrit",
    desc: `Un visiteur clique sur votre lien et s'inscrit sur Novakou Formations. Le cookie est valable ${COOKIE_DAYS} jours après son premier clic.`,
    color: "#1565c0",
    bg: "#e3f2fd",
  },
  {
    icon: Trophy,
    step: "03",
    title: `Vous gagnez ${COMMISSION_PCT}%`,
    desc: `Dès qu'un achat est réalisé par quelqu'un que vous avez référé, vous recevez automatiquement ${COMMISSION_PCT}% du montant HT de la vente.`,
    color: "#6a1b9a",
    bg: "#f3e5f5",
  },
];

const faqs = [
  {
    q: "Comment et quand suis-je payé ?",
    a: "Chaque commission est d'abord « en validation » pendant 14 jours (le temps de la période de remboursement de l'acheteur). Passé ce délai, elle devient « validée » et apparaît dans votre solde retirable. Vous pouvez alors demander un retrait à tout moment depuis votre espace affilié → Retraits.",
  },
  {
    q: "Quelles sont les méthodes de paiement ?",
    a: "Vous recevez vos commissions via Orange Money, Wave, MTN MoMo ou virement bancaire (SEPA), selon votre pays.",
  },
  {
    q: "Y a-t-il un montant minimum de retrait ?",
    a: "Oui, le minimum est de 5 000 FCFA (≈ 8 €) par retrait. En dessous, votre solde validé reste disponible et continue de s'accumuler.",
  },
  {
    q: "Que se passe-t-il si l'acheteur se fait rembourser ?",
    a: "Si une vente que vous avez référée est remboursée pendant les 14 jours de validation, la commission correspondante est annulée. C'est pourquoi nous attendons la fin de cette période avant de rendre vos gains retirables — pour que votre solde validé soit 100 % sûr.",
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

  function copyLink() {
    navigator.clipboard.writeText("https://novakou.com/ref/MONCODE123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const stats = [
    {
      icon: Users,
      label: "Affiliés actifs",
      value: publicStats ? (publicStats.totalUsers > 0 ? String(publicStats.totalUsers) : "Soyez le premier") : "…",
      color: "#006e2f",
      bg: "#e8f5e9",
    },
    {
      icon: Wallet,
      label: "Commissions versées",
      value: publicStats && publicStats.totalSales > 0
        ? `${formatFCFA(publicStats.totalSales * 10000)} FCFA`
        : "Démarrage",
      sub: publicStats && publicStats.totalSales > 0 ? `${publicStats.totalSales} ventes` : "0 vente",
      color: "#1565c0",
      bg: "#e3f2fd",
    },
    { icon: Percent, label: "Commission", value: `${COMMISSION_PCT}%`, sub: "sur chaque vente", color: "#6a1b9a", bg: "#f3e5f5" },
    { icon: Timer, label: "Durée cookie", value: `${COOKIE_DAYS} jours`, sub: "par clic", color: "#e65100", bg: "#fff3e0" },
  ];

  return (
    <>
      {/* ─────────────────────────── HERO ─────────────────────────── */}
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
            <Trophy size={16} />
            Programme d&apos;affiliation
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            Gagnez de l&apos;argent en recommandant
            <br />
            <span className="text-[#86efac]">les produits Novakou</span>
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Partagez votre lien unique. Touchez{" "}
            <span className="text-[#86efac] font-bold">{COMMISSION_PCT}% de commission</span> sur chaque vente générée. Sans rien créer, payé via Mobile Money.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/inscription?role=affilie"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#006e2f] font-bold px-7 py-3.5 rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Rocket size={18} />
              Démarrer maintenant — c&apos;est gratuit
            </Link>
            <a
              href="#concept"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-all"
            >
              <Info size={18} />
              Comment ça marche ?
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────── STATS BANNER ─────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-4 rounded-2xl bg-[#f7f9fb]">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.bg }}
              >
                {(() => { const _I = stat.icon; return _I ? <_I size={20} /> : null; })()}
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

      {/* ══════════ SECTION 1 — Le concept (2 colonnes) ══════════ */}
      <section id="concept" className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">Le principe</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-5 leading-tight">
              Le revenu en ligne le plus simple à démarrer
            </h2>
            <div className="space-y-4 text-[15px] text-[#5c647a] leading-relaxed">
              <p>
                L&apos;affiliation, c&apos;est recommander un produit qui existe déjà et toucher une commission à chaque fois que quelqu&apos;un l&apos;achète grâce à vous. Chez Novakou, c&apos;est le moyen le plus accessible de générer un premier revenu sur internet&nbsp;: vous n&apos;avez <strong className="text-[#191c1e]">rien à créer, rien à stocker et rien à avancer</strong>.
              </p>
              <p>
                Concrètement, vous recevez un <strong className="text-[#191c1e]">lien unique</strong>. Vous le partagez là où se trouve votre audience — un statut WhatsApp, une vidéo TikTok, un post Instagram, un article de blog. Lorsqu&apos;une personne clique sur ce lien et achète une formation ou un produit digital, Novakou enregistre automatiquement la vente et vous attribue <strong className="text-[#191c1e]">{COMMISSION_PCT}&nbsp;% du montant</strong>.
              </p>
              <p>
                Vous n&apos;avez pas besoin d&apos;être expert, ni d&apos;avoir des dizaines de milliers d&apos;abonnés. Beaucoup de nos meilleurs affiliés ont commencé en partageant une formation qui les avait aidés à un petit groupe WhatsApp. Ce qui compte, ce n&apos;est pas la taille de votre audience&nbsp;: c&apos;est la <strong className="text-[#191c1e]">confiance</strong> que vous lui inspirez.
              </p>
            </div>
            <Link
              href="/inscription?role=affilie"
              className="inline-flex items-center gap-2 mt-7 bg-[#006e2f] text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-[#005a26] transition-all hover:-translate-y-0.5"
            >
              <Rocket size={18} /> Obtenir mon lien gratuit
            </Link>
          </div>
          <div className="bg-[#f7f9fb] rounded-3xl p-7 border border-gray-100">
            <div className="space-y-4">
              {[
                { icon: Wallet, t: "Aucun investissement", d: "Pas de produit, pas de stock, pas de budget publicité requis." },
                { icon: Percent, t: `${COMMISSION_PCT}% de commission`, d: "Sur chaque vente, l'un des taux les plus généreux du marché." },
                { icon: Sparkles, t: "Payé en Mobile Money", d: "Orange Money, Wave, MTN — ou virement bancaire, dès 5 000 FCFA." },
                { icon: ShieldCheck, t: "Risque zéro", d: "Vous ne payez jamais rien : vous ne faites qu'encaisser." },
              ].map((r) => {
                const I = r.icon;
                return (
                  <div key={r.t} className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="w-11 h-11 rounded-xl bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                      <I size={22} className="text-[#006e2f]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1e] text-sm">{r.t}</p>
                      <p className="text-[13px] text-[#5c647a] leading-relaxed">{r.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 2 — Comment ça marche (2 colonnes inversées) ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-[#f7f9fb]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-4">
            {steps.map((step) => {
              const I = step.icon;
              return (
                <div key={step.step} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: step.bg }}>
                    {I ? <I size={24} style={{ color: step.color }} /> : null}
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-[#9aa3b2]">ÉTAPE {step.step}</p>
                    <h3 className="font-bold text-[#191c1e] text-base mb-1">{step.title}</h3>
                    <p className="text-[13.5px] text-[#5c647a] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">En pratique</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-5 leading-tight">
              De votre lien à votre première commission
            </h2>
            <div className="space-y-4 text-[15px] text-[#5c647a] leading-relaxed">
              <p>
                Tout commence par votre <strong className="text-[#191c1e]">lien d&apos;affiliation</strong>, généré dès la création de votre compte. Ce lien contient votre code personnel&nbsp;: c&apos;est lui qui permet à Novakou de savoir que la vente vient de vous.
              </p>
              <p>
                Lorsqu&apos;un visiteur clique, un cookie est posé sur son appareil pendant <strong className="text-[#191c1e]">{COOKIE_DAYS} jours</strong>. Même s&apos;il n&apos;achète pas tout de suite, vous restez crédité de la vente s&apos;il revient acheter dans cette fenêtre. Vous n&apos;avez donc pas besoin de «&nbsp;forcer&nbsp;» l&apos;achat immédiat&nbsp;: une recommandation honnête travaille pour vous pendant un mois.
              </p>
              <p>
                Dès qu&apos;un achat est confirmé, votre commission apparaît dans votre tableau de bord. Vous y suivez en temps réel vos clics, vos ventes, votre taux de conversion et votre solde — de quoi comprendre ce qui marche et ajuster votre stratégie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 3 — Le parcours des commissions (2 colonnes) ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">Paiement</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-5 leading-tight">
              Quand et comment êtes-vous payé&nbsp;?
            </h2>
            <div className="space-y-4 text-[15px] text-[#5c647a] leading-relaxed">
              <p>
                La transparence est totale. Chaque commission suit trois étapes claires, et vous voyez à chaque instant où en est votre argent.
              </p>
              <p>
                Après une vente, la commission est d&apos;abord <strong className="text-[#191c1e]">«&nbsp;en validation&nbsp;» pendant 14 jours</strong>. Ce délai correspond à la période durant laquelle l&apos;acheteur peut demander un remboursement. C&apos;est une protection saine&nbsp;: si la vente est annulée, la commission l&apos;est aussi — personne n&apos;est lésé.
              </p>
              <p>
                Passé ces 14 jours sans remboursement, votre commission devient <strong className="text-[#191c1e]">validée et 100&nbsp;% sûre</strong>&nbsp;: elle ne bougera plus. Elle rejoint votre solde retirable. Vous pouvez alors demander un <strong className="text-[#191c1e]">retrait dès 5 000 FCFA</strong>, via Orange Money, Wave, MTN MoMo ou virement bancaire, quand vous le souhaitez. Pas d&apos;attente arbitraire, pas de «&nbsp;1er du mois&nbsp;»&nbsp;: vous décidez.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { n: "1", t: "En validation", d: "Dès la vente, la commission est enregistrée et bloquée 14 jours (fenêtre de remboursement de l'acheteur).", c: "#b45309", bg: "#fef3c7" },
              { n: "2", t: "Validée — retirable", d: "Passé les 14 jours sans remboursement, la commission est garantie et rejoint votre solde.", c: "#006e2f", bg: "#e8f5e9" },
              { n: "3", t: "Payée", d: "Vous demandez un retrait dès 5 000 FCFA via Mobile Money ou virement, à tout moment.", c: "#1565c0", bg: "#e3f2fd" },
            ].map((s, idx) => (
              <div key={s.n} className="relative flex items-start gap-4 bg-[#f7f9fb] rounded-2xl p-5 border border-gray-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold flex-shrink-0" style={{ background: s.bg, color: s.c }}>
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-[#191c1e] text-sm mb-0.5">{s.t}</p>
                  <p className="text-[13px] text-[#5c647a] leading-relaxed">{s.d}</p>
                </div>
                {idx < 2 && <div className="absolute left-[34px] -bottom-4 w-px h-4 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 4 — Calculateur (2 colonnes inversées) ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-[#f7f9fb]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 bg-white rounded-3xl p-8 border border-gray-100">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-[#191c1e]">Ventes générées / mois</label>
                <span className="text-sm font-bold text-[#006e2f] bg-green-50 px-3 py-1 rounded-full">{referrals} ventes</span>
              </div>
              <input type="range" min={1} max={100} value={referrals} onChange={(e) => setReferrals(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#006e2f" }} />
              <div className="flex justify-between text-xs text-[#5c647a] mt-1"><span>1</span><span>100</span></div>
            </div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-[#191c1e]">Prix moyen des produits</label>
                <span className="text-sm font-bold text-[#006e2f] bg-green-50 px-3 py-1 rounded-full">{avgPrice.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <input type="range" min={5000} max={200000} step={5000} value={avgPrice} onChange={(e) => setAvgPrice(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#006e2f" }} />
              <div className="flex justify-between text-xs text-[#5c647a] mt-1"><span>5 000</span><span>200 000 FCFA</span></div>
            </div>
            <div className="bg-gradient-to-br from-[#006e2f] to-[#005a26] rounded-2xl p-6 text-center">
              <p className="text-white/70 text-sm mb-2">Vos gains estimés / mois</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{Math.round(estimatedFcfa).toLocaleString("fr-FR")} FCFA</p>
              <p className="text-white/50 text-xs mt-3">{referrals} ventes × {avgPrice.toLocaleString("fr-FR")} FCFA × {COMMISSION_PCT}%</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">Vos revenus</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-5 leading-tight">
              Combien pouvez-vous gagner&nbsp;?
            </h2>
            <div className="space-y-4 text-[15px] text-[#5c647a] leading-relaxed">
              <p>
                Vos revenus dépendent de deux choses&nbsp;: le nombre de ventes que vous générez et le prix des produits que vous recommandez. Avec {COMMISSION_PCT}&nbsp;% de commission, les montants montent vite.
              </p>
              <p>
                Prenons un exemple concret&nbsp;: vous recommandez une formation à <strong className="text-[#191c1e]">35 000 FCFA</strong>. Une seule vente vous rapporte <strong className="text-[#191c1e]">14 000 FCFA</strong>. Dix ventes dans le mois — soit à peine plus de deux par semaine — et vous voilà à <strong className="text-[#191c1e]">140 000 FCFA</strong>, simplement en ayant partagé un lien à des personnes intéressées.
              </p>
              <p>
                Il n&apos;y a aucun plafond. Certains affiliés se contentent d&apos;un complément de revenu&nbsp;; d&apos;autres en font une vraie activité en publiant régulièrement du contenu autour des produits qu&apos;ils aiment. Faites glisser les curseurs pour estimer votre potentiel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 5 — Qui peut + Que promouvoir (2 colonnes) ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">Pour qui&nbsp;?</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-3 leading-tight">
              Accessible à tous, sur tout le catalogue
            </h2>
            <p className="text-[15px] text-[#5c647a] leading-relaxed">
              Pas besoin d&apos;une grande audience ni d&apos;être créateur. Si vous connaissez des personnes susceptibles d&apos;être intéressées, vous pouvez devenir affilié dès aujourd&apos;hui.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#f7f9fb] rounded-3xl p-8 border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <Users size={22} className="text-[#006e2f]" />
                <h3 className="text-xl font-extrabold text-[#191c1e]">Qui peut devenir affilié&nbsp;?</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Créateurs de contenu (TikTok, Instagram, YouTube)",
                  "Animateurs de groupes ou communautés WhatsApp",
                  "Blogueurs, podcasteurs et newsletters",
                  "Étudiants et jeunes entrepreneurs",
                  "Coachs, formateurs et consultants",
                  "Toute personne avec un réseau qui lui fait confiance",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <Check size={18} className="text-[#006e2f] mt-0.5 flex-shrink-0" />
                    <span className="text-[14px] text-[#191c1e]">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#f7f9fb] rounded-3xl p-8 border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <BookOpen size={22} className="text-[#006e2f]" />
                <h3 className="text-xl font-extrabold text-[#191c1e]">Que pouvez-vous promouvoir&nbsp;?</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Formations vidéo (développement, design, marketing…)",
                  "Produits digitaux (e-books, templates, presets)",
                  "Packs et bundles à prix réduit",
                  "Abonnements aux espaces des créateurs",
                  "Sessions de mentorat",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <Check size={18} className="text-[#006e2f] mt-0.5 flex-shrink-0" />
                    <span className="text-[14px] text-[#191c1e]">{p}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] text-[#5c647a] mt-5 leading-relaxed">
                Choisissez ce qui parle le plus à votre audience&nbsp;: une recommandation pertinente convertit toujours mieux qu&apos;un message générique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 6 — Où partager (2 colonnes) ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-[#f7f9fb]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">Stratégie</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-5 leading-tight">
              Où et comment partager votre lien
            </h2>
            <div className="space-y-4 text-[15px] text-[#5c647a] leading-relaxed">
              <p>
                La règle d&apos;or&nbsp;: visez la pertinence, pas le volume. <strong className="text-[#191c1e]">Dix personnes vraiment intéressées valent mieux que mille indifférentes.</strong> Partagez votre lien là où se trouvent des gens concernés par le produit.
              </p>
              <p>
                En Afrique francophone, <strong className="text-[#191c1e]">WhatsApp</strong> est de loin le canal le plus efficace&nbsp;: vos statuts et vos groupes touchent des personnes qui vous font déjà confiance. Une courte vidéo <strong className="text-[#191c1e]">TikTok</strong> ou un <strong className="text-[#191c1e]">Reel Instagram</strong> qui montre concrètement le problème résolu par la formation peut générer des ventes pendant des semaines.
              </p>
              <p>
                Pensez aussi aux <strong className="text-[#191c1e]">groupes Facebook thématiques</strong>, à votre <strong className="text-[#191c1e]">newsletter</strong> ou à un article de blog&nbsp;: ces formats créent un contenu durable qui continue de travailler pour vous. Dans tous les cas, racontez <em>pourquoi</em> vous recommandez — votre expérience personnelle est votre meilleur argument.
              </p>
            </div>
            <Link href="/guides/devenir-affilie-gagner-argent" className="inline-flex items-center gap-2 mt-6 text-[#006e2f] font-bold text-sm hover:underline">
              <BookOpen size={16} /> Lire le guide complet : devenir affilié et gagner
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: MessageCircle, label: "WhatsApp", desc: "Statuts & groupes" },
              { icon: Sparkles, label: "TikTok", desc: "Vidéos courtes" },
              { icon: Share2, label: "Instagram", desc: "Posts & stories" },
              { icon: Globe, label: "Facebook", desc: "Groupes ciblés" },
              { icon: BookOpen, label: "Blog / Email", desc: "Articles & newsletter" },
              { icon: Users, label: "Votre réseau", desc: "Bouche-à-oreille" },
            ].map((c) => {
              const I = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                  <I size={26} className="text-[#006e2f] mx-auto mb-2.5" />
                  <p className="font-bold text-[#191c1e] text-sm">{c.label}</p>
                  <p className="text-[11px] text-[#5c647a] mt-0.5">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 7 — Les règles (2 colonnes) ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">Les règles du jeu</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-3 leading-tight">
              Un programme sain, pour durer
            </h2>
            <p className="text-[15px] text-[#5c647a] leading-relaxed">
              Quelques principes simples garantissent un écosystème de confiance — pour vous, pour les acheteurs et pour les créateurs.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#f7faf8] rounded-3xl p-8 border border-green-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center"><Check size={18} className="text-[#006e2f]" /></div>
                <h3 className="text-lg font-extrabold text-[#191c1e]">Autorisé &amp; encouragé</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Recommander sincèrement ce que vous trouvez utile",
                  "Créer du contenu original (avis, démos, tutos) avec votre lien",
                  "Partager dans vos groupes et à votre communauté",
                  "Donner des conseils honnêtes pour aider à décider",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14px] text-[#191c1e]"><Check size={17} className="text-[#006e2f] mt-0.5 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-[#fdf6f6] rounded-3xl p-8 border border-rose-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center"><X size={18} className="text-rose-600" /></div>
                <h3 className="text-lg font-extrabold text-[#191c1e]">Strictement interdit</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Spammer des inconnus ou des groupes publics",
                  "S'acheter à soi-même via son propre lien (détecté & annulé)",
                  "Promettre des résultats irréalistes ou mensongers",
                  "Usurper la marque Novakou en publicité payante",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14px] text-[#191c1e]"><X size={17} className="text-rose-500 mt-0.5 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-xs text-[#5c647a] mt-6">
            En cas de non-respect, les commissions concernées peuvent être annulées. Détails dans les <Link href="/cgu-affiliation" className="text-[#006e2f] font-semibold hover:underline">conditions du programme</Link>.
          </p>
        </div>
      </section>

      {/* ══════════ CTA — Obtenir son lien ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-[#006e2f] to-[#003d1b]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Prêt à gagner vos premières commissions&nbsp;?</h2>
          <p className="text-white/80 text-base mb-8">
            Créez votre compte gratuitement et obtenez votre lien d&apos;affiliation unique en moins de 2 minutes.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5 mb-6 text-left">
            <p className="text-xs text-white/70 font-medium mb-2">Votre lien d&apos;affiliation (exemple)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-white bg-black/20 px-3 py-2 rounded-xl truncate">
                https://novakou.com/ref/MONCODE123
              </code>
              <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                  copied ? "bg-white text-[#006e2f]" : "bg-white text-[#006e2f] hover:bg-white/90"
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>
          <Link
            href="/inscription?role=affilie"
            className="inline-flex items-center gap-2 bg-white text-[#006e2f] font-bold px-8 py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Rocket size={20} />
            Créer mon compte affilié — gratuit
          </Link>
        </div>
      </section>

      {/* ══════════ FAQ (2 colonnes : titre | questions) ══════════ */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
          <div>
            <span className="text-[#006e2f] text-xs font-bold uppercase tracking-[0.15em]">Questions fréquentes</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mt-2 mb-4 leading-tight">
              Tout ce que vous devez savoir
            </h2>
            <p className="text-[15px] text-[#5c647a] leading-relaxed">
              Une question sans réponse&nbsp;? Écrivez-nous via la page <Link href="/contact" className="text-[#006e2f] font-semibold hover:underline">Contact</Link> — l&apos;équipe Novakou vous répond rapidement.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#f7f9fb] rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-[#191c1e] text-sm">{faq.q}</span>
                  <ChevronDown size={20} className={`text-[#5c647a] flex-shrink-0 ml-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
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
