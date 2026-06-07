"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  type LucideIcon,
  Megaphone,
  BarChart3,
  ToggleRight,
  Wallet,
  GitMerge,
  Users2,
  ArrowRight,
  Tag,
  MousePointerClick,
  Network,
  PlusCircle,
  Headphones,
  Code,
  Link as LinkIcon,
  MailOpen,
  Zap,
} from "lucide-react";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaSection,
} from "@/components/kaza";

type MarketingData = {
  summary: { activeTools: number; totalMarketingRevenue: number; totalConversions: number };
  discountCodes: { total: number; active: number; totalUsed: number; revenue: number };
  popups: { total: number; active: number; totalImpressions: number; totalConversions: number; conversionRate: number };
  pixels: { total: number; configured: number; types: string[] };
  campaigns: { total: number; active: number; totalClicks: number; totalConversions: number; revenue: number };
  affiliation: { hasProgram: boolean; totalAffiliates: number; activeAffiliates: number; revenue: number };
  sequences: { total: number; active: number; totalEnrolled: number };
  funnels: { total: number; active: number; totalConversions: number; revenue: number };
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

type ToolCardProps = {
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  stat1: string;
  stat1Label: string;
  stat2?: string;
  stat2Label?: string;
  active: boolean;
  loading?: boolean;
  badge?: string;
};

function ToolCard({ href, icon: Icon, iconBg, iconColor, title, description, stat1, stat1Label, stat2, stat2Label, active, loading, badge }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-emerald-200 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex items-center gap-2">
          {badge && <KazaBadge variant="orange">{badge}</KazaBadge>}
          {active ? (
            <KazaBadge variant="green">Actif</KazaBadge>
          ) : (
            <KazaBadge variant="slate">Inactif</KazaBadge>
          )}
        </div>
      </div>

      <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
      <p className="text-[11px] text-slate-500 leading-snug mb-4 flex-1">{description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div>
          <p className="text-base font-extrabold text-[#0b2540] leading-none">
            {loading ? <span className="inline-block w-10 h-4 bg-slate-100 rounded animate-pulse" /> : stat1}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{stat1Label}</p>
        </div>
        {stat2 && stat2Label && (
          <div className="text-right">
            <p className="text-sm font-bold text-[#0b2540] leading-none">
              {loading ? <span className="inline-block w-8 h-3 bg-slate-100 rounded animate-pulse" /> : stat2}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat2Label}</p>
          </div>
        )}
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

export default function MarketingPage() {
  const { data: response, isLoading } = useQuery<{ data: MarketingData }>({
    queryKey: ["vendeur-marketing-hub"],
    queryFn: () => fetch("/api/formations/vendeur/marketing").then((r) => r.json()),
    staleTime: 60_000,
  });

  const d = response?.data;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      <KazaHero
        badge="Pro"
        badgeColor="orange"
        title="Marketing"
        subtitle="Tous vos outils de croissance au même endroit"
        icon={Megaphone}
        actions={
          <KazaButton variant="secondary" href="/vendeur/statistiques" icon={BarChart3}>
            Stats globales
          </KazaButton>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KazaKpiCard
          label="Outils actifs"
          value={d?.summary.activeTools ?? 0}
          delta="sur 7 disponibles"
          icon={ToggleRight}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Revenus marketing"
          value={isLoading ? "…" : `${formatFCFA(d?.summary.totalMarketingRevenue ?? 0)} FCFA`}
          delta={`≈ ${Math.round((d?.summary.totalMarketingRevenue ?? 0) / 655.957)} €`}
          icon={Wallet}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Conversions totales"
          value={d?.summary.totalConversions ?? 0}
          delta="Tous outils confondus"
          icon={GitMerge}
          iconColor="violet"
        />
      </div>

      {/* Ventes & Conversions */}
      <KazaSection label="Ventes" title="Ventes & Conversions" description="Réductions, popups, funnels et order bumps">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard
            href="/vendeur/marketing/codes-promo"
            icon={Tag}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            title="Codes Promo"
            description="Créez des réductions en % ou montant fixe. Limitez les usages et ajoutez une date d'expiration."
            stat1={String(d?.discountCodes.active ?? 0)}
            stat1Label="codes actifs"
            stat2={`${formatFCFA(d?.discountCodes.revenue ?? 0)} FCFA`}
            stat2Label="revenus"
            active={(d?.discountCodes.active ?? 0) > 0}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/marketing/popups"
            icon={MousePointerClick}
            iconBg="bg-pink-50"
            iconColor="text-pink-500"
            title="Popups intelligents"
            description="Déclenchez des popups exit-intent, scroll ou timer pour capturer des emails au bon moment."
            stat1={String(d?.popups.active ?? 0)}
            stat1Label="popups actifs"
            stat2={`${d?.popups.conversionRate ?? 0}%`}
            stat2Label="conversion"
            active={(d?.popups.active ?? 0) > 0}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/marketing/funnels"
            icon={Network}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            title="Funnels de vente"
            description="Créez des tunnels de vente avec upsells et downsells pour maximiser la valeur de chaque client."
            stat1={String(d?.funnels.active ?? 0)}
            stat1Label="funnels actifs"
            stat2={String(d?.funnels.totalConversions ?? 0)}
            stat2Label="conversions"
            active={(d?.funnels.active ?? 0) > 0}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/marketing/order-bumps"
            icon={PlusCircle}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            title="Order bumps"
            description="Proposez un produit complémentaire au checkout, avant le paiement. +20 à 30% de panier moyen."
            stat1="—"
            stat1Label="bumps actifs"
            stat2="Nouveau"
            stat2Label="feature"
            active={false}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/support-ia"
            icon={Headphones}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
            title="Support Client IA"
            description="Un chatbot Claude Sonnet 4.6 sur vos pages publiques qui répond aux questions 24/7."
            stat1="Nouveau"
            stat1Label="feature"
            stat2="Claude 4.6"
            stat2Label="IA"
            active={false}
            loading={isLoading}
          />
        </div>
      </KazaSection>

      {/* Acquisition & Trafic */}
      <KazaSection label="Acquisition" title="Acquisition & Trafic" description="Tracking et campagnes UTM">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard
            href="/vendeur/marketing/pixels"
            icon={Code}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            title="Pixels & Tracking"
            description="Connectez Facebook Pixel, Google Analytics et TikTok Pixel pour suivre vos conversions."
            stat1={String(d?.pixels.configured ?? 0)}
            stat1Label="pixels configurés"
            stat2="3 max"
            stat2Label="disponibles"
            active={(d?.pixels.configured ?? 0) > 0}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/marketing/campagnes"
            icon={LinkIcon}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            title="Liens de campagne"
            description="Générez des liens UTM trackés pour mesurer quelle source génère le plus de ventes."
            stat1={String(d?.campaigns.totalClicks ?? 0)}
            stat1Label="clics totaux"
            stat2={String(d?.campaigns.totalConversions ?? 0)}
            stat2Label="conversions"
            active={(d?.campaigns.active ?? 0) > 0}
            loading={isLoading}
          />
        </div>
      </KazaSection>

      {/* Programme Affiliation */}
      <KazaSection label="Affiliation" title="Programme d'affiliation" description="Vos apprenants vendent pour vous">
        <Link
          href="/vendeur/marketing/affiliation"
          className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <Users2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-sm">Programme d&apos;affiliation</h3>
              {d?.affiliation.hasProgram ? <KazaBadge variant="green">Actif</KazaBadge> : <KazaBadge variant="slate">Inactif</KazaBadge>}
            </div>
            <p className="text-[12px] text-slate-600">
              Laissez vos apprenants et partenaires promouvoir vos formations en échange d&apos;une commission.
            </p>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-xl font-extrabold text-[#0b2540]">{isLoading ? "…" : (d?.affiliation.activeAffiliates ?? 0)}</p>
              <p className="text-[10px] text-slate-500">affiliés actifs</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-emerald-600">{isLoading ? "…" : formatFCFA(d?.affiliation.revenue ?? 0)}</p>
              <p className="text-[10px] text-slate-500">FCFA générés</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </KazaSection>

      {/* Communication */}
      <KazaSection label="Communication" title="Communication automatisée" description="Séquences email et automatisations">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ToolCard
            href="/vendeur/marketing/sequences"
            icon={MailOpen}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            title="Séquences email"
            description="Automatisez bienvenue, relances, récupération panier abandonné et suivi post-achat."
            stat1={String(d?.sequences.active ?? 0)}
            stat1Label="séquences actives"
            stat2={String(d?.sequences.totalEnrolled ?? 0)}
            stat2Label="abonnés"
            active={(d?.sequences.active ?? 0) > 0}
            loading={isLoading}
          />
          <Link
            href="/vendeur/automatisations"
            className="group flex flex-col bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <KazaBadge variant="green">Nouveau</KazaBadge>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Automatisations</h3>
            <p className="text-[11px] text-slate-500 leading-snug mb-4 flex-1">
              Créez des workflows si-ceci-alors-cela. Connectez n8n, Make, Zapier et automatisez chaque étape du parcours.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-emerald-100">
              <span className="text-xs font-semibold text-emerald-600">Gérer les automatisations</span>
              <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </div>
      </KazaSection>
    </div>
  );
}
