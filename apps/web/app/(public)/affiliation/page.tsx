"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Tier {
  name: string;
  icon: string;
  rangeKey: string;
  min: number;
  max: number;
  commission: number;
  gradient: string;
  iconBg: string;
  featuresKeys: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTierForReferrals(count: number, tiers: Tier[]): Tier {
  return (
    tiers.find((t) => count >= t.min && count <= t.max) ?? tiers[0]
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AffiliationPage() {
  const t = useTranslations("affiliation");

  const STEPS = [
    { icon: "share", titleKey: "step1_title", descKey: "step1_desc" },
    { icon: "person_add", titleKey: "step2_title", descKey: "step2_desc" },
    { icon: "payments", titleKey: "step3_title", descKey: "step3_desc" },
  ];

  const TIERS: Tier[] = [
    {
      name: "Bronze",
      icon: "military_tech",
      rangeKey: "tier_bronze_range",
      min: 1,
      max: 5,
      commission: 10,
      gradient: "from-amber-700 to-amber-900",
      iconBg: "bg-amber-700/20 text-amber-500",
      featuresKeys: ["tier_bronze_feat1", "tier_bronze_feat2", "tier_bronze_feat3"],
    },
    {
      name: "Silver",
      icon: "workspace_premium",
      rangeKey: "tier_silver_range",
      min: 6,
      max: 20,
      commission: 15,
      gradient: "from-slate-400 to-slate-600",
      iconBg: "bg-slate-400/20 text-slate-300",
      featuresKeys: ["tier_silver_feat1", "tier_silver_feat2", "tier_silver_feat3", "tier_silver_feat4"],
    },
    {
      name: "Gold",
      icon: "emoji_events",
      rangeKey: "tier_gold_range",
      min: 21,
      max: 50,
      commission: 20,
      gradient: "from-accent to-yellow-600",
      iconBg: "bg-accent/20 text-accent",
      featuresKeys: ["tier_gold_feat1", "tier_gold_feat2", "tier_gold_feat3", "tier_gold_feat4"],
    },
    {
      name: "Platinum",
      icon: "diamond",
      rangeKey: "tier_platinum_range",
      min: 51,
      max: Infinity,
      commission: 25,
      gradient: "from-primary to-emerald-400",
      iconBg: "bg-primary/20 text-primary",
      featuresKeys: ["tier_platinum_feat1", "tier_platinum_feat2", "tier_platinum_feat3", "tier_platinum_feat4"],
    },
  ];

  const TESTIMONIALS = [
    { quoteKey: "testimonial1_quote", name: "Marie K.", tier: "Gold", earnings: "\u20AC500/mois" },
    { quoteKey: "testimonial2_quote", name: "Abdoulaye D.", tier: "Silver", earnings: "\u20AC280/mois" },
    { quoteKey: "testimonial3_quote", name: "Sophie L.", tier: "Platinum", earnings: "\u20AC1 200/mois" },
  ];

  const FAQ_ITEMS = [
    { qKey: "faq1_q", aKey: "faq1_a" },
    { qKey: "faq2_q", aKey: "faq2_a" },
    { qKey: "faq3_q", aKey: "faq3_a" },
    { qKey: "faq4_q", aKey: "faq4_a" },
    { qKey: "faq5_q", aKey: "faq5_a" },
  ];

  const [referrals, setReferrals] = useState(10);
  const [avgRevenue, setAvgRevenue] = useState(150);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const calculatedTier = useMemo(
    () => getTierForReferrals(referrals, TIERS),
    [referrals],
  );

  const monthlyEarnings = useMemo(
    () => Math.round(referrals * avgRevenue * (calculatedTier.commission / 100)),
    [referrals, avgRevenue, calculatedTier],
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative px-6 lg:px-8 pt-16 pb-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 lg:px-16 py-20 lg:py-28 text-center">
            {/* Decorative blurs */}
            <div className="absolute -top-32 -right-32 size-[500px] bg-primary/20 blur-[180px] rounded-full" />
            <div className="absolute -bottom-32 -left-32 size-[500px] bg-accent/10 blur-[180px] rounded-full" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider border border-accent/30">
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                {t("hero_badge")}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                {t("hero_title")}{" "}
                <span className="text-primary">FreelanceHigh</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {t("hero_subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white rounded-2xl px-10 py-5 text-lg font-bold shadow-xl shadow-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  {t("hero_cta_signup")}
                </Link>
                <a
                  href="#comment-ca-marche"
                  className="inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl px-10 py-5 text-lg font-bold transition-all backdrop-blur-sm"
                >
                  {t("hero_cta_learn_more")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
      {/* ============================================================ */}
      <section id="comment-ca-marche" className="py-24 px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {t("how_title_prefix")} <span className="text-primary">{t("how_title_highlight")}</span> ?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              {t("how_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.titleKey}
                className="relative bg-white dark:bg-neutral-dark p-10 rounded-3xl border border-slate-200 dark:border-border-dark text-center space-y-6 hover:shadow-xl transition-shadow"
              >
                {/* Step number */}
                <span className="absolute top-6 right-6 text-5xl font-extrabold text-slate-100 dark:text-slate-800 select-none">
                  {i + 1}
                </span>

                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <span className="material-symbols-outlined text-3xl">
                    {step.icon}
                  </span>
                </div>

                <h4 className="text-xl font-bold">{t(step.titleKey)}</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TIERS                                                       */}
      {/* ============================================================ */}
      <section className="py-24 px-6 lg:px-8 bg-primary/5 dark:bg-primary/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {t("tiers_title_prefix")} <span className="text-accent">{t("tiers_title_highlight")}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              {t("tiers_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="bg-white dark:bg-neutral-dark rounded-3xl border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {/* Gradient header */}
                <div
                  className={cn(
                    "bg-gradient-to-br p-6 flex items-center gap-4",
                    tier.gradient,
                  )}
                >
                  <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-3xl">
                      {tier.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-white">
                      {tier.name}
                    </h4>
                    <p className="text-white/70 text-sm font-semibold">
                      {t(tier.rangeKey)}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                  <div className="text-center">
                    <span className="text-4xl font-extrabold text-primary">
                      {tier.commission}%
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                      {t("of_commission")}
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {tier.featuresKeys.map((featureKey) => (
                      <li
                        key={featureKey}
                        className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-primary text-lg">
                          check_circle
                        </span>
                        {t(featureKey)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/inscription"
                    className="block text-center text-sm font-bold text-primary hover:text-primary/80 transition-colors pt-2"
                  >
                    {t("learn_more")} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  EARNINGS CALCULATOR                                         */}
      {/* ============================================================ */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {t("calc_title_prefix")} <span className="text-primary">{t("calc_title_highlight")}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              {t("calc_subtitle")}
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-dark rounded-3xl border border-slate-200 dark:border-border-dark p-8 lg:p-12 shadow-xl space-y-10">
            {/* Slider: Nombre de filleuls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-bold text-lg">
                  {t("calc_referrals_label")}
                </label>
                <span className="text-2xl font-extrabold text-primary">
                  {referrals}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={referrals}
                onChange={(e) => setReferrals(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-primary"
              />
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>1</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Slider: Revenu moyen par filleul */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-bold text-lg">
                  {t("calc_avg_revenue_label")}
                </label>
                <span className="text-2xl font-extrabold text-primary">
                  {avgRevenue}&nbsp;&euro;
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={avgRevenue}
                onChange={(e) => setAvgRevenue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-primary"
              />
              <div className="flex justify-between text-xs text-slate-500 font-semibold">
                <span>50 &euro;</span>
                <span>150 &euro;</span>
                <span>250 &euro;</span>
                <span>350 &euro;</span>
                <span>500 &euro;</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-border-dark" />

            {/* Result */}
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                {t("calc_result_label")}
              </p>

              <div className="relative inline-block">
                <p
                  className="text-6xl sm:text-7xl font-extrabold text-primary transition-all duration-300"
                  key={monthlyEarnings}
                >
                  {monthlyEarnings.toLocaleString("fr-FR")}&nbsp;&euro;
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold",
                    calculatedTier.iconBg,
                  )}
                >
                  <span className="material-symbols-outlined text-base">
                    {calculatedTier.icon}
                  </span>
                  {t("level")} {calculatedTier.name}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  {calculatedTier.commission}% {t("of_commission")}
                </span>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed pt-2">
                {t("calc_estimate_note", { referrals, avgRevenue, commission: calculatedTier.commission })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                */}
      {/* ============================================================ */}
      <section className="py-24 px-6 lg:px-8 bg-primary/5 dark:bg-primary/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {t("testimonials_title_prefix")} <span className="text-primary">{t("testimonials_title_highlight")}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              {t("testimonials_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((item) => (
              <div
                key={item.name}
                className="bg-white dark:bg-neutral-dark p-10 rounded-3xl border border-slate-200 dark:border-border-dark shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-accent text-2xl">
                    format_quote
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-8 italic">
                  &ldquo;{t(item.quoteKey)}&rdquo;
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg">{item.name}</p>
                    <p className="text-sm text-slate-500">{t("affiliate")} {item.tier}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    <span className="material-symbols-outlined text-base">
                      payments
                    </span>
                    {item.earnings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQ                                                         */}
      {/* ============================================================ */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {t("faq_title_prefix")} <span className="text-primary">{t("faq_title_highlight")}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-dark rounded-2xl border border-slate-200 dark:border-border-dark overflow-hidden transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-lg pr-4">
                    {t(item.qKey)}
                  </span>
                  <span
                    className={cn(
                      "material-symbols-outlined text-primary transition-transform flex-shrink-0",
                      openFaq === i && "rotate-180",
                    )}
                  >
                    expand_more
                  </span>
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openFaq === i ? "max-h-60 pb-6" : "max-h-0",
                  )}
                >
                  <p className="px-6 text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t(item.aKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA BOTTOM                                                  */}
      {/* ============================================================ */}
      <section className="px-6 lg:px-8 pb-32">
        <div className="max-w-[1440px] mx-auto bg-slate-900 border border-primary/30 rounded-[3rem] p-12 lg:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-primary/10">
          {/* Decorative blurs */}
          <div className="absolute -top-24 -right-24 size-96 bg-primary/20 blur-[150px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 size-96 bg-accent/10 blur-[150px] rounded-full" />

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white max-w-4xl mx-auto leading-[1.1] relative z-10">
            {t("cta_title_prefix")}{" "}
            <span className="text-primary">{t("cta_title_highlight")}</span>
          </h2>

          <p className="text-slate-400 text-xl max-w-2xl mx-auto relative z-10 leading-relaxed">
            {t("cta_subtitle")}
          </p>

          <div className="relative z-10">
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all shadow-xl shadow-primary/30"
            >
              <span className="material-symbols-outlined">person_add</span>
              {t("hero_cta_signup")}
            </Link>
          </div>

          <div className="pt-4 relative z-10">
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-4">
              <span className="w-8 h-px bg-slate-800" />
              {t("cta_footer")}
              <span className="w-8 h-px bg-slate-800" />
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
