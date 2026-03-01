export type Currency = "EUR" | "FCFA" | "USD" | "GBP" | "MAD";

export type Locale = "fr" | "en" | "ar";

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface CurrencyOption {
  code: Currency;
  symbol: string;
  label: string;
  rate: number; // relative to EUR
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "EUR", symbol: "€", label: "Euro", rate: 1 },
  { code: "FCFA", symbol: "FCFA", label: "Franc CFA", rate: 655.957 },
  { code: "USD", symbol: "$", label: "Dollar US", rate: 1.08 },
  { code: "GBP", symbol: "£", label: "Livre sterling", rate: 0.85 },
  { code: "MAD", symbol: "MAD", label: "Dirham marocain", rate: 10.95 },
];

export function formatCurrency(amountEur: number, currency: Currency): string {
  const option = CURRENCIES.find((c) => c.code === currency);
  if (!option) return `€${amountEur}`;
  const converted = amountEur * option.rate;
  if (currency === "FCFA") {
    return `${Math.round(converted).toLocaleString("fr-FR")} FCFA`;
  }
  return `${option.symbol}${converted.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
