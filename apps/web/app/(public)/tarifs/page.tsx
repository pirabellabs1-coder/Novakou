"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrencyStore } from "@/store/currency";
import { cn } from "@/lib/utils";

export default function TarifsPage() {
  const t = useTranslations("pricing");
  const [annual, setAnnual] = useState(false);
  const { format } = useCurrencyStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const PLANS = [
    { key: "free", price: 0, commission: "12%", services: "7", candidatures: t("plan_free_candidatures"), boost: t("no"), certif: false, api: false, color: "border-slate-600" },
    { key: "pro", price: 15, commission: "1\u20AC/vente", services: t("unlimited"), candidatures: t("plan_pro_candidatures"), boost: t("plan_pro_boost"), certif: true, api: false, color: "border-primary", popular: true },
    { key: "business", price: 45, commission: "1\u20AC/vente", services: t("unlimited"), candidatures: t("unlimited"), boost: t("plan_business_boost"), certif: true, api: true, color: "border-blue-500" },
    { key: "agency", price: 99, commission: "1\u20AC/vente", services: t("unlimited"), candidatures: t("unlimited"), boost: t("plan_agency_boost"), certif: true, api: true, color: "border-emerald-500" },
  ];

  const FAQ = [
    { q: t("faq_change_plan_q"), a: t("faq_change_plan_a") },
    { q: t("faq_payment_methods_q"), a: t("faq_payment_methods_a") },
    { q: t("faq_commitment_q"), a: t("faq_commitment_a") },
    { q: t("faq_commission_q"), a: t("faq_commission_a") },
    { q: t("faq_agency_members_q"), a: t("faq_agency_members_a") },
  ];

  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={cn("text-sm font-semibold", !annual ? "text-white" : "text-slate-500")}>{t("monthly")}</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn("w-14 h-7 rounded-full transition-colors relative", annual ? "bg-primary" : "bg-slate-600")}
            >
              <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all", annual ? "left-8" : "left-1")} />
            </button>
            <span className={cn("text-sm font-semibold", annual ? "text-white" : "text-slate-500")}>
              {t("annual")} <span className="text-primary text-xs font-bold ml-1">-20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-20">
          {PLANS.map(plan => {
            const price = annual ? Math.round(plan.price * 0.8 * 12) : plan.price;
            return (
              <div key={plan.key} className={cn("relative bg-neutral-dark rounded-2xl border-2 p-6 flex flex-col", plan.color, plan.popular && "ring-2 ring-primary/30")}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    {t("popular")}
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{t(`plan_${plan.key}`)}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">{format(price)}</span>
                  <span className="text-slate-500 text-sm">/{annual ? t("year") : t("month")}</span>
                </div>
                <p className="text-sm text-primary font-bold mb-6">{t("commission")}: {plan.commission}</p>
                <ul className="space-y-3 flex-1 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-300"><span className="material-symbols-outlined text-primary text-sm">check</span>{plan.services} {t("active_services")}</li>
                  <li className="flex items-center gap-2 text-sm text-slate-300"><span className="material-symbols-outlined text-primary text-sm">check</span>{plan.candidatures} {t("applications")}</li>
                  <li className="flex items-center gap-2 text-sm text-slate-300"><span className="material-symbols-outlined text-primary text-sm">check</span>{t("boost")}: {plan.boost}</li>
                  <li className={cn("flex items-center gap-2 text-sm", plan.certif ? "text-slate-300" : "text-slate-600")}><span className="material-symbols-outlined text-sm">{plan.certif ? "check" : "close"}</span>{t("ai_certification")}</li>
                  <li className={cn("flex items-center gap-2 text-sm", plan.api ? "text-slate-300" : "text-slate-600")}><span className="material-symbols-outlined text-sm">{plan.api ? "check" : "close"}</span>{t("api_keys")}</li>
                </ul>
                <button className={cn("w-full py-3 rounded-xl text-sm font-bold transition-colors", plan.popular ? "bg-primary text-white hover:bg-primary/90" : "bg-border-dark text-white hover:bg-border-dark/80")}>
                  {plan.price === 0 ? t("start_free") : t("choose_plan")}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">{t("faq_title")}</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-white text-sm">{item.q}</span>
                  <span className="material-symbols-outlined text-slate-400">{openFaq === i ? "expand_less" : "expand_more"}</span>
                </button>
                {openFaq === i && <p className="px-5 pb-5 text-sm text-slate-400">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
