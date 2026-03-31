"use client";

import { Shield, Award, Lock, Infinity } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TrustBar() {
  const t = useTranslations("formations");

  const items = [
    { icon: Shield, label: t("trust_guarantee"), color: "text-green-500" },
    { icon: Award, label: t("trust_certificate"), color: "text-blue-500" },
    { icon: Lock, label: t("trust_secure"), color: "text-amber-500" },
    { icon: Infinity, label: t("trust_lifetime"), color: "text-purple-500" },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700 py-4">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
            <span className="font-medium whitespace-nowrap">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
