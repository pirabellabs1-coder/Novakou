/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCurrencyStore } from "@/store/currency";
import { InlineBadge } from "@/components/ui/BadgeDisplay";
import { formatServiceTitle } from "@/lib/format-service-title";

interface TopService {
  id: string;
  slug: string;
  title: string;
  category: string;
  priceEur: number;
  rating: number;
  reviews: number;
  orderCount: number;
  image: string;
  freelancer: string;
  vendorBadges?: string[];
}

export function PopularServicesSection() {
  const { format } = useCurrencyStore();
  const [services, setServices] = useState<TopService[]>([]);
  const t = useTranslations("landing.popular_services");

  useEffect(() => {
    fetch("/api/public/top-services?limit=6")
      .then((res) => (res.ok ? res.json() : { services: [] }))
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .catch(() => {});
  }, []);

  if (services.length === 0) return null;

  return (
    <section className="py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 lg:mb-16 gap-3 sm:gap-4">
          <div className="space-y-2 sm:space-y-4">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">{t("title")}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base lg:text-lg">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/explorer"
            className="hidden sm:flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all flex-shrink-0"
          >
            {t("see_all")} <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-700">
                {service.image ? (
                  <img
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={service.image}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  {service.category}
                </span>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {formatServiceTitle(service.title)}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  {service.freelancer}
                  {service.vendorBadges && service.vendorBadges.length > 0 && (
                    <InlineBadge badge={service.vendorBadges[0]} />
                  )}
                </p>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-accent text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="text-sm font-bold">{service.rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">({service.reviews})</span>
                  </div>
                  {service.orderCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-emerald-500 text-sm">shopping_bag</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{service.orderCount} {service.orderCount > 1 ? "ventes" : "vente"}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{t("from")}</span>
                    <span className="text-lg font-extrabold text-primary">{format(service.priceEur)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
