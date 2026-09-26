"use client";

import { useQuery } from "@tanstack/react-query";
import { Percent, Timer, Users, Wallet, type LucideIcon } from "lucide-react";
import { formaterNombre } from "@/components/home/reveal-compteurs";

type PublicStats = {
  totalUsers: number;
  totalInstructors: number;
  totalLearners: number;
  totalFormations: number;
  totalProducts: number;
  totalProductsCount: number;
  totalSales: number;
  totalCountries: number;
};

/**
 * Bandeau de chiffres de la page Affiliation : les deux premiers viennent
 * de /api/formations/public/stats (TanStack Query, même clé `public-stats`
 * qu'avant), les deux autres sont les constantes du programme.
 */
export function StatsAffiliation({ commissionPct, cookieDays }: { commissionPct: number; cookieDays: number }) {
  const { data, isPending, isError } = useQuery<{ data: PublicStats }>({
    queryKey: ["public-stats"],
    queryFn: () => fetch("/api/formations/public/stats").then((r) => r.json()),
    staleTime: 60_000,
  });
  const s = data?.data;

  const cartes: { Icon: LucideIcon; label: string; valeur: string; sub?: string }[] = [
    {
      Icon: Users,
      label: "Affiliés actifs",
      valeur: isPending ? "…" : isError || !s ? "—" : s.totalUsers > 0 ? formaterNombre(s.totalUsers) : "Soyez le premier",
    },
    {
      Icon: Wallet,
      label: "Commissions versées",
      valeur: isPending ? "…" : isError || !s ? "—" : s.totalSales > 0 ? `${formaterNombre(s.totalSales * 10000)} FCFA` : "Démarrage",
      sub: s && s.totalSales > 0 ? `${formaterNombre(s.totalSales)} ventes` : "0 vente",
    },
    { Icon: Percent, label: "Commission", valeur: `${commissionPct} %`, sub: "sur chaque vente" },
    { Icon: Timer, label: "Durée du cookie", valeur: `${cookieDays} jours`, sub: "par clic" },
  ];

  return (
    <div className="nkp-kpis nkp-kpis--band nkp-kpis--1col-sm" aria-busy={isPending}>
      {cartes.map((c) => (
        <div key={c.label} className="nkp-kpi nkp-reveal flex items-start gap-4">
          <span className="nkp-ic" aria-hidden="true">
            <c.Icon strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <div className="n !text-[1.35rem] break-words">{c.valeur}</div>
            {c.sub && <p className="!mt-0.5 !text-[.78rem]">{c.sub}</p>}
            <p className="!mt-0.5">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
