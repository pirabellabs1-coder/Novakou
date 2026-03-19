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
        if (data.freelances) setFreelances(data.freelances);
      })
      .catch(() => {});
  }, []);

  if (freelances.length === 0) return null;

  return (
    <section className="bg-primary/5 dark:bg-primary/5 py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-20">
      <div className="max-w-7xl mx-auto">
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
              className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xl border border-primary/5 hover:-translate-y-2 transition-all duration-300"
            >
              {/* Image / Placeholder */}
              <div className="relative h-56 bg-gradient-to-br from-primary/20 to-primary/5">
                {f.image ? (
                  <img
                    alt={f.name}
                    className="w-full h-full object-cover"
                    src={f.image}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary/30">person</span>
                  </div>
                )}
                {f.location && (
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {f.location}
                  </div>
                )}
                {f.badges && f.badges.length > 0 ? (
                  <div className="absolute top-4 right-4">
                    <BadgeDisplay badges={f.badges} size="sm" maxDisplay={2} />
                  </div>
                ) : f.badge ? (
                  <div className="absolute top-4 right-4 bg-accent text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    {f.badge}
                  </div>
                ) : null}
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-bold mb-1">{f.name}</h4>
                    <p className="text-sm text-primary font-bold uppercase tracking-wider">{f.title}</p>
                  </div>
                  {f.rating > 0 && (
                    <div className="flex items-center gap-1 bg-accent/10 text-accent px-3 py-1.5 rounded-xl">
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-base font-extrabold">{f.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {f.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {f.skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-slate-100 dark:bg-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {f.dailyRateEur > 0 && (
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-[10px] font-bold uppercase">{t("daily_rate")}</span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {format(f.dailyRateEur)} <span className="text-sm font-normal text-slate-500">{t("per_day")}</span>
                      </span>
                    </div>
                    <span className="bg-primary/10 text-primary hover:bg-primary hover:text-white p-3 rounded-xl transition-all">
                      <span className="material-symbols-outlined">visibility</span>
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
