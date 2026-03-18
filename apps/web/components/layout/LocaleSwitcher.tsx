"use client";

import { useLocale } from "next-intl";
import { useChangeLocale, LOCALES, type Locale } from "@/store/locale";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  // Utilise next-intl comme source de vérité (synchronisé avec le serveur)
  const currentLocale = useLocale();
  const changeLocale = useChangeLocale();

  return (
    <div className={cn("flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5", className)}>
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => {
            if (l.code !== currentLocale) {
              changeLocale(l.code as Locale);
            }
          }}
          className={cn(
            "px-2.5 py-1.5 text-xs font-bold rounded-md transition-all",
            currentLocale === l.code
              ? "bg-primary text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-primary"
          )}
          title={l.label}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
