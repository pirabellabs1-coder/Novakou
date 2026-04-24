"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

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

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#006e2f]" />
      Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Inactif
    </span>
  );
}

type ToolCardProps = {
  href: string;
  icon: string;
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

function ToolCard({ href, icon, iconBg, iconColor, title, description, stat1, stat1Label, stat2, stat2Label, active, loading, badge }: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#006e2f]/20 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <span className={`material-symbols-outlined text-[22px] ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{badge}</span>
          )}
          <ActiveBadge active={active} />
        </div>
      </div>

      <h3 className="font-bold text-[#191c1e] text-sm mb-1">{title}</h3>
      <p className="text-[11px] text-[#5c647a] leading-snug mb-4 flex-1">{description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div>
          <p className="text-base font-extrabold text-[#191c1e] leading-none">
            {loading ? <span className="inline-block w-10 h-4 bg-gray-100 rounded animate-pulse" /> : stat1}
          </p>
          <p className="text-[10px] text-[#5c647a] mt-0.5">{stat1Label}</p>
        </div>
        {stat2 && stat2Label && (
          <div className="text-right">
            <p className="text-sm font-bold text-[#191c1e] leading-none">
              {loading ? <span className="inline-block w-8 h-3 bg-gray-100 rounded animate-pulse" /> : stat2}
            </p>
            <p className="text-[10px] text-[#5c647a] mt-0.5">{stat2Label}</p>
          </div>
        )}
        <span className="material-symbols-outlined text-[18px] text-[#5c647a] group-hover:text-[#006e2f] group-hover:translate-x-0.5 transition-all">
          arrow_forward
        </span>
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
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Marketing</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Tous vos outils de croissance au même endroit
          </p>
        </div>
        <Link
          href="/vendeur/statistiques"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] bg-white hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-[#5c647a]">analytics</span>
          Voir les stats globales
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Outils actifs",
            value: d?.summary.activeTools ?? 0,
            sub: "sur 7 disponibles",
            icon: "toggle_on",
            color: "text-[#006e2f]",
            bg: "bg-[#006e2f]/10",
          },
          {
            label: "Revenus marketing",
            value: isLoading ? "…" : `${formatFCFA(d?.summary.totalMarketingRevenue ?? 0)} FCFA`,
            sub: `≈ ${Math.round((d?.summary.totalMarketingRevenue ?? 0) / 655.957)} €`,
            icon: "payments",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Conversions totales",
            value: d?.summary.totalConversions ?? 0,
            sub: "Tous outils confondus",
            icon: "conversion_path",
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${kpi.bg}`}>
              <span className={`material-symbols-outlined text-[20px] ${kpi.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {kpi.icon}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wide">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#191c1e] mt-0.5 leading-snug">
              {isLoading ? <span className="inline-block w-12 h-5 bg-gray-100 rounded animate-pulse" /> : kpi.value}
            </p>
            <p className="text-[10px] text-[#5c647a]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Section: Ventes & Conversions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>sell</span>
          <h2 className="text-base font-bold text-[#191c1e]">Ventes & Conversions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard
            href="/vendeur/marketing/codes-promo"
            icon="local_offer"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            title="Codes Promo"
            description="Créez des réductions en % ou montant fixe pour booster vos ventes. Limitez les usages, ajoutez une date d'expiration."
            stat1={String(d?.discountCodes.active ?? 0)}
            stat1Label="codes actifs"
            stat2={`${formatFCFA(d?.discountCodes.revenue ?? 0)} FCFA`}
            stat2Label="revenus générés"
            active={(d?.discountCodes.active ?? 0) > 0}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/marketing/popups"
            icon="ads_click"
            iconBg="bg-pink-50"
            iconColor="text-pink-500"
            title="Popups Intelligents"
            description="Déclenchez des popups exit-intent, scroll ou timer pour capturer des emails ou offrir un code promo au bon moment."
            stat1={String(d?.popups.active ?? 0)}
            stat1Label="popups actifs"
            stat2={`${d?.popups.conversionRate ?? 0}%`}
            stat2Label="taux conversion"
            active={(d?.popups.active ?? 0) > 0}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/marketing/funnels"
            icon="account_tree"
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            title="Funnels de Vente"
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
            icon="add_shopping_cart"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            title="Order Bumps"
            description="Proposez un produit complémentaire via checkbox au checkout, avant le paiement. +20 à 30% de panier moyen."
            stat1="—"
            stat1Label="bumps actifs"
            stat2="Nouveau"
            stat2Label="feature"
            active={false}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Section: Acquisition & Trafic */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          <h2 className="text-base font-bold text-[#191c1e]">Acquisition & Trafic</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ToolCard
            href="/vendeur/marketing/pixels"
            icon="code"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            title="Pixels & Tracking"
            description="Connectez Facebook Pixel, Google Analytics et TikTok Pixel pour suivre vos conversions et recibler vos visiteurs."
            stat1={String(d?.pixels.configured ?? 0)}
            stat1Label="pixels configurés"
            stat2="3 max"
            stat2Label="disponibles"
            active={(d?.pixels.configured ?? 0) > 0}
            loading={isLoading}
          />
          <ToolCard
            href="/vendeur/marketing/campagnes"
            icon="link"
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            title="Liens de Campagne"
            description="Générez des liens UTM trackés pour mesurer précisément quelle source (Instagram, email, WhatsApp) génère le plus de ventes."
            stat1={String(d?.campaigns.totalClicks ?? 0)}
            stat1Label="clics totaux"
            stat2={String(d?.campaigns.totalConversions ?? 0)}
            stat2Label="conversions"
            active={(d?.campaigns.active ?? 0) > 0}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Section: Programme Affiliation */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px] text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
          <h2 className="text-base font-bold text-[#191c1e]">Programme Affiliation</h2>
        </div>
        <Link
          href="/vendeur/marketing/affiliation"
          className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px] text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>diversity_3</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-[#191c1e] text-sm">Programme d'Affiliation</h3>
              <ActiveBadge active={d?.affiliation.hasProgram ?? false} />
            </div>
            <p className="text-[12px] text-[#5c647a]">
              Laissez vos apprenants et partenaires promouvoir vos formations en échange d'une commission. Définissez le taux, les règles et suivez tout en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-xl font-extrabold text-[#191c1e]">{isLoading ? "…" : (d?.affiliation.activeAffiliates ?? 0)}</p>
              <p className="text-[10px] text-[#5c647a]">affiliés actifs</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-[#006e2f]">{isLoading ? "…" : `${formatFCFA(d?.affiliation.revenue ?? 0)}`}</p>
              <p className="text-[10px] text-[#5c647a]">FCFA générés</p>
            </div>
            <span className="material-symbols-outlined text-[20px] text-[#5c647a] group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
              arrow_forward
            </span>
          </div>
        </Link>
      </div>

      {/* Section: Communication */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px] text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
          <h2 className="text-base font-bold text-[#191c1e]">Communication</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ToolCard
            href="/vendeur/marketing/sequences"
            icon="mark_email_read"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            title="Séquences Email"
            description="Automatisez vos emails de bienvenue, relances, récupération de panier abandonné et suivi post-achat."
            stat1={String(d?.sequences.active ?? 0)}
            stat1Label="séquences actives"
            stat2={String(d?.sequences.totalEnrolled ?? 0)}
            stat2Label="abonnés"
            active={(d?.sequences.active ?? 0) > 0}
            loading={isLoading}
          />
          <Link
            href="/vendeur/automatisations"
            className="group flex flex-col bg-gradient-to-br from-[#006e2f]/5 to-emerald-50 border border-[#006e2f]/10 rounded-2xl p-5 hover:shadow-md hover:border-[#006e2f]/20 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#006e2f]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">Nouveau</span>
            </div>
            <h3 className="font-bold text-[#191c1e] text-sm mb-1">Automatisations</h3>
            <p className="text-[11px] text-[#5c647a] leading-snug mb-4 flex-1">
              Créez des workflows si-ceci-alors-cela. Connectez vos outils (n8n, Make, Zapier) et automatisez chaque étape du parcours apprenant.
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-[#006e2f]/10">
              <span className="text-xs font-semibold text-[#006e2f]">Gérer les automatisations</span>
              <span className="material-symbols-outlined text-[18px] text-[#006e2f] group-hover:translate-x-0.5 transition-all">
                arrow_forward
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
