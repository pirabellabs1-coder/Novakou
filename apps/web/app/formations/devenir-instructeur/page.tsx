"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star, ChevronRight } from "lucide-react";

export default function DevenirInstructeurPage() {
  const t = useTranslations("instructor_landing");
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [platformStats, setPlatformStats] = useState<{ instructeurs: number; apprenants: number } | null>(null);
  useEffect(() => {
    fetch("/api/formations/stats").then((r) => r.json()).then(setPlatformStats).catch(() => {});
  }, []);

  const fmtStat = (n: number): string => {
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
    if (n > 0) return `${n}+`;
    return "0";
  };

  const goToForm = () => {
    if (session?.user) {
      // Already logged in — redirect to instructor dashboard
      router.push("/formations/instructeur/dashboard");
    } else {
      // Not logged in — redirect to inscription with instructor role pre-selected
      router.push("/formations/inscription?role=instructeur");
    }
  };

  // ── FAQ data ──
  const FAQ_ITEMS = Array.from({ length: 8 }, (_, i) => ({
    q: t(`faq_${i + 1}_q`),
    a: t(`faq_${i + 1}_a`),
  }));

  // ── Landing page ──
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative px-6 lg:px-20 pt-12 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 min-h-[560px] flex flex-col justify-center px-8 lg:px-16 py-12">
            {/* Decorative blurs */}
            <div className="absolute -top-24 -right-24 size-96 bg-primary/20 blur-[150px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-accent/10 blur-[150px] rounded-full" />

            <div className="relative z-10 max-w-3xl space-y-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider border border-accent/30">
                {t("hero_badge")}
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
                {t("hero_title_1")}<br />
                <span className="text-primary">{t("hero_title_2")}</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-xl leading-relaxed">
                {t("hero_subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={goToForm}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all text-sm flex items-center gap-2"
                >
                  {t("hero_cta")}
                  <ChevronRight className="w-5 h-5" />
                </button>
                <Link
                  href="/formations"
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl font-bold transition-all backdrop-blur-sm text-sm text-center"
                >
                  {t("hero_link")} →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-5xl mx-auto -mt-8 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          {[
            { value: platformStats ? fmtStat(platformStats.instructeurs) : "—", label: t("stat_instructors") },
            { value: platformStats ? fmtStat(platformStats.apprenants) : "—", label: t("stat_learners") },
            { value: "70%", label: t("stat_revenue") },
            { value: "15+", label: t("stat_countries") },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-extrabold text-primary mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AVANTAGES ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("benefits_title")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "💰", title: t("benefit_revenue_title"), desc: t("benefit_revenue_desc"), color: "bg-green-500/10 text-green-500" },
              { icon: "🌍", title: t("benefit_audience_title"), desc: t("benefit_audience_desc"), color: "bg-blue-500/10 text-blue-500" },
              { icon: "📈", title: t("benefit_passive_title"), desc: t("benefit_passive_desc"), color: "bg-purple-500/10 text-purple-500" },
              { icon: "🛠️", title: t("benefit_tools_title"), desc: t("benefit_tools_desc"), color: "bg-orange-500/10 text-orange-500" },
            ].map((b) => (
              <div key={b.title} className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${b.color} flex items-center justify-center mb-4 text-2xl`}>
                  {b.icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS PLATEFORME ──────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("features_title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🎬", title: t("feature_builder_title"), desc: t("feature_builder_desc") },
              { icon: "📊", title: t("feature_analytics_title"), desc: t("feature_analytics_desc") },
              { icon: "🔒", title: t("feature_payments_title"), desc: t("feature_payments_desc") },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("process_title")}
          </h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 hidden lg:block" />
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-full bg-primary text-white font-black text-xl flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg shadow-primary/30">
                    {t(`step_${i}_number`)}
                  </div>
                  <div className="flex-1 pt-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{t(`step_${i}_title`)}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{t(`step_${i}_desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARAISON PLATEFORME ─────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("comparison_title")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-4 px-4 text-slate-500 dark:text-slate-400 font-semibold">{t("comparison_criteria")}</th>
                  <th className="text-center py-4 px-4 text-primary font-bold">FreelanceHigh</th>
                  <th className="text-center py-4 px-4 text-slate-500 dark:text-slate-400 font-semibold">Udemy</th>
                  <th className="text-center py-4 px-4 text-slate-500 dark:text-slate-400 font-semibold">Teachable</th>
                  <th className="text-center py-4 px-4 text-slate-500 dark:text-slate-400 font-semibold">Skillshare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { label: t("comparison_commission"), fh: t("comparison_fh_commission"), udemy: t("comparison_udemy_commission"), teachable: t("comparison_teachable_commission"), skillshare: t("comparison_skillshare_commission") },
                  { label: t("comparison_africa"), fh: "✅", udemy: "❌", teachable: "❌", skillshare: "❌" },
                  { label: t("comparison_mobile_money"), fh: "✅", udemy: "❌", teachable: "❌", skillshare: "❌" },
                  { label: t("comparison_cohorts"), fh: "✅", udemy: "❌", teachable: "✅", skillshare: "❌" },
                  { label: t("comparison_products"), fh: "✅", udemy: "❌", teachable: "✅", skillshare: "❌" },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{row.label}</td>
                    <td className="py-3 px-4 text-center font-bold text-primary">{row.fh}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.udemy}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.teachable}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.skillshare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("testimonials_title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4 italic">
                  &quot;{t(`testimonial_${i}_text`)}&quot;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{t(`testimonial_${i}_name`)}</p>
                    <p className="text-xs text-slate-500">{t(`testimonial_${i}_country`)}</p>
                  </div>
                  <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-lg">
                    {t(`testimonial_${i}_revenue`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ INSTRUCTEURS ────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">
            {t("faq_title")}
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? "bg-white dark:bg-slate-900 dark:bg-slate-800 border-primary/30"
                      : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-semibold text-base text-slate-900 dark:text-white leading-snug">{item.q}</span>
                    <span
                      className={`text-xl text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
                    >
                      ▾
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────── */}
      <section className="px-6 lg:px-20 py-20">
        <div className="max-w-7xl mx-auto bg-slate-900 border border-primary/30 rounded-[3rem] p-12 lg:p-24 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-primary/10">
          <div className="absolute -top-24 -right-24 size-96 bg-primary/20 blur-[150px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 size-96 bg-accent/10 blur-[150px] rounded-full" />

          <h2 className="text-3xl md:text-5xl font-extrabold text-white max-w-3xl mx-auto leading-[1.1] relative z-10">
            {t("cta_title")}
          </h2>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto relative z-10 leading-relaxed">
            {t("cta_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button
              onClick={goToForm}
              className="bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
            >
              {t("cta_button")}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 relative z-10">
            {t("cta_perks")}
          </p>
        </div>
      </section>
    </div>
  );
}
