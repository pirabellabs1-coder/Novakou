/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCurrencyStore } from "@/store/currency";
import { BadgeDisplay } from "@/components/ui/BadgeDisplay";

interface TopFreelance {
  id: string;
  username: string;
  name: string;
  title: string;
  rating: number;
  skills: string[];
  dailyRateEur: number;
  completedOrders: number;
  reviewCount: number;
  badge: string;
  badges?: string[];
  image: string;
  location: string;
}

export function TopFreelancesSection() {
  const { format } = useCurrencyStore();
  const [freelances, setFreelances] = useState<TopFreelance[]>([]);
  const t = useTranslations("landing.top_freelances");

  useEffect(() => {
    fetch("/api/public/top-freelances?limit=3")
      .then((res) => (res.ok ? res.json() : { freelances: [] }))
      .then((data) => {
        if (Array.isArray(data.freelances)) setFreelances(data.freelances);
      })
      .catch(() => {});
  }, []);

  if (!freelances || freelances.length === 0) return null;

  return (
    <section className="bg-primary/5 dark:bg-primary/5 py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        {/* Header centre */}
        <div className="text-center space-y-3 sm:space-y-6 mb-10 sm:mb-16 lg:mb-20">
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg">
            {t("subtitle")}
          </p>
        </div>

        {/* Grid cards verticales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {freelances.map((f) => (
            <Link
              key={f.id}
              href={`/freelances/${f.username}`}
              className="group relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl hover:shadow-2xl border border-slate-200/60 dark:border-slate-700/60 hover:-translate-y-2 transition-all duration-300"
            >
              {/* Header gradient (couleurs du site) */}
              <div className="relative h-28 sm:h-32 rounded-t-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-500 to-primary/80" />
                {/* Motif decoratif */}
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
                {/* Badge — fond blanc opaque pour contraster avec le gradient vert */}
                {(f.badges && f.badges.length > 0) || f.badge ? (
                  <div className="absolute top-3 right-3 z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    {f.badges?.[0] || f.badge}
                  </div>
                ) : null}
                {/* Location */}
                {f.location && (
                  <div className="absolute top-3 left-3 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/30">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {f.location}
                  </div>
                )}
              </div>

              {/* Avatar circulaire — en dehors du overflow-hidden */}
              <div className="flex justify-center -mt-14 sm:-mt-16 relative z-10">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden bg-white dark:bg-slate-800">
                  {f.image ? (
                    <img
                      alt={f.name}
                      className="w-full h-full object-cover"
                      src={f.image}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-emerald-500/10">
                      <span className="text-3xl sm:text-4xl font-extrabold text-primary/70">
                        {(f.name || "?").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-5 pb-6 pt-3 sm:px-7 sm:pb-7 sm:pt-4 text-center">
                <h4 className="text-lg sm:text-xl font-bold mb-0.5 truncate text-slate-900 dark:text-white">{f.name}</h4>
                <p className="text-xs sm:text-sm text-primary font-semibold truncate mb-4">{f.title}</p>

                {/* Stats: ventes + avis (nombre seulement) */}
                <div className="flex items-center justify-center gap-5 mb-5 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-lg text-primary">shopping_cart</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{f.completedOrders ?? 0}</span>
                    <span>vente{(f.completedOrders ?? 0) !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-lg text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{f.reviewCount ?? 0}</span>
                    <span>avis</span>
                  </div>
                </div>

                {(f.skills || []).length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-5">
                    {(f.skills || []).map((skill) => (
                      <span
                        key={skill}
                        className="bg-primary/5 dark:bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tarif + bouton centre */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                  {(f.dailyRateEur ?? 0) > 0 && (
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t("daily_rate")}</span>
                      <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                        {format(f.dailyRateEur)} <span className="text-sm font-normal text-slate-400">{t("per_day")}</span>
                      </div>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl group-hover:shadow-lg group-hover:shadow-primary/25 transition-all">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Voir le profil
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
