"use client";

import { cn } from "@/lib/utils";

interface Badge {
  name: string;
  icon: string;
  color: string;
}

const BADGE_CONFIG: Record<string, Badge> = {
  "Rising Talent": { name: "Rising Talent", icon: "trending_up", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  "Top Rated": { name: "Top Rated", icon: "star", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  "Vérifié": { name: "Verifie", icon: "verified", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  "Pro": { name: "Pro", icon: "workspace_premium", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  "Elite": { name: "Elite", icon: "diamond", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  "High Seller": { name: "High Seller", icon: "local_fire_department", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  "Instructeur Certifié": { name: "Instructeur", icon: "school", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  "Agence Vérifiée": { name: "Agence Verifiee", icon: "domain", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
};

interface BadgeDisplayProps {
  badges: string[];
  size?: "sm" | "md";
  maxDisplay?: number;
  className?: string;
}

/**
 * Affiche les badges d'un utilisateur (freelance, agence, instructeur).
 * Utilisable dans les profils, cartes de services, resultats de recherche.
 */
export function BadgeDisplay({ badges, size = "sm", maxDisplay = 3, className = "" }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;

  const displayed = badges.slice(0, maxDisplay);
  const remaining = badges.length - maxDisplay;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {displayed.map((badgeName) => {
        const config = BADGE_CONFIG[badgeName];
        if (!config) return null;

        return (
          <span
            key={badgeName}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-semibold",
              config.color,
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            )}
          >
            <span className={cn("material-symbols-outlined", size === "sm" ? "text-xs" : "text-sm")}>
              {config.icon}
            </span>
            {config.name}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="text-[10px] text-slate-500 font-medium">+{remaining}</span>
      )}
    </div>
  );
}

/**
 * Affiche un seul badge inline (pour les listes de services).
 */
export function InlineBadge({ badge }: { badge: string }) {
  const config = BADGE_CONFIG[badge];
  if (!config) return null;

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold", config.color.split(" ")[0])}>
      <span className="material-symbols-outlined text-xs">{config.icon}</span>
      {config.name}
    </span>
  );
}

/**
 * Badge "Boosted/Sponsorise" pour les services mis en avant.
 */
export function BoostedBadge({ className = "" }: { className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-400/20",
      className
    )}>
      <span className="material-symbols-outlined text-xs">bolt</span>
      Sponsorise
    </span>
  );
}
