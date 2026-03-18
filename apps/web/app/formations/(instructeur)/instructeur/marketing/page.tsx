"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useMarketingOverview } from "@/lib/formations/hooks";
import {
  DollarSign, ShoppingCart, Users, Percent, Mail, Eye,
  Zap, Tag, Megaphone, MousePointerClick, Filter as FilterIcon,
  ArrowRight, PlusCircle, Sparkles, ChevronRight, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

import StatCard from "@/components/formations/StatCard";
import ChartContainer from "@/components/formations/ChartContainer";
import EmptyState from "@/components/formations/EmptyState";

// ── Types ────────────────────────────────────────────────────────────────────

interface OverviewKPIs {
  totalRevenue: number;
  revenueChange: number;
  totalSales: number;
  salesChange: number;
  activeAffiliates: number;
  affiliatesChange: number;
  conversionRate: number;
  conversionChange: number;
  emailsSent: number;
  emailsSentChange: number;
  popupImpressions: number;
  popupImpressionsChange: number;
}

interface SubsystemStats {
  activeAffiliates: number;
  totalAffiliateRevenue: number;
  activeDiscounts: number;
  totalDiscountUses: number;
  activeFlashOffers: number;
  totalFlashRevenue: number;
  activeSequences: number;
  totalEmailsEnrolled: number;
  avgOpenRate: number;
  activeFunnels: number;
  totalFunnelRevenue: number;
  activePopups: number;
  totalPopupImpressions: number;
  totalPopupConversions: number;
  activeCampaigns: number;
  totalCampaignClicks: number;
  totalCampaignRevenue: number;
}

interface RevenueBySource {
  date: string;
  direct: number;
  affiliate: number;
  discount: number;
  funnel: number;
}

type ActivityType =
  | "affiliate_sale" | "discount_used" | "flash_purchase"
  | "email_sent" | "popup_conversion" | "funnel_purchase"
  | "campaign_click" | "sequence_enrollment";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  amount?: number;
  timestamp: string;
}

