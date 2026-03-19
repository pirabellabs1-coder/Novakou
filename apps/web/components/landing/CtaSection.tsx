"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function CtaSection() {
  const t = useTranslations("landing.cta_section");

  return (
    <section className="px-4 sm:px-6 lg:px-20 pb-12 sm:pb-20 lg:pb-32">
      <div className="max-w-7xl mx-auto bg-slate-900 border border-primary/30 rounded-2xl sm:rounded-[3rem] p-6 sm:p-12 lg:p-24 text-center space-y-6 sm:space-y-10 relative overflow-hidden shadow-2xl shadow-primary/10">
        {/* Decorative blurs */}
        <div className="absolute -top-24 -right-24 size-96 bg-primary/20 blur-[150px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 size-96 bg-accent/10 blur-[150px] rounded-full"></div>

        <h2 className="text-2xl sm:text-4xl lg:text-7xl font-extrabold text-white max-w-4xl mx-auto leading-[1.1] relative z-10">
          {t("title_1")}{" "}
          <span className="text-primary">{t("title_highlight")}</span> ?
        </h2>

        <p className="text-slate-400 text-sm sm:text-lg lg:text-xl max-w-2xl mx-auto relative z-10 leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10">
          <Link
            href="/explorer"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl transition-all shadow-xl shadow-primary/30 text-center"
          >
            {t("btn_find")}
          </Link>
          <Link
            href="/inscription"
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl transition-all backdrop-blur-sm text-center"
          >
            {t("btn_offer")}
          </Link>
        </div>

        <div className="pt-8 relative z-10">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-4">
            <span className="w-8 h-px bg-slate-800"></span>
            {t("bottom_text")}
            <span className="w-8 h-px bg-slate-800"></span>
          </p>
        </div>
      </div>
    </section>
  );
}
