"use client";

import { useQuery } from "@tanstack/react-query";

type Stats = {
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
 * Politique d'affichage : on ne montre JAMAIS de chiffres bruts (1 vente,
 * 1 créateur, 0 apprenant…) car ça décrédibilise la plateforme. À la place,
 * on affiche des messages de positionnement / croissance neutres et positifs.
 */

export function CreatorsJoinBadge() {
  return (
    <p className="text-sm font-medium text-[#5c647a]">
      <span className="font-bold text-[#191c1e]">Rejoignez les créateurs</span> qui choisissent Novakou
    </p>
  );
}

export function HeroBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f2f4f6] rounded-full border border-[#bccbb9]/20">
      <span className="material-symbols-outlined text-[#006e2f] scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>
        rocket_launch
      </span>
      <span className="text-xs font-bold tracking-wider text-[#3d4a3d] uppercase">
        Plateforme tout-en-un · En pleine croissance
      </span>
    </div>
  );
}

export function PublicStatsStrip() {
  const { data, isLoading } = useQuery<{ data: Stats }>({
    queryKey: ["public-stats"],
    queryFn: () => fetch("/api/formations/public/stats").then((r) => r.json()),
    staleTime: 120_000,
  });

  const s = data?.data;

  const items = [
    { label: "Créateurs", value: s?.totalInstructors ?? 0, icon: "groups" },
    { label: "Apprenants", value: s?.totalLearners ?? 0, icon: "school" },
    { label: "Produits", value: s?.totalProductsCount ?? 0, icon: "inventory_2" },
    { label: "Pays", value: s?.totalCountries ?? 0, icon: "public" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <span className="material-symbols-outlined text-[20px] text-[#006e2f] mb-1 inline-block" style={{ fontVariationSettings: "'FILL' 1" }}>
            {item.icon}
          </span>
          <p className="text-2xl font-extrabold text-[#191c1e]">
            {isLoading ? "…" : item.value.toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-[#5c647a]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
