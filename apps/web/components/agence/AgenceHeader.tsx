"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface AgenceHeaderProps {
  onMenuClick: () => void;
}

export function AgenceHeader({ onMenuClick }: AgenceHeaderProps) {
  const { data: session } = useSession();
  const agencyName = session?.user?.name || "Mon Agence";
  const agencyInitials = agencyName.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "AG";
  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 lg:px-8 border-b border-border-dark bg-background-dark/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="relative hidden sm:flex items-center flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 text-slate-500 text-lg">search</span>
          <input
            type="text"
            placeholder="Rechercher un projet, membre..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell userId={session?.user?.id || ""} notificationsHref="/agence/parametres" />

        <Link href="/agence/aide" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-xl">help</span>
        </Link>

        <Link href="/agence/parametres" className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-xl">settings</span>
        </Link>

        {/* Mobile logout button — visible when sidebar is hidden */}
        <button
          onClick={() => signOut({ callbackUrl: "/connexion" })}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          title="Se déconnecter"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>

        <Link href="/agence/profil" className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-border-dark">
          <span className="text-sm font-medium text-white">{agencyName}</span>
          <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden">
            <span className="text-primary text-xs font-bold">{agencyInitials}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
