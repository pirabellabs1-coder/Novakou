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
  const estimatedEur = Math.round((estimatedFcfa / 655.957) * 10) / 10;

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
            <Trophy size={16} />
            Programme d&apos;affiliation
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            Gagnez en recommandant
            <br />
            <span className="text-[#86efac]">Novakou Formations</span>
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Partagez votre lien unique. Touchez{" "}
            <span className="text-[#86efac] font-bold">{COMMISSION_PCT}% de commission</span> sur chaque vente générée. Retirable via Mobile Money dès validation.
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
              href="#comment-ca-marche"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-all"
            >
              <Info size={18} />
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
                {(()=>{const _I=stat.icon;return _I?<_I size={20} />:null;})()}
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
                  {(()=>{const _I=step.icon;return _I?<_I size={28} />:null;})()}
                </div>
                <h3 className="font-bold text-[#191c1e] text-base mb-2">{step.title}</h3>
                <p className="text-sm text-[#5c647a] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Parcours des commissions — comment vous êtes payé, concrètement */}
          <div className="mt-12 max-w-3xl mx-auto">
            <h3 className="text-center text-lg font-extrabold text-[#191c1e] mb-6">
              Le parcours de vos commissions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  n: "1",
                  t: "En validation",
                  d: "Dès qu'une vente est réalisée via votre lien, la commission est enregistrée et bloquée pendant 14 jours (période de remboursement de l'acheteur).",
                  c: "#b45309",
                  bg: "#fef3c7",
                },
                {
                  n: "2",
                  t: "Validée — retirable",
                  d: "Passé les 14 jours sans remboursement, la commission devient sûre et s'ajoute à votre solde retirable.",
                  c: "#006e2f",
                  bg: "#e8f5e9",
                },
                {
                  n: "3",
                  t: "Payée",
                  d: "Vous demandez un retrait (dès 5 000 FCFA) via Mobile Money ou virement, depuis votre espace affilié.",
                  c: "#1565c0",
                  bg: "#e3f2fd",
                },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div
                    className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold"
                    style={{ background: s.bg, color: s.c }}
                  >
                    {s.n}
                  </div>
                  <p className="mb-1 text-sm font-bold text-[#191c1e]">{s.t}</p>
                  <p className="text-xs leading-relaxed text-[#5c647a]">{s.d}</p>
                </div>
              ))}
            </div>
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

      {/* Pourquoi devenir affilié */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mb-3">
              Pourquoi devenir affilié Novakou ?
            </h2>
            <p className="text-[#5c647a] text-base max-w-2xl mx-auto">
              Le moyen le plus simple de générer un revenu en ligne en Afrique francophone : sans rien créer, sans stock, sans risque.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Percent, title: `Jusqu'à ${COMMISSION_PCT}% par vente`, desc: "L'un des taux de commission les plus élevés du marché, sur chaque vente que vous générez." },
              { icon: Wallet, title: "Zéro investissement", desc: "Pas de produit à créer, pas de stock, pas de pub à payer. Vous partagez, vous gagnez." },
              { icon: Sparkles, title: "Paiement Mobile Money", desc: "Retirez vos gains via Orange Money, Wave, MTN MoMo ou virement bancaire, dès 5 000 FCFA." },
              { icon: TrendingUp, title: "Suivi en temps réel", desc: "Clics, ventes, commissions, taux de conversion : tout est visible dans votre tableau de bord affilié." },
              { icon: ShieldCheck, title: "Commissions sécurisées", desc: "Une fois validée (14 jours), votre commission est garantie — votre solde ne bouge plus." },
              { icon: BadgeCheck, title: "Cumulable", desc: "Vous pouvez être affilié ET vendeur en même temps. Les deux revenus s'additionnent." },
            ].map((b) => {
              const I = b.icon;
              return (
                <div key={b.title} className="bg-[#f7f9fb] rounded-2xl p-6 border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-[#006e2f]/10 flex items-center justify-center mb-4">
                    <I size={24} className="text-[#006e2f]" />
                  </div>
                  <h3 className="font-bold text-[#191c1e] text-base mb-1.5">{b.title}</h3>
                  <p className="text-sm text-[#5c647a] leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Qui peut + Que promouvoir */}
      <section className="py-16 px-4 bg-[#f7f9fb]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <Users size={22} className="text-[#006e2f]" />
              <h2 className="text-xl font-extrabold text-[#191c1e]">Qui peut devenir affilié ?</h2>
            </div>
            <p className="text-sm text-[#5c647a] mb-4">Tout le monde — pas besoin d'une grande audience. Il suffit de connaître des personnes intéressées :</p>
            <ul className="space-y-2.5">
              {[
                "Créateurs de contenu (TikTok, Instagram, YouTube)",
                "Animateurs de groupes ou communautés WhatsApp",
                "Blogueurs et newsletters",
                "Étudiants et jeunes entrepreneurs",
                "Coachs, formateurs, consultants",
                "Toute personne avec un réseau motivé",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <Check size={18} className="text-[#006e2f] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#191c1e]">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen size={22} className="text-[#006e2f]" />
              <h2 className="text-xl font-extrabold text-[#191c1e]">Que pouvez-vous promouvoir ?</h2>
            </div>
            <p className="text-sm text-[#5c647a] mb-4">Tout le catalogue Novakou. Choisissez ce qui parle le plus à votre audience :</p>
            <ul className="space-y-2.5">
              {[
                "Formations vidéo (développement, design, marketing…)",
                "Produits digitaux (e-books, templates, presets)",
                "Packs et bundles à prix réduit",
                "Abonnements aux espaces des créateurs",
                "Sessions de mentorat",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <Check size={18} className="text-[#006e2f] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#191c1e]">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Où partager */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mb-3">Où partager votre lien</h2>
            <p className="text-[#5c647a] text-base max-w-2xl mx-auto">
              Visez les endroits où se trouvent des gens vraiment intéressés. 10 personnes ciblées valent mieux que 1 000 indifférentes.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <div key={c.label} className="bg-[#f7f9fb] rounded-2xl p-5 border border-gray-100 text-center">
                  <I size={26} className="text-[#006e2f] mx-auto mb-2.5" />
                  <p className="font-bold text-[#191c1e] text-sm">{c.label}</p>
                  <p className="text-[11px] text-[#5c647a] mt-0.5">{c.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link href="/guides/devenir-affilie-gagner-argent" className="inline-flex items-center gap-2 text-[#006e2f] font-bold text-sm hover:underline">
              <BookOpen size={16} /> Lire le guide complet : devenir affilié et gagner
            </Link>
          </div>
        </div>
      </section>

      {/* Les règles */}
      <section className="py-16 px-4 bg-[#f7f9fb]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] mb-3">Les règles du jeu</h2>
            <p className="text-[#5c647a] text-base">Quelques principes simples pour un programme sain et durable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Check size={18} className="text-[#006e2f]" /></div>
                <h3 className="font-bold text-[#191c1e]">Autorisé</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Recommander sincèrement ce que vous trouvez utile",
                  "Créer du contenu (avis, démos, tutos) avec votre lien",
                  "Partager dans vos groupes et à votre communauté",
                  "Offrir des conseils honnêtes pour aider à décider",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[#191c1e]"><Check size={16} className="text-[#006e2f] mt-0.5 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-rose-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center"><X size={18} className="text-rose-600" /></div>
                <h3 className="font-bold text-[#191c1e]">Interdit</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Spammer des inconnus ou des groupes publics",
                  "S'acheter à soi-même via son propre lien (détecté & annulé)",
                  "Promettre des résultats irréalistes",
                  "Usurper la marque Novakou en publicité payante",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[#191c1e]"><X size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-xs text-[#5c647a] mt-6">
            En cas de non-respect, les commissions concernées peuvent être annulées. Détails dans les <Link href="/cgu-affiliation" className="text-[#006e2f] font-semibold hover:underline">conditions du programme</Link>.
          </p>
        </div>
      </section>

      {/* Get your link CTA */}
      <section className="py-16 px-4 bg-white">
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
                https://novakou.com/ref/MONCODE123
              </code>
              <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                  copied ? "bg-green-100 text-green-700" : "bg-[#006e2f] text-white hover:bg-[#005a26]"
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>

          <Link
            href="/inscription?role=affilie"
            className="inline-flex items-center gap-2 bg-[#006e2f] text-white font-bold px-8 py-4 rounded-2xl text-base shadow-lg hover:bg-[#005a26] hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Rocket size={20} />
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
                  <ChevronDown size={20} className="text-[#5c647a] flex-shrink-0 ml-4 transition-transform" />
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
