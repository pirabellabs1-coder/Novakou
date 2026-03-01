"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrencyStore, CURRENCIES, type Currency } from "@/store/currency";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Explorer", href: "/explorer" },
  { label: "Projets", href: "/projets" },
  { label: "Comment ça marche", href: "/comment-ca-marche" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const { currency, setCurrency } = useCurrencyStore();

  const currentCurrency = CURRENCIES.find((c) => c.code === currency);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-primary rtl:flex-row-reverse"
          >
            <Zap className="h-7 w-7 fill-primary text-primary" />
            <span className="text-xl font-extrabold tracking-tight text-gray-900">
              FreelanceHigh
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex flex-1 justify-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center gap-3 rtl:flex-row-reverse">
            {/* Currency selector */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-primary transition-all"
              >
                <span>{currentCurrency?.symbol}</span>
                <span>{currency}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {currencyOpen && (
                <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-36 rounded-xl border border-gray-200 bg-white shadow-xl z-50 p-1">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code as Currency);
                        setCurrencyOpen(false);
                      }}
                      className={cn(
                        "w-full text-left rtl:text-right px-3 py-2 text-xs font-bold rounded-lg hover:bg-primary/10 hover:text-primary transition-colors",
                        currency === c.code && "text-primary bg-primary/5"
                      )}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/connexion"
              className="text-sm font-bold text-gray-700 hover:text-primary transition-colors px-3 py-2"
            >
              Connexion
            </Link>
            <Button asChild size="default">
              <Link href="/inscription">Inscription</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            {/* Currency mobile */}
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code as Currency)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg border transition-colors",
                    currency === c.code
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                  )}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
            <Link
              href="/connexion"
              className="block text-center text-sm font-bold text-gray-700 hover:text-primary py-2"
              onClick={() => setMobileOpen(false)}
            >
              Connexion
            </Link>
            <Button asChild className="w-full">
              <Link href="/inscription" onClick={() => setMobileOpen(false)}>
                Inscription
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