interface OverviewData {
  kpis: OverviewKPIs;
  subsystems: SubsystemStats;
  recentActivity: ActivityItem[];
  revenueByDay: RevenueBySource[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const PERIODS = [
  { value: "7d", label: "7j" },
  { value: "30d", label: "30j" },
  { value: "3m", label: "3m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1an" },
] as const;

const ACTIVITY_ICONS: Record<ActivityType, { icon: React.ReactNode; color: string }> = {
  affiliate_sale: { icon: <Users className="w-4 h-4" />, color: "text-blue-600 bg-blue-50" },
  discount_used: { icon: <Tag className="w-4 h-4" />, color: "text-purple-600 bg-purple-50" },
  flash_purchase: { icon: <Zap className="w-4 h-4" />, color: "text-amber-600 bg-amber-50" },
  email_sent: { icon: <Mail className="w-4 h-4" />, color: "text-cyan-600 bg-cyan-50" },
  popup_conversion: { icon: <MousePointerClick className="w-4 h-4" />, color: "text-pink-600 bg-pink-50" },
  funnel_purchase: { icon: <FilterIcon className="w-4 h-4" />, color: "text-green-600 bg-green-50" },
  campaign_click: { icon: <Megaphone className="w-4 h-4" />, color: "text-orange-600 bg-orange-50" },
  sequence_enrollment: { icon: <Mail className="w-4 h-4" />, color: "text-indigo-600 bg-indigo-50" },
};

const SUBSYSTEM_CARDS = [
  { key: "affilies", label: "Affiliés", labelEn: "Affiliates", icon: Users, href: "/formations/instructeur/marketing/affilies", color: "text-blue-600", bg: "bg-blue-50" },
  { key: "reductions", label: "Réductions", labelEn: "Discounts", icon: Tag, href: "/formations/instructeur/marketing/reductions", color: "text-purple-600", bg: "bg-purple-50" },
  { key: "flash", label: "Ventes flash", labelEn: "Flash sales", icon: Zap, href: "/formations/instructeur/marketing/flash", color: "text-amber-600", bg: "bg-amber-50" },
  { key: "emails", label: "Séquences email", labelEn: "Email sequences", icon: Mail, href: "/formations/instructeur/marketing/emails", color: "text-cyan-600", bg: "bg-cyan-50" },
  { key: "funnels", label: "Tunnels de vente", labelEn: "Sales funnels", icon: FilterIcon, href: "/formations/instructeur/marketing/funnels", color: "text-green-600", bg: "bg-green-50" },
  { key: "popups", label: "Popups", labelEn: "Popups", icon: MousePointerClick, href: "/formations/instructeur/marketing/popups", color: "text-pink-600", bg: "bg-pink-50" },
  { key: "campagnes", label: "Campagnes", labelEn: "Campaigns", icon: Megaphone, href: "/formations/instructeur/marketing/campagnes", color: "text-orange-600", bg: "bg-orange-50" },
  { key: "analytics", label: "Analytics", labelEn: "Analytics", icon: TrendingUp, href: "/formations/instructeur/marketing/analytics", color: "text-green-600", bg: "bg-green-50" },
];

function formatCurrency(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k€` : `${value.toLocaleString("fr-FR")}€`;
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

// ── Page Component ───────────────────────────────────────────────────────────

export default function MarketingHubPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const [period, setPeriod] = useState("30d");

  const { data, isLoading: loading, error: queryError, refetch } = useMarketingOverview(period);
  const error = queryError?.message ?? null;

  // Loading
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-52 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Sparkles className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // Empty
  if (!data) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={<Sparkles className="w-12 h-12 text-primary/30" />}
          title={fr ? "Centre Marketing" : "Marketing Hub"}
          description={fr ? "Gérez vos affiliés, réductions, séquences email, funnels de vente, popups et campagnes depuis un seul endroit." : "Manage your affiliates, discounts, email sequences, sales funnels, popups and campaigns from one place."}
          ctaLabel={fr ? "Créer une réduction" : "Create a discount"}
          ctaHref="/formations/instructeur/marketing/reductions"
        />
      </div>
    );
  }

  const { kpis, subsystems, recentActivity, revenueByDay } = data;

  // Build subsystem metrics
  const subsystemMetrics = [
    { ...SUBSYSTEM_CARDS[0], active: subsystems.activeAffiliates, metric: formatCurrency(subsystems.totalAffiliateRevenue), metricLabel: fr ? "revenus" : "revenue" },
    { ...SUBSYSTEM_CARDS[1], active: subsystems.activeDiscounts, metric: `${subsystems.totalDiscountUses}`, metricLabel: fr ? "utilisations" : "uses" },
    { ...SUBSYSTEM_CARDS[2], active: subsystems.activeFlashOffers, metric: formatCurrency(subsystems.totalFlashRevenue), metricLabel: fr ? "revenus" : "revenue" },
    { ...SUBSYSTEM_CARDS[3], active: subsystems.activeSequences, metric: `${subsystems.avgOpenRate}%`, metricLabel: fr ? "taux ouverture" : "open rate" },
    { ...SUBSYSTEM_CARDS[4], active: subsystems.activeFunnels, metric: formatCurrency(subsystems.totalFunnelRevenue), metricLabel: fr ? "revenus" : "revenue" },
    { ...SUBSYSTEM_CARDS[5], active: subsystems.activePopups, metric: `${subsystems.totalPopupConversions}`, metricLabel: fr ? "conversions" : "conversions" },
    { ...SUBSYSTEM_CARDS[6], active: subsystems.activeCampaigns, metric: `${subsystems.totalCampaignClicks}`, metricLabel: fr ? "clics" : "clicks" },
    { ...SUBSYSTEM_CARDS[7], active: 0, metric: "", metricLabel: fr ? "vue détaillée" : "detailed view" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {fr ? "Centre Marketing" : "Marketing Hub"}
            </h1>
            <p className="text-sm text-slate-500">
              {fr ? "Pilotez tous vos outils marketing" : "Manage all your marketing tools"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/formations/instructeur/marketing/reductions" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
              <PlusCircle className="w-3.5 h-3.5" /> {fr ? "Réduction" : "Discount"}
            </Link>
            <Link href="/formations/instructeur/marketing/emails/creer" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors">
              <PlusCircle className="w-3.5 h-3.5" /> {fr ? "Séquence" : "Sequence"}
            </Link>
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.value ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={DollarSign} label={fr ? "Revenu total" : "Total revenue"} value={formatCurrency(kpis.totalRevenue)} trend={kpis.revenueChange} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={ShoppingCart} label={fr ? "Ventes" : "Sales"} value={kpis.totalSales} trend={kpis.salesChange} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Users} label={fr ? "Affiliés" : "Affiliates"} value={kpis.activeAffiliates} trend={kpis.affiliatesChange} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={Percent} label={fr ? "Conversion" : "Conversion"} value={`${kpis.conversionRate}%`} trend={kpis.conversionChange} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Mail} label={fr ? "Emails" : "Emails"} value={kpis.emailsSent} trend={kpis.emailsSentChange} color="text-cyan-600" bg="bg-cyan-50" />
        <StatCard icon={Eye} label={fr ? "Popups" : "Popups"} value={kpis.popupImpressions} trend={kpis.popupImpressionsChange} color="text-pink-600" bg="bg-pink-50" />
      </div>

      {/* Revenue by source — Stacked AreaChart */}
      {revenueByDay && revenueByDay.length > 0 && (
        <ChartContainer
          title={fr ? "Revenus par source" : "Revenue by source"}
          exportData={revenueByDay}
          exportFilename="revenus-marketing"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="gradDirect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C2BD9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6C2BD9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAffiliate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDiscount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFunnel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v: number, name: string) => [`${v.toLocaleString("fr-FR")}€`, name]}
              />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="direct" stackId="1" stroke="#6C2BD9" strokeWidth={2} fill="url(#gradDirect)" name={fr ? "Direct" : "Direct"} />
              <Area type="monotone" dataKey="affiliate" stackId="1" stroke="#0EA5E9" strokeWidth={2} fill="url(#gradAffiliate)" name={fr ? "Affilié" : "Affiliate"} />
              <Area type="monotone" dataKey="discount" stackId="1" stroke="#10B981" strokeWidth={2} fill="url(#gradDiscount)" name={fr ? "Réduction" : "Discount"} />
              <Area type="monotone" dataKey="funnel" stackId="1" stroke="#F59E0B" strokeWidth={2} fill="url(#gradFunnel)" name={fr ? "Funnel" : "Funnel"} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Subsystems grid + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subsystems table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">{fr ? "Outils marketing" : "Marketing tools"}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {subsystemMetrics.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-800/50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{fr ? s.label : s.labelEn}</p>
                  {s.active > 0 && (
                    <p className="text-xs text-slate-500">
                      {s.active} {fr ? "actif(s)" : "active"} · {s.metric} {s.metricLabel}
                    </p>
                  )}
                  {s.active === 0 && s.key !== "analytics" && (
                    <p className="text-xs text-slate-400">{fr ? "Aucun actif" : "None active"}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {fr ? "Activité récente" : "Recent activity"}
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {(recentActivity ?? []).slice(0, 15).map((a) => {
              const config = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.campaign_click;
              return (
                <div key={a.id} className="flex items-start gap-3 p-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-tight">{a.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{timeAgo(a.timestamp)}</span>
                      {a.amount != null && a.amount > 0 && (
                        <span className="text-xs font-bold text-green-600">+{a.amount}€</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-center text-slate-400 text-sm py-8">
                {fr ? "Aucune activité récente" : "No recent activity"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
