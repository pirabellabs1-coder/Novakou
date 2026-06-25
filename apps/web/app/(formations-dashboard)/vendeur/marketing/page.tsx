"use client";
// Hub Marketing — design "Stitch" (maquette stich/novakou_marketing.html
// validée par Lissanon) : KPI compacts, bannière AI Studio gradient vert,
// grille d'outils 4 colonnes. 2026-06-10.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Ticket,
  BadgeCheck,
  GitMerge,
  Filter,
  MailPlus,
  Users,
  Code,
  PlusCircle,
  Megaphone,
  ShoppingCart,
  MousePointerClick,
  Headphones,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  StPageHeader,
  StKpiCompact,
  StHeroGradient,
  StToolCard,
  StButton,
  ST,
} from "@/components/stitch";

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

export default function MarketingPage() {
  const { data: response, isLoading } = useQuery<{ data: MarketingData }>({
    queryKey: ["vendeur-marketing-hub"],
    queryFn: () => fetch("/api/formations/vendeur/marketing").then((r) => r.json()),
    staleTime: 60_000,
  });

  const d = response?.data;

  return (
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Marketing"
          subtitle="Tous vos leviers de croissance, au même endroit."
        />

        {/* ── 3 KPI compacts (maquette) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact
            label="Revenus via promotions (30 j)"
            value={isLoading ? "…" : formatFCFA(d?.summary.totalMarketingRevenue ?? 0)}
            unit="FCFA"
            icon={Ticket}
            tone="green"
          />
          <StKpiCompact
            label="Codes promo actifs"
            value={isLoading ? "…" : String(d?.discountCodes.active ?? 0)}
            icon={BadgeCheck}
            tone="green"
          />
          <StKpiCompact
            label="Conversions totales — tous outils"
            value={isLoading ? "…" : (d?.summary.totalConversions ?? 0).toLocaleString("fr-FR")}
            icon={GitMerge}
            tone="blue"
          />
        </div>

        {/* ── Bannière AI Studio (maquette : gradient vert + cercle déco) ── */}
        <StHeroGradient className="!rounded-[18px] !p-[19px_24px] mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div
              className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,.18)" }}
            >
              <Sparkles size={23} />
            </div>
            <div className="flex-1">
              <div className="text-[15.5px] font-extrabold">AI Studio écrit vos emails de vente</div>
              <div className="text-[12.5px] font-semibold opacity-90 mt-0.5">
                Décrivez votre offre, l&apos;IA rédige un email persuasif en français en 30 secondes —
                prêt à envoyer à votre liste.
              </div>
            </div>
            <StButton variant="white" href="/vendeur/ai-studio" className="flex-shrink-0">
              Essayer AI Studio
            </StButton>
          </div>
        </StHeroGradient>

        {/* ── Grille d'outils 4 colonnes (maquette) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          <StToolCard
            icon={Ticket}
            title="Codes promo"
            description="Réductions en %, montant fixe ou offre limitée dans le temps."
            href="/vendeur/marketing/codes-promo"
            badge={
              !isLoading && (d?.discountCodes.active ?? 0) > 0
                ? `${d?.discountCodes.active} actif${(d?.discountCodes.active ?? 0) > 1 ? "s" : ""}`
                : undefined
            }
          />
          <StToolCard
            icon={Filter}
            title="Tunnels de vente"
            description="Pages de capture et séquences qui convertissent, avec upsells."
            href="/vendeur/marketing/funnels"
          />
          <StToolCard
            icon={MailPlus}
            title="Email marketing"
            description="Séquences automatiques : bienvenue, relances, post-achat."
            href="/vendeur/marketing/sequences"
            badge={
              !isLoading && (d?.sequences.totalEnrolled ?? 0) > 0
                ? `${d?.sequences.totalEnrolled} abonnés`
                : undefined
            }
          />
          <StToolCard
            icon={Users}
            title="Affiliation"
            description="Recrutez des ambassadeurs, payez à la commission."
            href="/vendeur/marketing/affiliation"
            badge={d?.affiliation.hasProgram ? "Actif" : undefined}
          />
          <StToolCard
            icon={Code}
            title="Pixels & tracking"
            description="Meta, TikTok et Google Ads connectés à vos ventes."
            href="/vendeur/marketing/pixels"
            tone="blue"
          />
          <StToolCard
            icon={PlusCircle}
            title="Order bumps"
            description="Offre complémentaire ajoutée au moment du paiement."
            href="/vendeur/marketing/order-bumps"
            tone="blue"
          />
          <StToolCard
            icon={Megaphone}
            title="Campagnes"
            description="Liens UTM trackés pour mesurer chaque source de ventes."
            href="/vendeur/marketing/campagnes"
            tone="blue"
          />
          <StToolCard
            icon={BarChart3}
            title="Analytics marketing"
            description="Revenus, conversions, canaux d'acquisition et géographie de vos ventes."
            href="/vendeur/marketing/analytics"
            tone="blue"
          />
          <StToolCard
            icon={ShoppingCart}
            title="Paniers abandonnés"
            description="Relances automatiques par email pour récupérer les ventes."
            href="/vendeur/abandons"
            tone="amber"
            badge="À relancer"
          />
          <StToolCard
            icon={MousePointerClick}
            title="Popups intelligents"
            description="Exit-intent, scroll ou timer pour capturer des emails."
            href="/vendeur/marketing/popups"
            badge={
              !isLoading && (d?.popups.active ?? 0) > 0
                ? `${d?.popups.conversionRate ?? 0} % conv.`
                : undefined
            }
          />
          <StToolCard
            icon={Headphones}
            title="Support client IA"
            description="Un chatbot qui répond à vos visiteurs 24h/24 sur votre boutique."
            href="/vendeur/support-ia"
            tone="blue"
            badge="IA"
          />
          <StToolCard
            icon={Zap}
            title="Automatisations"
            description="Workflows si-ceci-alors-cela. n8n, Make et Zapier compatibles."
            href="/vendeur/automatisations"
          />
          <StToolCard
            icon={Sparkles}
            title="AI Studio"
            description="Descriptions, emails et pages de vente rédigés par l'IA."
            href="/vendeur/ai-studio"
            badge="IA"
          />
        </div>

        {/* Lien stats global discret */}
        <div className="mt-5 text-[12px] font-bold" style={{ color: ST.textSecondary }}>
          Envie d&apos;une vue d&apos;ensemble ?{" "}
          <Link href="/vendeur/statistiques" className="font-extrabold hover:underline" style={{ color: ST.green }}>
            Voir les statistiques complètes
          </Link>
        </div>
      </main>
    </div>
  );
}
