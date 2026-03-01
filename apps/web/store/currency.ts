"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "EUR" | "FCFA" | "USD" | "GBP" | "MAD";

export const CURRENCIES: { code: Currency; symbol: string; label: string; rate: number }[] = [
  { code: "EUR", symbol: "€", label: "Euro", rate: 1 },
  { code: "FCFA", symbol: "FCFA", label: "Franc CFA", rate: 655.957 },
  { code: "USD", symbol: "$", label: "Dollar US", rate: 1.08 },
  { code: "GBP", symbol: "£", label: "Livre Sterling", rate: 0.85 },
  { code: "MAD", symbol: "MAD", label: "Dirham Marocain", rate: 10.95 },
];

export function formatCurrency(amountEur: number, currency: Currency): string {
  const cur = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const converted = amountEur * cur.rate;
  if (currency === "FCFA") return `${Math.round(converted).toLocaleString("fr-FR")} FCFA`;
  return `${cur.symbol}${converted.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  format: (amountEur: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "EUR",
      setCurrency: (currency: Currency) => set({ currency }),
      format: (amountEur: number) => formatCurrency(amountEur, get().currency),
    }),
    { name: "freelancehigh-currency" }
  )
);
