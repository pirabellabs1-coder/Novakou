"use client";

import { useTranslations } from "next-intl";

const TRUST_ICONS = ["lock", "verified", "support_agent", "replay"];

export function TrustSection() {
  const t = useTranslations("landing.trust");

  return (
    <section className="py-12 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4">
            {t("title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {TRUST_ICONS.map((icon) => (
            <div key={icon} className="text-center space-y-4">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
              </div>
              <h4 className="font-bold text-lg">{t(`items.${icon}.title`)}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(`items.${icon}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
