"use client";

import { create } from "zustand";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { setLocaleCookie } from "@/lib/actions/locale";

export type Locale = "fr" | "en";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("locale="));
  const val = match?.split("=")[1];
  return val === "en" ? "en" : "fr";
}

export const useLocaleStore = create<LocaleState>()((set) => ({
  locale: readLocaleCookie(),
  setLocale: (locale: Locale) => {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    set({ locale });
  },
}));

export function useChangeLocale() {
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);

  return useCallback(
    async (newLocale: Locale) => {
      // 1. Cookie client en premier (lecture immédiate par Zustand au re-render)
      document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      // 2. Zustand state (UI instantanée)
      setLocale(newLocale);
      // 3. Cookie serveur (garantit la bonne lecture au prochain SSR)
      await setLocaleCookie(newLocale);
      // 4. Refresh — le serveur lira le bon cookie
      router.refresh();
    },
    [setLocale, router]
  );
}
