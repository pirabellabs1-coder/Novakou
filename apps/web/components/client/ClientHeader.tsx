"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface ClientHeaderProps {
  onMenuClick: () => void;
}

export function ClientHeader({ onMenuClick }: ClientHeaderProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 lg:px-8 border-b border-border-dark bg-background-dark/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left: mobile menu + search */}
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
            placeholder="Rechercher un projet..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Right: notifications + settings + user */}
      <div className="flex items-center gap-2">
        <NotificationBell userId={userId} notificationsHref="/client/parametres" />

        <Link href="/client/aide" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-xl">help</span>
        </Link>

        <Link href="/client/parametres" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-xl">settings</span>
        </Link>

        <Link href="/client/profil" className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-border-dark">
          <span className="text-sm font-medium text-white">{session?.user?.name || "Client"}</span>
          <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden">
            <span className="text-primary text-xs font-bold">
              {(session?.user?.name || "C").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
